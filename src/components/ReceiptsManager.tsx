import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from './Dashboard';
import { supabase } from '../lib/supabase';
import { Printer, Search, Calendar, ChevronRight, ChevronLeft, FileText, X, Download, Send } from 'lucide-react';
import { cn } from '../lib/utils';

export const ReceiptsManager = () => {
  const { restaurant } = useDashboard();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => {
    if (!restaurant) return;
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [restaurant, page, searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*, tables(table_number), order_items(*, menu_items(name))', { count: 'exact' })
        .eq('restaurant_id', restaurant.id)
        .or('status.eq.completed,status.eq.revoked,and(status.eq.cancelled,rejection_reason.eq.revoked)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (searchTerm) {
        query = query.ilike('customer_name', `%${searchTerm}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;
      setOrders(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      console.error('Error fetching orders for receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress || !selectedOrder) return;
    
    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          email: emailAddress,
          order: selectedOrder,
          restaurant: restaurant
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      setIsEmailModalOpen(false);
      setEmailAddress('');
      alert(`Receipt successfully sent to ${emailAddress}`);
    } catch (error) {
      console.error('Error sending email:', error);
      alert(error instanceof Error ? error.message : 'Failed to send receipt. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = () => {
    if (!selectedOrder) return;
    
    let text = `${restaurant.name}\n`;
    if (restaurant.address) text += `${restaurant.address}\n`;
    if (restaurant.phone) text += `Tel: ${restaurant.phone}\n`;
    text += `\nReceipt\n`;
    text += `--------------------------------\n`;
    text += `Order No: ${selectedOrder.id.slice(0, 8).toUpperCase()}\n`;
    text += `Date: ${new Date(selectedOrder.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    text += `Table: ${selectedOrder.tables?.table_number || 'N/A'}\n`;
    if (selectedOrder.customer_name) text += `Customer: ${selectedOrder.customer_name}\n`;
    text += `--------------------------------\n`;
    text += `Item                 Qty   Price\n`;
    text += `--------------------------------\n`;
    
    selectedOrder.order_items?.forEach((item: any) => {
      const name = (item.menu_items?.name || 'Item').substring(0, 20).padEnd(20, ' ');
      const qty = item.quantity.toString().padStart(3, ' ');
      const price = (item.unit_price * item.quantity).toFixed(2).padStart(8, ' ');
      text += `${name} ${qty} ${price}\n`;
    });
    
    text += `--------------------------------\n`;
    text += `Subtotal:           ${(selectedOrder.subtotal || selectedOrder.total_amount).toFixed(2).padStart(12, ' ')}\n`;
    if (selectedOrder.tax_amount > 0) {
      text += `Tax:                ${selectedOrder.tax_amount.toFixed(2).padStart(12, ' ')}\n`;
    }
    text += `Total:              ${selectedOrder.total_amount.toFixed(2).padStart(12, ' ')}\n`;
    text += `\nThank you for your visit!\n`;
    text += `Please come again\n`;

    if (selectedOrder.status === 'revoked' || (selectedOrder.status === 'cancelled' && selectedOrder.rejection_reason === 'revoked')) {
      text += `\n*** REVOKED ***\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${selectedOrder.id.slice(0, 8).toUpperCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* List View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden print:hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Receipts</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Customer Name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No orders found</div>
          ) : (
            <div className="flex flex-col">
              {orders.map((order, index) => {
                const isRevoked = order.status === 'revoked' || (order.status === 'cancelled' && order.rejection_reason === 'revoked');
                
                return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={cn(
                    "w-full text-left p-4 transition-all flex flex-col group border-b border-slate-200 last:border-0",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50",
                    selectedOrder?.id === order.id ? "ring-2 ring-inset ring-brand-500 z-10 relative" : "hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-bold text-slate-900">
                          Order #{order.id.slice(0, 6).toUpperCase()}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                          isRevoked ? "bg-slate-200 text-slate-600" : (order.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")
                        )}>
                          {isRevoked ? 'REVOKED' : order.payment_status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span>{new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Table {order.tables?.table_number || 'N/A'}</span>
                        {order.customer_name && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>{order.customer_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-sm font-bold",
                        isRevoked ? "text-slate-400 line-through" : "text-slate-900"
                      )}>
                        Rs. {order.total_amount?.toFixed(2)}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                </button>
              )})}
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Showing {orders.length > 0 ? page * PAGE_SIZE + 1 : 0} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= totalCount || loading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Receipt Preview */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 print:p-0 print:block print:relative print:z-auto">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm print:hidden" 
            onClick={() => setSelectedOrder(null)} 
          />
          
          {/* Modal Content */}
          <div className="relative bg-slate-50 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden print:bg-white print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center print:hidden">
              <h3 className="text-sm font-bold text-slate-900">Receipt Preview</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100/50 print:p-0 print:bg-transparent">
              {/* Printable Receipt Area */}
              <div className="bg-white p-6 shadow-sm border border-slate-200 w-full max-w-[400px] mx-auto h-max min-h-full print:max-w-full print:border-none print:shadow-none print:p-0 font-mono text-sm text-black relative">
                {(selectedOrder.status === 'revoked' || (selectedOrder.status === 'cancelled' && selectedOrder.rejection_reason === 'revoked')) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                    <div className="border-4 border-slate-300 text-slate-300 text-4xl font-black uppercase tracking-widest px-6 py-2 rounded-xl transform -rotate-45 opacity-40">
                      REVOKED
                    </div>
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <h1 className={cn(
                      "font-bold uppercase mb-1 break-words",
                      restaurant.name.length > 30 ? "text-[10px]" :
                      restaurant.name.length > 24 ? "text-xs" : 
                      restaurant.name.length > 18 ? "text-sm" : 
                      restaurant.name.length > 12 ? "text-base" : "text-xl"
                    )}>
                      {restaurant.name}
                    </h1>
                    {restaurant.address && <p className="text-xs">{restaurant.address}</p>}
                    {restaurant.phone && <p className="text-xs">Tel: {restaurant.phone}</p>}
                    <p className="text-xs mt-2">Receipt</p>
                  </div>

                <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Order No:</span>
                    <span>{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table:</span>
                    <span>{selectedOrder.tables?.table_number || 'N/A'}</span>
                  </div>
                  {selectedOrder.customer_name && (
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>{selectedOrder.customer_name}</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-dashed border-slate-300">
                        <th className="text-left py-1 font-normal">Item</th>
                        <th className="text-center py-1 font-normal">Qty</th>
                        <th className="text-right py-1 font-normal">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.order_items?.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="py-2 pr-2">
                            <div>{item.menu_items?.name || 'Item'}</div>
                            {item.selected_variants && Object.entries(item.selected_variants).map(([k, v]: any) => (
                              <div key={k} className="text-[10px] text-slate-600 ml-2">- {v.name || v}</div>
                            ))}
                          </td>
                          <td className="text-center py-2 align-top">{item.quantity}</td>
                          <td className="text-right py-2 align-top">
                            Rs. {(item.unit_price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {selectedOrder.subtotal?.toFixed(2) || selectedOrder.total_amount?.toFixed(2)}</span>
                  </div>
                  {selectedOrder.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>Rs. {selectedOrder.tax_amount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-dashed border-slate-300">
                    <span>Total:</span>
                    <span>Rs. {selectedOrder.total_amount?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 text-center text-xs">
                  <p>Thank you for your visit!</p>
                  <p className="mt-1">Please come again</p>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Send Receipt</h3>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-sm font-medium"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !emailAddress}
                  className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Receipt
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
