import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Utensils, Clock, MapPin, Phone, Star, 
  ChevronLeft,
  ChevronRight, ShoppingBag, Plus, Minus,
  Search, Info, AlertCircle, ArrowRight, QrCode,
  ChevronDown, X, Heart, TrendingUp, CheckCircle, Menu, Ban, User,
  Bell, RefreshCw, Instagram, Facebook, MessageCircle, PhoneCall, Music2, MessageSquare, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';

export const CustomerMenu = () => {
  const { slug, tableNumber } = useParams<{ slug: string; tableNumber: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [restaurant, setRestaurant] = useState<any>(() => {
    const cached = sessionStorage.getItem(`restaurant_${slug}`);
    return cached ? JSON.parse(cached) : null;
  });
  const [categories, setCategories] = useState<any[]>(() => {
    const cached = sessionStorage.getItem(`categories_${slug}`);
    return cached ? JSON.parse(cached) : [];
  });
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(() => {
    const cached = sessionStorage.getItem(`categories_${slug}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.length > 0) {
        const hasOffers = parsed.some((cat: any) => (cat.menu_items || []).some((item: any) => item.is_on_offer));
        return hasOffers ? 'offers' : parsed[0].id;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!restaurant);
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localOrderIds, setLocalOrderIds] = useState<string[]>([]);
  const [localWaiterCallIds, setLocalWaiterCallIds] = useState<string[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [waiterCallHistory, setWaiterCallHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isRequestItemsOpen, setIsRequestItemsOpen] = useState(false);
  const [waiterRequest, setWaiterRequest] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [selectedAssistanceItems, setSelectedAssistanceItems] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);
  const [tableId, setTableId] = useState<string | null>(null);
  const [config, setConfig] = useState<any>({
    banners: [],
    showRating: true,
    showPrepTime: true,
    showSearch: true
  });

  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const headerOpacity = useTransform(scrollY, [250, 350], [0, 1]);
  const headerY = useTransform(scrollY, [250, 350], [-100, 0]);
  const heroContentOpacity = useTransform(scrollY, [150, 350], [1, 0]);
  const heroContentY = useTransform(scrollY, [150, 350], [0, 20]);

  useEffect(() => {
    const validateSession = async () => {
      if (!tableNumber) return; // Only validate session if a table number is provided

      if (!sessionId) {
        setSessionError('Invalid session. Please scan the QR code on your table to view the menu and order.');
        return;
      }

      try {
        const { data: session, error } = await supabase
          .from('table_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error || !session) {
          throw new Error('Session not found.');
        }

        let expiryString = session.expires_at;
        if (!expiryString.endsWith('Z') && !expiryString.includes('+')) {
          expiryString += 'Z'; // Assume UTC if no timezone is provided by Supabase
        }
        const expiryDate = new Date(expiryString);
        const now = new Date();

        if (expiryDate < now) {
          throw new Error('Session expired.');
        }
        
        // Clear error if session is valid
        setSessionError(null);
      } catch (err) {
        console.error('Session validation error:', err);
        setSessionError('Session expired. Please scan the QR code on your table again.');
      }
    };

    validateSession();

    // Periodic check every 10 seconds for faster response to expiry
    const interval = setInterval(validateSession, 10000);
    return () => clearInterval(interval);
  }, [tableNumber, sessionId]);

  useEffect(() => {
    if (slug && !sessionError) {
      fetchMenuData();
    }
  }, [slug, sessionError]);

  useEffect(() => {
    const savedOrders = localStorage.getItem(`orders_${slug}`);
    if (savedOrders) {
      setLocalOrderIds(JSON.parse(savedOrders));
    }
    const savedCalls = localStorage.getItem(`waiter_calls_${slug}`);
    if (savedCalls) {
      setLocalWaiterCallIds(JSON.parse(savedCalls));
    }
  }, [slug]);

  const fetchOrderHistory = async () => {
    setLoadingHistory(true);
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // 1. Fetch Orders
      if (localOrderIds.length > 0) {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, menu_items(*)), tables(table_number)')
          .in('id', localOrderIds)
          .gte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setOrderHistory(data || []);
      } else {
        setOrderHistory([]);
      }

      // 2. Fetch Waiter Calls
      if (localWaiterCallIds.length > 0) {
        const { data: callData, error: callError } = await supabase
          .from('waiter_calls')
          .select('*')
          .in('id', localWaiterCallIds)
          .gte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: false });
        
        if (callError) throw callError;
        setWaiterCallHistory(callData || []);
      } else {
        setWaiterCallHistory([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOrdersOpen) {
      fetchOrderHistory();
    }
  }, [isOrdersOpen, localOrderIds, localWaiterCallIds]);

  const fetchMenuData = async () => {
    if (!restaurant) setLoading(true);
    try {
      const { data: restData, error: restError } = await supabase
        .from('restaurants')
        .select('id, name, slug, logo_url, hero_image_url, storefront_config, address, phone, is_active')
        .eq('slug', slug)
        .single();

      if (restError) throw restError;
      
      if (restData.is_active === false) {
        setError('This restaurant is currently suspended. Please contact the restaurant directly for more information.');
        setLoading(false);
        return;
      }

      if (restData.storefront_config?.is_open === false) {
        setError('Restaurant is currently closed. Please check back later or contact us directly.');
        setLoading(false);
        return;
      }

      setRestaurant(restData);
      sessionStorage.setItem(`restaurant_${slug}`, JSON.stringify(restData));
      
      // Fetch table ID if tableNumber is provided
      if (tableNumber) {
        const { data: tableData } = await supabase
          .from('tables')
          .select('id')
          .eq('restaurant_id', restData.id)
          .eq('table_number', tableNumber)
          .single();
        
        if (tableData) setTableId(tableData.id);
      }

      if (restData.storefront_config) {
        setConfig(restData.storefront_config);
      }

      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*, menu_items(*)')
        .eq('restaurant_id', restData.id)
        .order('sort_order', { ascending: true });

      if (catError) throw catError;
      
      // Filter out invisible items
      const processedCategories = catData.map(cat => ({
        ...cat,
        menu_items: (cat.menu_items || []).filter((item: any) => item.is_visible !== false)
      })).filter(cat => cat.menu_items.length > 0);

      setCategories(processedCategories);
      sessionStorage.setItem(`categories_${slug}`, JSON.stringify(processedCategories));
      
      if (processedCategories.length > 0) {
        const hasOffers = processedCategories.some(cat => cat.menu_items.some((item: any) => item.is_on_offer));
        setActiveCategoryId(hasOffers ? 'offers' : processedCategories[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching menu:', err);
      setError('Menu not found or restaurant is currently unavailable.');
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

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const cartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !restaurant) return;
    
    if (!customerName.trim()) {
      alert('Please enter your name before placing the order.');
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      // Validate session again before ordering
      if (tableNumber && sessionId) {
        const { data: session, error: sessionError } = await supabase
          .from('table_sessions')
          .select('expires_at')
          .eq('id', sessionId)
          .single();
          
        let expiryString = session.expires_at;
        if (!expiryString.endsWith('Z') && !expiryString.includes('+')) {
          expiryString += 'Z';
        }
        if (sessionError || !session || new Date(expiryString) < new Date()) {
          setSessionError('Session expired. Please scan the QR code on your table again.');
          setIsPlacingOrder(false);
          return;
        }
      }

      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          restaurant_id: restaurant.id,
          table_id: tableId,
          total_amount: cartTotal,
          status: 'pending',
          payment_status: 'unpaid',
          customer_name: customerName.trim()
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
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

      // 3. Success!
      const updatedOrderIds = [order.id, ...localOrderIds].slice(0, 10); // Keep last 10
      setLocalOrderIds(updatedOrderIds);
      localStorage.setItem(`orders_${slug}`, JSON.stringify(updatedOrderIds));
      
      setCart([]);
      setIsCartOpen(false);
      setPlacedOrder(order);
    } catch (err: any) {
      console.error('Error placing order:', err);
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCallWaiter = async (requestText?: string) => {
    if (!restaurant) return;
    
    setIsCallingWaiter(true);
    try {
      // Validate session again before calling waiter
      if (tableNumber && sessionId) {
        const { data: session, error: sessionError } = await supabase
          .from('table_sessions')
          .select('expires_at')
          .eq('id', sessionId)
          .single();
          
        let expiryString = session.expires_at;
        if (!expiryString.endsWith('Z') && !expiryString.includes('+')) {
          expiryString += 'Z';
        }
        if (sessionError || !session || new Date(expiryString) < new Date()) {
          setSessionError('Session expired. Please scan the QR code on your table again.');
          setIsCallingWaiter(false);
          return;
        }
      }

      const { data: insertedData, error } = await supabase
        .from('waiter_calls')
        .insert([{
          restaurant_id: restaurant.id,
          table_id: tableId,
          table_number: tableNumber || 'Guest',
          status: 'pending',
          request: requestText || 'Assistance requested'
        }])
        .select();

      if (error) throw error;

      if (insertedData && insertedData[0]) {
        const updatedCallIds = [insertedData[0].id, ...localWaiterCallIds].slice(0, 10);
        setLocalWaiterCallIds(updatedCallIds);
        localStorage.setItem(`waiter_calls_${slug}`, JSON.stringify(updatedCallIds));
      }
      
      setIsSidebarOpen(false);
      setIsRequestModalOpen(false);
      setIsRequestItemsOpen(false);
      setWaiterRequest('');
      setSelectedAssistanceItems([]);
    } catch (err: any) {
      console.error('Error calling waiter:', err);
      // Fallback if table doesn't exist
      if (err.message.includes('relation "waiter_calls" does not exist') || err.message.includes('schema cache')) {
        alert('Waiter calling feature is being configured by the administrator. Please call staff manually for now.');
      } else {
        alert(`Failed to send request: ${err.message}`);
      }
    } finally {
      setIsCallingWaiter(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || !restaurant) return;
    
    setIsSubmittingFeedback(true);
    try {
      // Validate session if table number is provided
      if (tableNumber && sessionId) {
        const { data: session } = await supabase
          .from('table_sessions')
          .select('expires_at')
          .eq('id', sessionId)
          .single();
          
        if (session) {
          let expiryString = session.expires_at;
          if (!expiryString.endsWith('Z') && !expiryString.includes('+')) {
            expiryString += 'Z';
          }
          if (new Date(expiryString) < new Date()) {
            setSessionError('Session expired. Please scan the QR code on your table again.');
            setIsSubmittingFeedback(false);
            return;
          }
        }
      }

      let finalName = customerName;
      let finalTable = tableNumber;

      // If not anonymous and name/table not set, try to get from most recent order
      if (!isAnonymous && (!finalName || !finalTable)) {
        const recentOrder = orderHistory[0];
        if (recentOrder) {
          finalName = finalName || recentOrder.customer_name;
          finalTable = finalTable || recentOrder.tables?.table_number;
        }
      }

      const { error } = await supabase
        .from('feedbacks')
        .insert([{
          restaurant_id: restaurant.id,
          table_number: isAnonymous ? null : (finalTable || null),
          customer_name: isAnonymous ? 'Anonymous' : (finalName || 'Customer'),
          feedback: feedbackText,
          is_anonymous: isAnonymous,
          status: 'pending'
        }]);

      if (error) throw error;

      setIsFeedbackModalOpen(false);
      setFeedbackText('');
      setIsAnonymous(false);
      setIsSidebarOpen(false);
      setShowFeedbackSuccess(true);
    } catch (err: any) {
      console.error('Error sending feedback:', err);
      toast.error('Failed to send feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (sessionError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-serif text-slate-900 mb-2 italic">Session Expired</h1>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">{sessionError}</p>
        <div className="space-y-4 w-full max-w-xs">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">To continue ordering</p>
          <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-3">
            <QrCode className="w-12 h-12 text-slate-300" />
            <p className="text-[10px] text-slate-500 font-medium">Please scan the QR code on your table again to start a new session.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full mb-4" 
        />
        <p className="text-slate-400 font-serif italic text-lg animate-pulse">Curating your experience...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-serif text-slate-900 mb-2 italic">Something went wrong</h1>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">{error || 'Unable to load the menu at this time.'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold shadow-2xl hover:bg-slate-800 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const offerItems = categories.flatMap(cat => cat.menu_items || []).filter((item: any) => item?.is_on_offer);
  const displayCategories = offerItems.length > 0 
    ? [{ id: 'offers', name: 'Special Offers', menu_items: offerItems }, ...categories]
    : categories;

  const filteredCategories = displayCategories.map(cat => ({
    ...cat,
    menu_items: (cat.menu_items || []).filter((item: any) => 
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.menu_items && cat.menu_items.length > 0);

  const combinedHistory = [
    ...orderHistory.map(o => ({ ...o, historyType: 'order' })),
    ...waiterCallHistory.map(c => ({ ...c, historyType: 'call' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div 
      className="min-h-screen bg-[#F9F8F6] font-sans text-slate-900 selection:bg-brand-100" 
      style={{ 
        '--color-brand-50': (config.themeColor || '#0F172A') + '10',
        '--color-brand-100': (config.themeColor || '#0F172A') + '20',
        '--color-brand-200': (config.themeColor || '#0F172A') + '40',
        '--color-brand-300': (config.themeColor || '#0F172A') + '60',
        '--color-brand-400': (config.themeColor || '#0F172A') + '80',
        '--color-brand-500': config.themeColor || '#0F172A',
        '--color-brand-600': config.themeColor || '#0F172A',
        '--color-brand-700': config.themeColor || '#0F172A',
        '--brand-600': config.themeColor || '#0F172A'
      } as React.CSSProperties}
    >
      <style>{`
        :root {
          --brand-primary: ${config.themeColor || '#0F172A'};
          --brand-light: ${config.themeColor || '#0F172A'}15;
          --brand-border: ${config.themeColor || '#0F172A'}30;
        }
        .text-brand-600 { color: var(--brand-primary) !important; }
        .bg-brand-600 { background-color: var(--brand-primary) !important; }
        .border-brand-600 { border-color: var(--brand-primary) !important; }
        .ring-brand-600 { --tw-ring-color: var(--brand-primary) !important; }
        .hover\\:bg-brand-600:hover { background-color: var(--brand-primary) !important; filter: brightness(0.9); }
        .bg-brand-50 { background-color: var(--brand-light) !important; }
        .text-brand-500 { color: var(--brand-primary) !important; }
        .bg-brand-500 { background-color: var(--brand-primary) !important; }
        .border-brand-100 { border-color: var(--brand-border) !important; }
        .hover\\:bg-brand-100:hover { background-color: var(--brand-light) !important; }
        .active-category { background-color: var(--brand-primary) !important; color: white !important; }
        .category-pill:hover { background-color: var(--brand-light) !important; }
        .cart-badge { background-color: var(--brand-primary) !important; }
        .btn-primary { background-color: var(--brand-primary) !important; color: white !important; }
        .text-brand-accent { color: var(--brand-primary) !important; }
        input:focus { outline: none !important; box-shadow: none !important; border-color: transparent !important; }
      `}</style>
      {/* Intro Modal */}
      <AnimatePresence>
        {showIntro && (
          <div className="fixed inset-0 z-[200] grid place-items-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] my-auto"
            >
              <div className="p-8 sm:p-10 text-center space-y-8">
                <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <QrCode className="w-10 h-10 text-brand-600" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-serif italic font-bold text-slate-900 leading-tight">Welcome to {restaurant.name}</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    Experience our smart dining system. Browse our exquisite menu, place orders, and request assistance directly from your table.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: <ShoppingBag className="w-4 h-4" />, title: "Self-Ordering", desc: "Order items instantly" },
                    { icon: <Bell className="w-4 h-4" />, title: "Waiter Call", desc: "Request help anytime" },
                    { icon: <Clock className="w-4 h-4" />, title: "Live Tracking", desc: "See your order status" }
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{feature.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    setShowIntro(false);
                  }}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  Start Ordering
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-[120] grid place-items-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsRequestModalOpen(false);
                setIsSidebarOpen(true);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-[360px] bg-white rounded-[2rem] shadow-2xl p-6 space-y-6 overflow-hidden max-h-[90vh] my-auto"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-serif italic font-bold text-slate-900">How can we help?</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select your preference</p>
                </div>
                <button onClick={() => {
                  setIsRequestModalOpen(false);
                  setIsRequestItemsOpen(false);
                  setIsSidebarOpen(true);
                }} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                {!isRequestItemsOpen ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleCallWaiter('Waiter requested in person')}
                      disabled={isCallingWaiter}
                      className="w-full p-4 bg-brand-50 border border-brand-100 rounded-2xl flex items-center gap-4 group hover:bg-brand-100 transition-all text-left shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-600 shadow-sm group-hover:scale-110 transition-transform">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">Call Waiter</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Staff will come to your table</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setIsRequestItemsOpen(true)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 group hover:bg-slate-100 transition-all text-left shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">Request Items</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Napkins, water, or more</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {['Napkins', 'Water', 'Bill', 'Cutlery'].map((item) => {
                        const isSelected = selectedAssistanceItems.includes(item);
                        return (
                          <button
                            key={item}
                            onClick={() => {
                              setSelectedAssistanceItems(prev => 
                                isSelected ? prev.filter(i => i !== item) : [...prev, item]
                              );
                            }}
                            className={cn(
                              "py-3 px-3 rounded-xl text-xs font-bold transition-all border text-center",
                              isSelected 
                                ? "bg-brand-600 text-white border-brand-600 shadow-md" 
                                : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100"
                            )}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="space-y-3">
                      <textarea 
                        value={waiterRequest}
                        onChange={(e) => setWaiterRequest(e.target.value)}
                        placeholder="Type custom request here..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all min-h-[100px] resize-none"
                      />
                      <button
                        onClick={() => {
                          const combinedRequest = [
                            ...selectedAssistanceItems,
                            waiterRequest.trim()
                          ].filter(Boolean).join(', ');
                          handleCallWaiter(combinedRequest || 'Assistance requested');
                        }}
                        disabled={isCallingWaiter || (selectedAssistanceItems.length === 0 && !waiterRequest.trim())}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95",
                          (selectedAssistanceItems.length > 0 || waiterRequest.trim())
                            ? "bg-brand-600 text-white shadow-brand-200"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {isCallingWaiter ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending...</span>
                          </div>
                        ) : 'Send Request'}
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        setIsRequestItemsOpen(false);
                        setSelectedAssistanceItems([]);
                        setWaiterRequest('');
                      }}
                      className="w-full py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      Go Back
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackModalOpen && (
          <div className="fixed inset-0 z-[120] grid place-items-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFeedbackModalOpen(false);
                setIsSidebarOpen(true);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-[360px] bg-white rounded-[2rem] shadow-2xl p-6 space-y-6 overflow-hidden max-h-[90vh] my-auto"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-serif italic font-bold text-slate-900">Give Feedback</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">We value your opinion</p>
                </div>
                <button onClick={() => {
                  setIsFeedbackModalOpen(false);
                  setIsSidebarOpen(true);
                }} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all min-h-[150px] resize-none"
                />
                
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-all duration-300",
                        isAnonymous ? "bg-brand-500" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
                        isAnonymous ? "right-0.5" : "left-0.5"
                      )} />
                    </button>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Submit Anonymously</span>
                  </div>
                </div>

                <button
                  onClick={handleSendFeedback}
                  disabled={isSubmittingFeedback || !feedbackText.trim()}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                    feedbackText.trim()
                      ? "bg-brand-600 text-white shadow-brand-200"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {isSubmittingFeedback ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-[70] px-6 py-4 flex items-center justify-between">
        <motion.div 
          style={{ opacity: headerOpacity, y: headerY }}
          className="absolute inset-0 bg-white border-b border-slate-100 shadow-sm -z-10"
        />
        <motion.div 
          style={{ opacity: headerOpacity, y: headerY }}
          className="flex items-center gap-3"
        >
          {restaurant.logo_url && (
            <img src={restaurant.logo_url} className="w-8 h-8 object-contain" alt="Logo" referrerPolicy="no-referrer" />
          )}
          <h2 className="font-serif italic text-xl font-bold tracking-tight text-slate-900">{restaurant.name}</h2>
        </motion.div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-brand-200 relative z-10"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Customer Sidebar (Right Menu) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[110] shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {restaurant.logo_url && (
                    <img src={restaurant.logo_url} className="w-8 h-8 object-contain" alt="Logo" />
                  )}
                  <h3 className="font-serif italic text-lg font-bold">Menu</h3>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Features</p>
                
                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsOrdersOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-all text-slate-700 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">My Orders</p>
                    <p className="text-[10px] text-slate-400 font-medium">View your recent history</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsRequestModalOpen(true);
                  }}
                  disabled={isCallingWaiter}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-all text-slate-700 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    {isCallingWaiter ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Call Waiter</p>
                    <p className="text-[10px] text-slate-400 font-medium">Request items or assistance</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsFeedbackModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-all text-slate-700 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Give Feedback</p>
                    <p className="text-[10px] text-slate-400 font-medium">Share your experience with us</p>
                  </div>
                </button>

                {/* Dynamic Social Links Removed from Sidebar */}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Table {tableNumber || 'Guest'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Dining Session</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium text-center italic">
                  Enjoy your meal at {restaurant.name}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-[40vh] sm:h-[50vh] lg:h-[70vh] overflow-hidden">
        <motion.div style={{ scale: heroScale }} className="absolute inset-0">
          {restaurant.hero_image_url ? (
            <img 
              src={restaurant.hero_image_url} 
              className="w-full h-full object-cover" 
              alt={restaurant.name}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <Utensils className="w-32 h-32 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16 text-white max-w-7xl mx-auto w-full">
          <motion.div 
            style={{ opacity: heroContentOpacity, y: heroContentY }}
            className="space-y-6"
          >
            {restaurant.logo_url && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 lg:w-24 lg:h-24 bg-white rounded-3xl p-3 shadow-2xl flex items-center justify-center border border-white/20"
              >
                <img src={restaurant.logo_url} className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
              </motion.div>
            )}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                  Table {tableNumber || 'Guest'}
                </span>
                {config.social && (
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
                    {[
                      { label: 'Instagram', key: 'instagram', icon: Instagram },
                      { label: 'Facebook', key: 'facebook', icon: Facebook },
                      { label: 'WhatsApp', key: 'whatsapp', icon: MessageCircle, prefix: 'https://wa.me/' },
                      { label: 'TikTok', key: 'tiktok', icon: Music2 },
                    ].map((social) => {
                      const isEnabled = config.social?.[`${social.key}_enabled`] !== false;
                      const url = config.social?.[social.key];
                      if (!isEnabled || !url) return null;

                      return (
                        <a 
                          key={social.key}
                          href={social.prefix ? `${social.prefix}${url}` : ensureAbsoluteUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-all active:scale-95 hover:opacity-70 text-slate-900"
                          title={social.label}
                        >
                          <social.icon className="w-3.5 h-3.5" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-7xl font-serif italic font-bold tracking-tight leading-tight">
                {restaurant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm font-medium">
                {config.showPrepTime !== false && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 15 - 25 min
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {restaurant.address?.split(',')[0] || 'Premium Dining'}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {restaurant.phone || 'Contact for info'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 lg:px-16 mt-4 sm:-mt-12 relative z-20 pb-32">
        {/* Search & Filter Bar */}
        {config.showSearch !== false && (
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-4 px-4">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search our exquisite menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-base font-medium text-slate-900 placeholder:text-slate-400 py-4"
              />
            </div>
          </div>
        )}

        {/* Category Navigation */}
        <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl py-4 -mx-6 px-6 overflow-x-auto no-scrollbar border-b border-slate-100 snap-x snap-mandatory">
          <div className="flex items-center gap-3 snap-x">
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  document.getElementById(cat.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                  className={cn(
                    "px-4 py-2 sm:px-6 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all border snap-start",
                    activeCategoryId === cat.id
                      ? "active-category border-brand-600 shadow-xl shadow-slate-200 scale-105"
                      : "category-pill bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="mt-8 sm:mt-12 space-y-12 sm:space-y-24">
          {filteredCategories.map((cat, index) => (
            <React.Fragment key={cat.id}>
              <div 
                id={cat.id} 
                className={cn(
                  "space-y-6 sm:space-y-8 scroll-mt-40 rounded-2xl sm:rounded-[2rem]",
                  cat.id === 'offers' ? "bg-emerald-50/50 border border-emerald-100 shadow-sm p-4 sm:p-8" : ""
                )}
              >
              <div className={cn(
                "flex items-end justify-between border-b pb-4",
                cat.id === 'offers' ? "border-emerald-200/50" : "border-slate-200"
              )}>
                <div className="space-y-1">
                  <h2 className={cn(
                    "text-xl sm:text-3xl font-serif italic font-bold",
                    cat.id === 'offers' ? "text-emerald-700" : "text-slate-900"
                  )}>{cat.name}</h2>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.2em]",
                    cat.id === 'offers' ? "text-emerald-500" : "text-slate-400"
                  )}>Exquisite Selection</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.menu_items.length} Options</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-8">
                {cat.menu_items.map((item: any) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setSelectedMenuItem(item)}
                    className={cn(
                      "group bg-white rounded-2xl sm:rounded-[2rem] border p-3 sm:p-5 hover:shadow-2xl transition-all duration-500 relative overflow-hidden cursor-pointer",
                      cat.id === 'offers' ? "border-emerald-100 shadow-emerald-100/20 hover:shadow-emerald-200/40" : "border-slate-100 hover:shadow-slate-200"
                    )}
                  >
                    <div className="flex flex-col h-full gap-3 sm:gap-6">
                      {item.image_url && (
                        <div className="relative aspect-square sm:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-inner">
                          <img 
                            src={item.image_url} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            alt={item.name}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-2">
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 sm:p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-900 hover:bg-white transition-all"
                            >
                              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-1 sm:space-y-3">
                        <div className="flex flex-row items-start justify-between gap-2 sm:gap-4">
                          <div className="space-y-1">
                            <h3 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight group-hover:text-brand-600 transition-colors line-clamp-2">
                              {item.name}
                            </h3>
                            {item.is_chef_special && (
                              <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">
                                Chef's Special
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-1.5 sm:flex-col sm:items-end sm:gap-0 shrink-0">
                            {item.is_on_offer && item.original_price && (
                              <span className="text-xs sm:text-sm text-red-500 line-through font-bold">
                                Rs.{item.original_price}
                              </span>
                            )}
                            <span className={cn(
                              "text-sm sm:text-xl font-serif italic font-bold",
                              item.is_on_offer ? "text-emerald-600" : "text-slate-900"
                            )}>
                              Rs.{item.price}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 sm:line-clamp-3">
                          {item.description || 'A masterpiece of flavor, crafted with the finest seasonal ingredients and culinary expertise.'}
                        </p>
                      </div>

                        <div className="flex items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                          {item.is_sold_out ? (
                            <button 
                              disabled
                              className="flex-1 py-2 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 bg-slate-100 text-slate-400 cursor-not-allowed"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              Sold
                            </button>
                          ) : cart.find(i => i.id === item.id) ? (
                            <div className="flex-1 flex items-center justify-between bg-brand-50 rounded-xl sm:rounded-2xl p-1 border border-brand-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.id);
                                }}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-lg sm:rounded-xl text-brand-600 shadow-sm hover:bg-brand-100 transition-colors"
                              >
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <span className="text-[10px] sm:text-xs font-bold text-brand-700">
                                {cart.find(i => i.id === item.id)?.quantity}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(item);
                                }}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-brand-600 rounded-lg sm:rounded-xl text-white shadow-sm hover:bg-brand-700 transition-colors"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(item);
                              }}
                              className="flex-1 py-2 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 group/btn btn-primary shadow-lg shadow-brand-200/20"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:rotate-90 transition-transform" />
                              Add to order
                            </button>
                          )}
                        </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              </div>

              {/* Promotional Banner Injection */}
              {config.banners && config.banners[index] && config.banners[index].image_url && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative h-48 sm:h-64 lg:h-80 rounded-3xl sm:rounded-[3rem] overflow-hidden group cursor-pointer"
                >
                  <img 
                    src={config.banners[index].image_url} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    alt="Promotion"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-6 sm:p-12 text-white">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="max-w-md space-y-4"
                    >
                      <span className="px-3 py-1 bg-brand-500 rounded-full text-[10px] font-bold uppercase tracking-widest">Special Offer</span>
                      <h3 className="text-2xl sm:text-4xl font-serif italic font-bold leading-tight">{config.banners[index].title}</h3>
                      <p className="text-white/80 text-sm font-medium">{config.banners[index].subtitle}</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </React.Fragment>
          ))}

          {filteredCategories.length === 0 && (
            <div className="py-32 text-center space-y-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl border border-slate-50">
                <Search className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif italic font-bold text-slate-900">No matches found</h3>
                <p className="text-slate-400 font-medium text-sm">Try searching for something else or browse our categories.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-6 lg:px-16 mt-auto relative z-20 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Utensils className="w-8 h-8 text-brand-500 mx-auto mb-6 opacity-80" />
          <h4 className="text-white font-serif italic font-bold text-3xl mb-6">{config.footerTitle || 'Our Culinary Philosophy'}</h4>
          <p className="text-lg leading-relaxed text-slate-300 font-serif italic max-w-2xl mx-auto mb-12">
            "{config.footerDescription || "We believe that a great meal is more than just food—it is an experience, a memory, and a celebration of life's simple pleasures. Every dish we serve is crafted with passion, honoring tradition while embracing innovation."}"
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-slate-800" />
            <span className="text-white font-bold text-xs uppercase tracking-[0.3em]">{restaurant.name}</span>
            <div className="h-px w-12 bg-slate-800" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800/50 text-xs text-center flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-slate-500">© {new Date().getFullYear()} {restaurant.name}. Crafted with passion.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Quality Ingredients</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>Exceptional Service</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>Unforgettable Taste</span>
          </div>
        </div>
      </footer>

      {/* Floating Cart & Checkout */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full btn-primary p-1.5 rounded-2xl shadow-2xl flex items-center justify-between group active:scale-95 transition-all overflow-hidden"
            >
              <div className="flex items-center gap-3 pl-4">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-brand-500" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center border-2 border-slate-900">
                    {cartCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] leading-none mb-0.5">Your Selection</p>
                  <p className="text-xs font-bold">Review Order</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md border border-white/10">
                <span className="text-sm font-serif italic font-bold">Rs. {cartTotal}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Order History Drawer */}
      <AnimatePresence>
        {isOrdersOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOrdersOpen(false);
                setIsSidebarOpen(true);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[90] shadow-2xl flex flex-col rounded-l-2xl sm:rounded-l-[3rem]"
            >
              <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setIsOrdersOpen(false);
                      setIsSidebarOpen(true);
                    }}
                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="space-y-0.5 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-serif italic font-bold text-slate-900 truncate">Order & Assistance History</h2>
                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Recent activities on this device (Last 24h)</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsOrdersOpen(false);
                    setIsSidebarOpen(true);
                  }}
                  className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all shrink-0 sm:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-8">
                {loadingHistory ? (
                  <div className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading history...</p>
                  </div>
                ) : combinedHistory.length > 0 ? (
                  <div className="space-y-4">
                    {combinedHistory.map((item: any) => {
                      if (item.historyType === 'call') {
                        return (
                          <div key={item.id} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                              <PhoneCall className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                                  {item.request === 'Assistance requested' ? 'Waiter Called' : 'Item Requested'}
                                </p>
                                <span className={cn(
                                  "text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                                  item.status === 'resolved' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                )}>
                                  {item.status}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-900 mb-1">{item.request}</p>
                              <p className="text-[9px] text-slate-400 font-medium">
                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-sm font-bold text-slate-900">Order #{item.id.slice(0, 8).toUpperCase()}</p>
                                {item.tables?.table_number && (
                                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Table {item.tables.table_number}</p>
                                )}
                              </div>
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                item.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                item.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                item.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                {item.status}
                              </span>
                            </div>

                            {item.status === 'cancelled' && item.rejection_reason && (
                              <div className="p-3 bg-red-50 rounded-xl border border-red-100 space-y-1">
                                <div className="flex items-center gap-1.5 text-red-600">
                                  <Ban className="w-3 h-3" />
                                  <span className="text-[9px] font-bold uppercase tracking-widest">Rejection Reason</span>
                                </div>
                                <p className="text-[11px] font-medium text-red-900/80 leading-relaxed italic">"{item.rejection_reason}"</p>
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              {item.order_items?.map((orderItem: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs font-medium text-slate-600">
                                  <span>{orderItem.quantity}x {orderItem.menu_items?.name}</span>
                                  <span>Rs. {orderItem.unit_price * orderItem.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Total Amount</span>
                              <span className="text-lg font-serif italic font-bold text-slate-900">Rs. {item.total_amount}</span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-900 font-serif italic text-lg font-bold">No history yet</p>
                      <p className="text-slate-400 text-xs font-medium">Your orders and requests will appear here.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
                  Order history is stored locally on this device for your convenience and privacy.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer / Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[90] shadow-2xl flex flex-col rounded-l-2xl sm:rounded-l-[3rem]"
            >
              <div className="p-5 sm:p-8 flex items-center justify-between border-b border-slate-100 shrink-0">
                <div className="space-y-1 min-w-0">
                  <h2 className="text-xl sm:text-3xl font-serif italic font-bold text-slate-900 truncate">Your Order</h2>
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Table {tableNumber || 'Guest'}</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 sm:p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Utensils className="w-8 h-8 text-slate-200" /></div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <p className="text-sm font-serif italic text-brand-600 font-bold">Rs. {item.price}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {cart.length > 0 && (
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                      <input 
                        type="text"
                        placeholder="Enter your name to identify your order"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-base font-bold focus:bg-white focus:border-brand-600 focus:ring-0 transition-all"
                      />
                    </div>
                  </div>
                )}
                
                {cart.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Your cart is empty</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 font-medium">Subtotal</span>
                  <span className="text-lg font-serif italic font-bold">Rs. {cartTotal}</span>
                </div>
                <button 
                  disabled={cart.length === 0 || isPlacingOrder}
                  onClick={handleCheckout}
                  className="w-full btn-primary py-4 rounded-2xl font-bold text-sm shadow-2xl shadow-brand-200/30 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Order'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Styles for Scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Feedback Success Modal */}
      <AnimatePresence>
        {showFeedbackSuccess && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackSuccess(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] my-auto"
            >
              <div className="p-6 sm:p-10 text-center space-y-6 sm:space-y-8">
                <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                    className="absolute inset-0 bg-brand-500 rounded-full flex items-center justify-center shadow-lg shadow-brand-200"
                  >
                    <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-3 sm:-inset-4 border-2 border-brand-500/30 rounded-full"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Thank You!</h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                    We truly appreciate your feedback. We promise to use it to provide an even better experience for you next time.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowFeedbackSuccess(false);
                    setIsSidebarOpen(true);
                  }}
                  className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {placedOrder && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlacedOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] my-auto"
            >
              <div className="p-6 sm:p-10 text-center space-y-6 sm:space-y-8">
                <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                    className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200"
                  >
                    <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-3 sm:-inset-4 border-2 border-emerald-500/30 rounded-full"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Order Placed!</h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                    Your order has been sent to the kitchen. Please relax while we prepare your meal.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-1 sm:space-y-2 border border-slate-100">
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Order Identification</p>
                  <p className="text-xl sm:text-2xl font-black text-brand-600 tracking-tighter">#{placedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <button 
                  onClick={() => {
                    setPlacedOrder(null);
                    setIsSidebarOpen(true);
                  }}
                  className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Menu Item Detail Modal */}
      <AnimatePresence>
        {selectedMenuItem && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMenuItem(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedMenuItem(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto flex-1 no-scrollbar">
                {selectedMenuItem.image_url && (
                  <div className="relative aspect-video sm:aspect-[16/9] bg-slate-50">
                    <img 
                      src={selectedMenuItem.image_url} 
                      className="w-full h-full object-contain" 
                      alt={selectedMenuItem.name}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  </div>
                )}

                <div className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-2xl sm:text-3xl font-serif italic font-bold text-slate-900 leading-tight">
                        {selectedMenuItem.name}
                      </h2>
                      <div className="flex items-center justify-end gap-2 sm:flex-col sm:items-end sm:gap-0 shrink-0">
                        {selectedMenuItem.is_on_offer && selectedMenuItem.original_price && (
                          <span className="text-sm sm:text-base text-red-500 line-through font-bold">
                            Rs.{selectedMenuItem.original_price}
                          </span>
                        )}
                        <span className={cn(
                          "text-xl sm:text-2xl font-serif italic font-bold",
                          selectedMenuItem.is_on_offer ? "text-emerald-600" : "text-brand-600"
                        )}>
                          Rs.{selectedMenuItem.price}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedMenuItem.is_chef_special && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold uppercase tracking-widest">
                          Chef's Special
                        </span>
                      )}
                      {selectedMenuItem.is_vegetarian && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold uppercase tracking-widest">
                          Vegetarian
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Description</p>
                    <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                      {selectedMenuItem.description || 'A masterpiece of flavor, crafted with the finest seasonal ingredients and culinary expertise.'}
                    </p>
                  </div>

                  {selectedMenuItem.ingredients && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ingredients</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMenuItem.ingredients.split(',').map((ing: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium border border-slate-100">
                            {ing.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                {selectedMenuItem.is_sold_out ? (
                  <button 
                    disabled
                    className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl bg-slate-200 text-slate-400 cursor-not-allowed"
                  >
                    <X className="w-5 h-5" />
                    Sold Out
                  </button>
                ) : cart.find(i => i.id === selectedMenuItem.id) ? (
                  <div className="flex-1 flex items-center justify-between bg-brand-50 rounded-2xl p-2 border border-brand-200 shadow-xl">
                    <button
                      onClick={() => removeFromCart(selectedMenuItem.id)}
                      className="w-12 h-12 flex items-center justify-center bg-white rounded-xl text-brand-600 shadow-sm hover:bg-brand-100 transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-bold text-brand-700">
                      {cart.find(i => i.id === selectedMenuItem.id)?.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(selectedMenuItem)}
                      className="w-12 h-12 flex items-center justify-center bg-brand-600 rounded-xl text-white shadow-sm hover:bg-brand-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(selectedMenuItem)}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 btn-primary shadow-brand-200/20"
                  >
                    <Plus className="w-5 h-5" />
                    Add to order
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
