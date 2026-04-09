import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Search, Check, Utensils, ShoppingBag, Minus, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: any;
  onOrderCreated: (isPaid: boolean) => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ isOpen, onClose, restaurant, onOrderCreated }) => {
  const [step, setStep] = useState<'table' | 'items' | 'checkout'>('table');
  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tableLimit, setTableLimit] = useState(24);
  const [itemLimit, setItemLimit] = useState(20);

  useEffect(() => {
    if (isOpen && restaurant?.id) {
      fetchData();
      setStep('table');
      setSelectedTable(null);
      setCart([]);
      setSearchQuery('');
      setTableLimit(24);
      setItemLimit(20);
    }
  }, [isOpen, restaurant?.id]);

  const fetchData = async () => {
    if (!restaurant?.id) return;
    setLoading(true);
    try {
      const [tablesRes, categoriesRes] = await Promise.all([
        supabase.from('tables').select('*').eq('restaurant_id', restaurant.id).order('table_number'),
        supabase.from('categories').select('*, menu_items(*)').eq('restaurant_id', restaurant.id).order('sort_order')
      ]);

      if (tablesRes.data) setTables(tablesRes.data);
      
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
        if (categoriesRes.data.length > 0) {
          setActiveCategoryId(categoriesRes.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const handleSubmit = async (isPaid: boolean) => {
    if (!selectedTable || cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderData: any = {
        restaurant_id: restaurant.id,
        table_id: selectedTable.id,
        status: isPaid ? 'completed' : 'cooking',
        total_amount: totalAmount,
        payment_status: isPaid ? 'paid' : 'unpaid',
        approved_at: new Date().toISOString(),
        completed_at: isPaid ? new Date().toISOString() : null
      };

      let { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      // Fallback if completed_at column doesn't exist yet
      if (orderError && orderError.code === '42703' && orderData.completed_at) {
        delete orderData.completed_at;
        const fallbackResult = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
        order = fallbackResult.data;
        orderError = fallbackResult.error;
      }

      if (orderError) throw orderError;
      if (!order) throw new Error('Failed to create order');

      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (onOrderCreated) onOrderCreated(isPaid);
      onClose();
      toast.success('Order placed successfully');
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (searchQuery.trim()) {
      const allItems: any[] = [];
      categories.forEach(cat => {
        if (cat.menu_items) {
          cat.menu_items.forEach((item: any) => {
            if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              allItems.push(item);
            }
          });
        }
      });
      return allItems;
    }
    const activeCat = categories.find(c => c.id === activeCategoryId);
    return activeCat?.menu_items || [];
  }, [categories, activeCategoryId, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[600px]"
          >
            {/* Minimal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">New Order</h2>
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", step === 'table' ? "bg-slate-900" : "bg-slate-200")} />
                  <div className={cn("w-1.5 h-1.5 rounded-full", step === 'items' ? "bg-slate-900" : "bg-slate-200")} />
                  <div className={cn("w-1.5 h-1.5 rounded-full", step === 'checkout' ? "bg-slate-900" : "bg-slate-200")} />
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-50 rounded text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Step 1: Table Selection */}
              {step === 'table' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {tables.slice(0, tableLimit).map(table => (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTable(table)}
                          className={cn(
                            "aspect-square rounded-lg border flex flex-col items-center justify-center transition-all p-2",
                            selectedTable?.id === table.id
                              ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200"
                              : "border-slate-100 text-slate-600 hover:border-slate-300 bg-slate-50/50"
                          )}
                        >
                          <span className="text-[10px] font-medium opacity-60 uppercase tracking-tighter">Table</span>
                          <span className="text-sm font-bold leading-none mt-0.5">{table.table_number}</span>
                        </button>
                      ))}
                    </div>
                    
                    {tables.length > tableLimit && (
                      <div className="mt-4 flex justify-center">
                        <button 
                          onClick={() => setTableLimit(prev => prev + 24)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 py-2 px-4 border border-slate-100 rounded-lg"
                        >
                          Load More Tables
                        </button>
                      </div>
                    )}

                    {loading && tables.length === 0 && (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-5 h-5 text-slate-200 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-4 border-t border-slate-100 flex justify-end bg-white">
                    <button
                      disabled={!selectedTable}
                      onClick={() => setStep('items')}
                      className="bg-slate-900 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-20"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Menu Selection */}
              {step === 'items' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Slim Search & Categories */}
                  <div className="px-5 py-3 space-y-3 border-b border-slate-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-medium focus:ring-0 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setActiveCategoryId(cat.id);
                            setSearchQuery('');
                            setItemLimit(20);
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                            activeCategoryId === cat.id && !searchQuery
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minimal Items List */}
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    <div className="space-y-1">
                      {filteredItems.slice(0, itemLimit).map((item: any) => {
                        const cartItem = cart.find(i => i.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Utensils className="w-4 h-4 text-slate-200" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                <p className="text-xs font-medium text-slate-400">Rs. {item.price}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {cartItem ? (
                                <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-2 py-1">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 text-slate-300 hover:text-slate-600">
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-bold text-slate-900 min-w-[12px] text-center">{cartItem.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 text-slate-300 hover:text-slate-600">
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {filteredItems.length > itemLimit && (
                        <div className="mt-4 flex justify-center pb-4">
                          <button 
                            onClick={() => setItemLimit(prev => prev + 20)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 py-2 px-4 border border-slate-100 rounded-lg"
                          >
                            Load More Items
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Simple Footer */}
                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <button onClick={() => setStep('table')} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                      Back
                    </button>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-900">Rs. {totalAmount}</span>
                      <button
                        disabled={cart.length === 0}
                        onClick={() => setStep('checkout')}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-20"
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Checkout */}
              {step === 'checkout' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 custom-scrollbar">
                  <div className="max-w-[280px] mx-auto bg-white shadow-xl shadow-slate-200/50 rounded-sm p-6 relative">
                    {/* Receipt Header */}
                    <div className="text-center space-y-1 mb-6">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Receipt</div>
                      <div className="h-px bg-slate-100 w-12 mx-auto" />
                    </div>

                    {/* Order Info */}
                    <div className="border-y border-dashed border-slate-200 py-3 mb-4 text-[10px] font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">TABLE:</span>
                        <span className="font-bold text-slate-900">{selectedTable?.table_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">DATE:</span>
                        <span className="text-slate-900">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-6">
                      {cart.map(item => (
                        <div key={item.id} className="space-y-0.5">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-900 uppercase">{item.name}</span>
                            <span className="text-slate-900 font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <div className="text-[9px] font-mono text-slate-400">
                            {item.quantity} x {item.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400 uppercase">Subtotal</span>
                        <span className="text-slate-900 font-bold">{totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-mono pt-2 border-t border-slate-900">
                        <span className="font-bold text-slate-900 uppercase">Total</span>
                        <span className="font-black text-slate-900">Rs. {totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center space-y-1">
                      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Thank You</div>
                      <div className="flex justify-center gap-1">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-slate-100" />
                        ))}
                      </div>
                    </div>

                    {/* Decorative Cut Edge (Bottom) */}
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-between px-1">
                      {[...Array(14)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-slate-50/50 rounded-full -mt-2" />
                      ))}
                    </div>
                  </div>

                  <div className="max-w-xs mx-auto mt-12 flex flex-col items-center gap-3">
                    <button
                      disabled={submitting}
                      onClick={() => handleSubmit(true)}
                      className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95"
                    >
                      {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Confirm Paid
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => handleSubmit(false)}
                      className="w-full bg-white border border-slate-200 text-slate-500 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Mark as Pending
                    </button>
                    <button
                      onClick={() => setStep('items')}
                      className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Back to Menu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
