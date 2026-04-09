import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  LayoutDashboard, Utensils, QrCode, ClipboardList, 
  Settings, LogOut, Menu as MenuIcon, X, Plus, Check,
  ChevronRight, BarChart3, Users, Bell, Star,
  TrendingUp, Banknote, ShoppingBag, Clock, PieChart,
  AlertTriangle, RefreshCw, Download, Trash2, Edit2, Search, Calendar, ChevronLeft,
  MoreVertical, Image as ImageIcon, Upload, MapPin,
  LayoutGrid, Store, Save, ShieldCheck, Globe, FileText, MessageSquare, User,
  ExternalLink, Ban, CheckCircle, ChevronDown, CreditCard, Zap, Package, History,
  Instagram, Facebook, MessageCircle, PhoneCall, RotateCcw, Music2, AlertCircle, Eye,
  Target
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { MediaSelectorModal } from './MediaSelectorModal';
import { ManualOrderModal } from './ManualOrderModal';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart as RePieChart, Pie
} from 'recharts';

type DashboardContextType = {
  restaurant: any;
  orders: any[];
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  refreshRestaurant: () => Promise<void>;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  playNotification: () => void;
  pendingOrdersCount: number;
  waiterCalls: any[];
  setWaiterCalls: (calls: any[]) => void;
  hasUnseenCalls: boolean;
  setHasUnseenCalls: (hasUnseen: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  playAssistanceSoundFor10s: boolean;
  setPlayAssistanceSoundFor10s: (play: boolean) => void;
  isSidebarOpen: boolean;
};

export const useDashboard = () => useOutletContext<DashboardContextType>();

export const DashboardLayout = () => {
  const { user, signOut, isImpersonating, impersonate, restaurant: authRestaurant, loading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [restaurant, setRestaurant] = useState<any>(() => {
    const cached = localStorage.getItem('dashboard_restaurant');
    return cached ? JSON.parse(cached) : null;
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(!restaurant);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('restaurant_sound_enabled');
    return saved !== 'false';
  });
  const [activeTab, setActiveTab] = useState('incoming');
  const [waiterCalls, setWaiterCalls] = useState<any[]>([]);
  const [hasUnseenCalls, setHasUnseenCalls] = useState(false);
  const [playAssistanceSoundFor10s, setPlayAssistanceSoundFor10s] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const notificationAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    notificationAudio.current.volume = 0.5;
  }, []);

  const playNotification = useCallback(() => {
    if (notificationAudio.current && isSoundEnabled) {
      notificationAudio.current.currentTime = 0;
      notificationAudio.current.play().catch(err => {
        console.log('Audio play blocked by browser policy. User interaction required.');
        setIsAudioBlocked(true);
      });
    }
  }, [isSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('restaurant_sound_enabled', String(isSoundEnabled));
  }, [isSoundEnabled]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const shouldPlayOrderSound = pendingOrders.length > 0;
  const shouldPlayWaiterSound = (hasUnseenCalls && activeTab !== 'assistance') || playAssistanceSoundFor10s;
  const shouldPlaySound = shouldPlayOrderSound || shouldPlayWaiterSound;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (shouldPlaySound) {
      // Play immediately
      playNotification();
      // Then every 5 seconds
      interval = setInterval(() => {
        playNotification();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [shouldPlaySound, playNotification]);

  // Combined sound loop for orders and waiter calls removed from here

  const fetchPendingCount = useCallback(async (restaurantId: string) => {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending');
    
    if (!error && count !== null) {
      setPendingOrdersCount(count);
    }
  }, []);

  const fetchWaiterCalls = useCallback(async () => {
    if (!restaurant) return;
    try {
      const { data, error } = await supabase
        .from('waiter_calls')
        .select('*, tables(location)')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWaiterCalls(data || []);
    } catch (err) {
      console.error('Error fetching waiter calls:', err);
    }
  }, [restaurant]);

  const fetchNotifications = useCallback(async () => {
    if (!restaurant) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [restaurant]);

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!restaurant) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('restaurant_id', restaurant.id);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  useEffect(() => {
    if (!restaurant) return;

    fetchPendingCount(restaurant.id);
    fetchWaiterCalls();
    fetchNotifications();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingCount(restaurant.id);
        fetchWaiterCalls();
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const subscription = supabase
      .channel(`global-orders-${restaurant.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `restaurant_id=eq.${restaurant.id}`
      }, (payload) => {
        fetchPendingCount(restaurant.id);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'waiter_calls',
        filter: `restaurant_id=eq.${restaurant.id}`
      }, (payload) => {
        fetchWaiterCalls();
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `restaurant_id=eq.${restaurant.id}`
      }, (payload) => {
        fetchNotifications();
        playNotification();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [restaurant, fetchPendingCount, fetchWaiterCalls, fetchNotifications, playNotification]);

  useEffect(() => {
    if (!restaurant) return;

    const subscription = supabase
      .channel(`waiter-calls-notifications-${restaurant.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'waiter_calls',
        filter: `restaurant_id=eq.${restaurant.id}`
      }, (payload) => {
        // No global notifications for waiter calls anymore
        // Handled inside OrdersManager
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [restaurant, isAudioBlocked, playNotification]);

  useEffect(() => {
    if (authRestaurant) {
      setRestaurant(authRestaurant);
      localStorage.setItem('dashboard_restaurant', JSON.stringify(authRestaurant));
      setLoading(false);
    } else if (!authLoading && user && !isImpersonating) {
      fetchRestaurant();
    }
  }, [authRestaurant, authLoading, user, isImpersonating]);

  const fetchRestaurant = async () => {
    if (!restaurant) setLoading(true);
    setError(null);
    try {
      // 1. Ensure profile exists (fallback for email confirmation users)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        const { error: insertProfileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: user?.id, 
            email: user?.email, 
            full_name: user?.user_metadata?.full_name || 'Owner',
            role: 'restaurant_owner' 
          }]);
        
        if (insertProfileError) {
          console.error('Failed to create profile:', insertProfileError);
          setError('Could not initialize your profile. Please check your connection.');
          return;
        }
      }

      // 2. Fetch or create restaurant
      const { data, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .single();
      
      if (restError && restError.code === 'PGRST116') {
        const name = user?.user_metadata?.full_name || 'My';
        const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
        
        const { data: newRest, error: createError } = await supabase
          .from('restaurants')
          .insert([{ 
            owner_id: user?.id, 
            name: `${name}'s Restaurant`,
            slug: slug,
            subscription_tier: 'free'
          }])
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating default restaurant:', createError);
          setError('Failed to create restaurant profile.');
        } else if (newRest) {
          setRestaurant(newRest);
          localStorage.setItem('dashboard_restaurant', JSON.stringify(newRest));
        }
      } else if (data) {
        setRestaurant(data);
        localStorage.setItem('dashboard_restaurant', JSON.stringify(data));
      } else if (restError) {
        console.error('Error fetching restaurant:', restError);
        setError('Failed to load restaurant data.');
      }
    } catch (err: any) {
      console.error('Unexpected error in fetchRestaurant:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { icon: <ClipboardList className="w-4 h-4" />, label: 'Live Orders', path: '/restaurant/orders' },
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview', path: '/restaurant/dashboard' },
    { icon: <Utensils className="w-4 h-4" />, label: 'Menu Builder', path: '/restaurant/menu' },
    { icon: <QrCode className="w-4 h-4" />, label: 'Table & QR', path: '/restaurant/tables' },
    { icon: <FileText className="w-4 h-4" />, label: 'Receipts', path: '/restaurant/receipts' },
    { icon: <Users className="w-4 h-4" />, label: 'Staff Manager', path: '/restaurant/staff' },
    { icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics', path: '/restaurant/analytics' },
    { icon: <Store className="w-4 h-4" />, label: 'Storefront', path: '/restaurant/storefront' },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'Feedback', path: '/restaurant/feedback' },
    { icon: <ImageIcon className="w-4 h-4" />, label: 'Media', path: '/restaurant/media' },
    { icon: <Settings className="w-4 h-4" />, label: 'Settings', path: '/restaurant/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-[100dvh] bg-[#FDFCFB] flex flex-col font-sans overflow-hidden selection:bg-brand-100 selection:text-brand-900">
      {/* Sidebar Overlay */}
      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-sm print:hidden",
        isSidebarOpen ? "w-52" : "w-16",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0 w-52" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-brand-500 p-1.5 rounded-xl shrink-0 shadow-lg shadow-brand-200">
                <QrCode className="text-white w-4 h-4" />
              </div>
              {(isSidebarOpen || isMobileMenuOpen) && (
                <span className="text-base font-black tracking-tighter text-slate-900 uppercase whitespace-nowrap">
                  Scan<span className="text-brand-500">Ank</span>
                </span>
              )}
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <button 
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (windowWidth < 1024) {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs group relative",
                    isActive 
                      ? "bg-brand-50 text-brand-700 font-bold" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                  )}>
                    {React.cloneElement(item.icon as React.ReactElement, { className: 'w-4 h-4' })}
                  </div>
                  {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium">{item.label}</span>}
                  {isActive && (isSidebarOpen || isMobileMenuOpen) && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute left-0 w-1 h-5 bg-brand-600 rounded-r-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="px-2 py-4 border-t border-slate-100 shrink-0">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all text-xs group font-bold"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {(isSidebarOpen || isMobileMenuOpen) && <span>Logout</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-w-0 flex flex-col overflow-y-auto custom-scrollbar",
        isSidebarOpen ? "lg:pl-52" : "lg:pl-16"
      )}>
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="bg-slate-900 text-white px-3 py-1 flex items-center justify-between relative lg:sticky top-0 z-[50] shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-brand-400" />
              <span className="text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.2em] text-slate-300">
                Impersonating <span className="text-white font-bold">Restaurant Admin</span>
              </span>
            </div>
            <button 
              onClick={async () => {
                await impersonate(null);
                navigate('/master-admin/overview');
              }}
              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded text-[8px] font-bold uppercase tracking-widest transition-all"
            >
              Exit & Return
            </button>
          </div>
        )}

        {/* Header */}
        <header className={cn(
          "h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky z-40 print:hidden",
          isImpersonating ? "top-0 lg:top-[28px]" : "top-0"
        )}>
          <div className="flex items-center gap-4">
            {((windowWidth < 1024 && !isMobileMenuOpen) || (windowWidth >= 1024 && !isSidebarOpen)) && (
              <button 
                onClick={() => {
                  if (windowWidth < 1024) {
                    setIsMobileMenuOpen(true);
                  } else {
                    setIsSidebarOpen(true);
                  }
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
            )}
            {((windowWidth < 1024 && !isMobileMenuOpen) || (windowWidth >= 1024 && !isSidebarOpen)) && <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />}
            <h2 className="text-xs font-black text-slate-900 hidden sm:block uppercase tracking-widest">
              {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {restaurant?.slug && (
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!restaurant) return;
                    const currentIsOpen = restaurant.storefront_config?.is_open !== false;
                    const newStatus = !currentIsOpen;
                    const newConfig = { ...(restaurant.storefront_config || {}), is_open: newStatus };
                    
                    try {
                      const { error } = await supabase
                        .from('restaurants')
                        .update({ storefront_config: newConfig })
                        .eq('id', restaurant.id);
                      
                      if (error) throw error;
                      setRestaurant({ ...restaurant, storefront_config: newConfig });
                      
                    } catch (err) {
                      console.error('Error updating restaurant status:', err);
                      toast.error('Failed to update status', { duration: 2000 });
                    }
                  }}
                  className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-xl transition-all group"
                >
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                    (restaurant.storefront_config?.is_open !== false) ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {(restaurant.storefront_config?.is_open !== false) ? 'Open' : 'Closed'}
                  </span>
                  <div className={cn(
                    "w-8 h-4.5 rounded-full relative transition-all duration-300",
                    (restaurant.storefront_config?.is_open !== false) ? "bg-emerald-500" : "bg-slate-200"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300",
                      (restaurant.storefront_config?.is_open !== false) ? "right-0.5" : "left-0.5"
                    )} />
                  </div>
                </button>
              </div>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "relative p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors",
                  isNotificationsOpen && "bg-slate-100 text-slate-600"
                )}
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-600 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] bg-black/0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationsOpen(false);
                      }} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-[110] overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Notifications</h3>
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearAllNotifications}
                            className="text-[8px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700"
                          >
                            Mark All Read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] font-medium text-slate-400">No new notifications</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-50">
                            {notifications.map((notif) => (
                              <div 
                                key={notif.id} 
                                onClick={() => markNotificationAsRead(notif.id)}
                                className={cn(
                                  "p-3 hover:bg-slate-50 transition-colors cursor-pointer",
                                  !notif.is_read && "bg-brand-50/30"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                    notif.type === 'error' ? "bg-red-50 text-red-500" :
                                    notif.type === 'success' ? "bg-emerald-50 text-emerald-500" :
                                    notif.type === 'warning' ? "bg-amber-50 text-amber-500" :
                                    "bg-brand-50 text-brand-600"
                                  )}>
                                    {notif.type === 'error' ? <Ban className="w-3.5 h-3.5" /> :
                                     notif.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                     notif.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> :
                                     <Bell className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-900 leading-none mb-1">{notif.title}</p>
                                    <p className="text-[9px] text-slate-500 leading-tight line-clamp-2">{notif.message}</p>
                                    <p className="text-[8px] text-slate-400 mt-1.5 font-medium">
                                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 mx-1.5" />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden md:block">
                <p className="text-[11px] font-bold text-slate-900 leading-none mb-0.5">{restaurant?.name || 'My Restaurant'}</p>
                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Admin</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-brand-200">
                {restaurant?.name?.[0] || 'R'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none">
          {error ? (
            <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Initialization Error</h3>
              <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto leading-relaxed">{error}</p>
              <button 
                onClick={fetchRestaurant}
                className="mt-8 bg-brand-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-200"
              >
                <RefreshCw className="w-4 h-4" /> Retry Setup
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-100 rounded-full" />
                <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
              </div>
              <p className="text-sm font-semibold text-slate-400 animate-pulse">Syncing dashboard...</p>
            </div>
          ) : restaurant?.is_active === false ? (
            <div className="bg-white border border-red-100 p-12 rounded-3xl text-center shadow-sm max-w-lg mx-auto mt-12">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ban className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Account Suspended</h3>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                Your restaurant account has been suspended by the system administrator. 
                Please contact support or the master administrator to resolve this issue.
              </p>
              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Reference</p>
                <p className="text-xs font-mono text-slate-600 mt-1">{restaurant.id}</p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <Outlet context={{ 
                restaurant, 
                orders,
                setOrders,
                loading, 
                refreshRestaurant: fetchRestaurant,
                isSoundEnabled,
                setIsSoundEnabled,
                playNotification,
                pendingOrdersCount,
                waiterCalls,
                setWaiterCalls,
                hasUnseenCalls,
                setHasUnseenCalls,
                activeTab,
                setActiveTab,
                playAssistanceSoundFor10s,
                setPlayAssistanceSoundFor10s,
                isSidebarOpen
              }} />
            </div>
          )}
        </div>
      </main>
    </div>
  </div>
);
};

export const Overview = () => {
  const { restaurant } = useDashboard();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    activeTables: 0,
    totalTables: 0
  });
  const [insights, setInsights] = useState<{
    avgOrder: number | null;
    topDish: string | null;
    peakHour: string | null;
  }>({
    avgOrder: null,
    topDish: null,
    peakHour: null
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurant) {
      fetchOverviewData();
    }
  }, [restaurant]);

  const fetchOverviewData = async () => {
    if (stats.totalOrders === 0 && recentOrders.length === 0) setLoading(true);
    try {
      // Fetch Stats
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .neq('status', 'revoked');

      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('restaurant_id', restaurant.id)
        .neq('status', 'revoked')
        .neq('status', 'cancelled')
        .or('payment_status.eq.paid,status.eq.completed');

      const totalRevenue = revenueData?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

      const { count: tableCount } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id);

      const { count: activeOrderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .in('status', ['pending', 'cooking', 'ready']);

      setStats({
        totalOrders: orderCount || 0,
        revenue: totalRevenue,
        activeTables: activeOrderCount || 0,
        totalTables: tableCount || 0
      });

      // Calculate Insights
      const avgOrder = orderCount && orderCount > 0 ? totalRevenue / orderCount : null;

      // Fetch Top Dish
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('quantity, menu_items(name), orders!inner(status)')
        .eq('orders.restaurant_id', restaurant.id)
        .neq('orders.status', 'revoked')
        .not('menu_items', 'is', null);

      let topDish = null;
      if (itemsData && itemsData.length > 0) {
        const groupedItems = itemsData.reduce((acc: any, curr: any) => {
          const name = curr.menu_items?.name;
          if (name) {
            if (!acc[name]) acc[name] = 0;
            acc[name] += curr.quantity;
          }
          return acc;
        }, {});
        
        const sortedItems = Object.entries(groupedItems).sort((a: any, b: any) => b[1] - a[1]);
        if (sortedItems.length > 0) {
          topDish = sortedItems[0][0] as string;
        }
      }

      // Fetch Peak Hour
      const { data: ordersForPeak } = await supabase
        .from('orders')
        .select('created_at')
        .eq('restaurant_id', restaurant.id)
        .neq('status', 'revoked')
        .order('created_at', { ascending: false })
        .limit(1000);

      let peakHourStr = null;
      if (ordersForPeak && ordersForPeak.length > 0) {
        const hours = ordersForPeak.reduce((acc: any, curr) => {
          const date = new Date(curr.created_at);
          const hour = date.getHours();
          if (!acc[hour]) acc[hour] = 0;
          acc[hour] += 1;
          return acc;
        }, {});
        
        const sortedHours = Object.entries(hours).sort((a: any, b: any) => b[1] - a[1]);
        if (sortedHours.length > 0) {
          const peakHour = parseInt(sortedHours[0][0]);
          const formatHour = (h: number) => {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hour12 = h % 12 || 12;
            return `${hour12}:00 ${ampm}`;
          };
          peakHourStr = `${formatHour(peakHour)} - ${formatHour((peakHour + 1) % 24)}`;
        }
      }

      setInsights({
        avgOrder,
        topDish,
        peakHour: peakHourStr
      });

      // Fetch Recent Orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*, tables(table_number)')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders) setRecentOrders(orders);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-slate-100 rounded-full" />
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-sm font-semibold text-slate-400">Fetching metrics...</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Welcome Section */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">Overview</h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">Manage your restaurant performance and live status.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={() => navigate('/restaurant/orders')}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200 active:scale-95"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Live Orders
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', val: stats.totalOrders, change: '+12%', icon: <ShoppingBag className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'up' },
          { label: 'Net Revenue', val: `Rs. ${stats.revenue.toLocaleString()}`, change: '+8%', icon: <Banknote className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'up' },
          { label: 'Active Orders', val: stats.activeTables, change: 'Live', icon: <Clock className="w-4 h-4" />, color: 'text-brand-600', bg: 'bg-brand-50', trend: 'neutral' },
          { label: 'Total Tables', val: stats.totalTables, change: 'Total', icon: <Users className="w-4 h-4" />, color: 'text-slate-600', bg: 'bg-slate-100', trend: 'neutral' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className={cn("p-1.5 rounded-lg transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                {stat.icon}
              </div>
              <div className={cn(
                "text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                stat.trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
              )}>
                {stat.change}
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-slate-900 tracking-tight">{stat.val}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <Link to="/restaurant/orders" className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View All <ChevronRight className="w-2.5 h-2.5" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 py-2.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-4 py-2.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Table</th>
                    <th className="px-4 py-2.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-2.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-bold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">T-{order.tables?.table_number || '??'}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider",
                          order.status === 'pending' && "bg-amber-50 text-amber-600",
                          order.status === 'cooking' && "bg-brand-50 text-brand-600",
                          order.status === 'ready' && "bg-emerald-50 text-emerald-600",
                          order.status === 'completed' && "bg-slate-100 text-slate-600",
                          order.status === 'cancelled' && "bg-red-50 text-red-600"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[11px] font-bold text-slate-900">Rs. {order.total_amount}</span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center">
                        <div className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ShoppingBag className="w-4 h-4 text-slate-200" />
                        </div>
                        <p className="text-slate-400 text-[11px] font-medium">No recent orders found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 px-1">Insights</h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-5">
            {restaurant.storefront_config?.monthly_goal > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Monthly Goal</p>
                  <span className="text-[10px] font-bold text-brand-600">
                    {Math.min(100, Math.round((stats.revenue / restaurant.storefront_config.monthly_goal) * 100))}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.round((stats.revenue / restaurant.storefront_config.monthly_goal) * 100))}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-brand-600 rounded-full shadow-sm shadow-brand-200"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Target: Rs. {(restaurant.storefront_config.monthly_goal / 1000).toFixed(0)}k</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Rs. {(stats.revenue / 1000).toFixed(0)}k reached</p>
                </div>
              </div>
            )}

            <div className="space-y-3.5">
              {[
                { label: 'Peak Hour', value: insights.peakHour, icon: <Clock className="w-3.5 h-3.5" />, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Top Dish', value: insights.topDish, icon: <Star className="w-3.5 h-3.5" />, color: 'text-brand-500', bg: 'bg-brand-50' },
                { label: 'Avg. Order', value: insights.avgOrder ? `Rs. ${Math.round(insights.avgOrder).toLocaleString()}` : null, icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].filter(item => item.value).map((item) => (
                <div key={item.label} className="flex items-center gap-3 group">
                  <div className={cn("p-2 rounded-lg transition-all group-hover:scale-110", item.bg, item.color)}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                    <p className="text-[11px] font-bold text-slate-900">{item.value}</p>
                  </div>
                </div>
              ))}
              
              {!insights.peakHour && !insights.topDish && !insights.avgOrder && (
                <div className="text-center py-4">
                  <p className="text-[11px] font-medium text-slate-400">Not enough data to generate insights yet.</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/restaurant/analytics')}
              className="w-full sm:w-auto mx-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest shadow-sm active:scale-95"
            >
              View Detailed Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MenuBuilder = () => {
  const { restaurant } = useDashboard();
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', image_url: '', is_visible: true, is_sold_out: false, is_on_offer: false, is_chef_special: false, original_price: '' });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeItemOptions, setActiveItemOptions] = useState<string | null>(null);
  const [mediaSelectorConfig, setMediaSelectorConfig] = useState<{ isOpen: boolean; type: 'new' | 'edit' }>({ isOpen: false, type: 'new' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string; catId: string } | null>(null);
  const [categoryToDeleteConfirm, setCategoryToDeleteConfirm] = useState<{ isOpen: boolean; catId: string; catName: string } | null>(null);

  useEffect(() => {
    if (restaurant) {
      fetchData();
    }
  }, [restaurant]);

  useEffect(() => {
    const handleClickOutside = () => setActiveItemOptions(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchData = async () => {
    if (categories.length === 0) setLoading(true);
    try {
      const { data: catData, error } = await supabase
        .from('categories')
        .select('*, menu_items(*)')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      if (catData) {
        setCategories(catData);
        if (catData.length > 0 && !activeCategoryId) {
          setActiveCategoryId(catData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim() || !restaurant) {
      if (!restaurant) {
        toast.error('Restaurant data not loaded. Please refresh.');
        return;
      }
      return;
    }
    
    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) + 1 : 1;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategoryName, 
          restaurant_id: restaurant.id,
          sort_order: nextOrder 
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setCategories([...categories, { ...data, menu_items: [] }]);
        setActiveCategoryId(data.id);
        setNewCategoryName('');
        setIsAddingCategory(false);
        
      }
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error(`Failed to add category: ${error.message}`);
    }
  };

  const addItem = async () => {
    if (!newItem.name.trim() || !newItem.price || !selectedCategoryId || !restaurant) {
      if (!restaurant) {
        toast.error('Restaurant data not loaded.');
        return;
      }
      return;
    }

    if (newItem.is_on_offer) {
      if (!newItem.original_price || parseFloat(newItem.original_price) <= parseFloat(newItem.price)) {
        toast.error('Original price must be greater than the current price for special offers.');
        return;
      }
    }
    
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ 
          name: newItem.name, 
          price: parseFloat(newItem.price),
          original_price: newItem.is_on_offer && newItem.original_price ? parseFloat(newItem.original_price) : null,
          is_on_offer: newItem.is_on_offer,
          is_chef_special: newItem.is_chef_special,
          description: newItem.description,
          image_url: newItem.image_url,
          is_visible: newItem.is_visible,
          is_sold_out: newItem.is_sold_out,
          category_id: selectedCategoryId,
          restaurant_id: restaurant.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setCategories(categories.map(cat => {
          if (cat.id === selectedCategoryId) {
            return { ...cat, menu_items: [...(cat.menu_items || []), data] };
          }
          return cat;
        }));
        setNewItem({ name: '', price: '', description: '', image_url: '', is_visible: true, is_sold_out: false, is_on_offer: false, is_chef_special: false, original_price: '' });
        setIsAddingItem(false);
        setSelectedCategoryId(null);
        
      }
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error(`Failed to add item: ${error.message}`);
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories(categories.filter(c => c.id !== id));
      
    } else {
      toast.error('Failed to delete category');
    }
  };

  const updateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    
    const newSortOrder = parseInt(editingCategory.sort_order);
    
    // Check for duplicate sort_order
    if (!isNaN(newSortOrder)) {
      const duplicateOrder = categories.find(c => c.id !== editingCategory.id && c.sort_order === newSortOrder);
      if (duplicateOrder) {
        toast.error(`Position ${newSortOrder} is already used by "${duplicateOrder.name}". Please choose a unique position.`);
        return;
      }
    }

    try {
      const updateData: any = { name: editingCategory.name };
      if (!isNaN(newSortOrder)) {
        updateData.sort_order = newSortOrder;
      }

      const { error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', editingCategory.id);
      
      if (error) throw error;
      
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...updateData } : c).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setEditingCategory(null);
      
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const deleteItem = async (itemId: string, catId: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (!error) {
      setCategories(categories.map(cat => {
        if (cat.id === catId) {
          return { ...cat, menu_items: (cat.menu_items || []).filter((i: any) => i.id !== itemId) };
        }
        return cat;
      }));
      
    } else {
      toast.error('Failed to delete item');
    }
  };

  const handleMediaSelect = (url: string) => {
    if (mediaSelectorConfig.type === 'edit') {
      setEditingItem({ ...editingItem, image_url: url });
    } else {
      setNewItem({ ...newItem, image_url: url });
    }
  };

  const updateItem = async () => {
    if (!editingItem || !editingItem.name.trim()) return;

    if (editingItem.is_on_offer) {
      if (!editingItem.original_price || parseFloat(editingItem.original_price) <= parseFloat(editingItem.price)) {
        toast.error('Original price must be greater than the current price for special offers.');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ 
          name: editingItem.name,
          price: parseFloat(editingItem.price),
          original_price: editingItem.is_on_offer && editingItem.original_price ? parseFloat(editingItem.original_price) : null,
          is_on_offer: editingItem.is_on_offer,
          is_chef_special: editingItem.is_chef_special,
          description: editingItem.description,
          image_url: editingItem.image_url,
          is_visible: editingItem.is_visible,
          is_sold_out: editingItem.is_sold_out
        })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      
      setCategories(categories.map(cat => {
        if (cat.id === editingItem.category_id) {
          return { 
            ...cat, 
            menu_items: (cat.menu_items || []).map((i: any) => i.id === editingItem.id ? { ...i, ...editingItem, price: parseFloat(editingItem.price) } : i) 
          };
        }
        return cat;
      }));
      setEditingItem(null);
      toast.success(
        <span className="text-[8px] font-bold uppercase tracking-widest">Item Updated</span>,
        { duration: 1500 }
      );
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-slate-100 rounded-full" />
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-sm font-semibold text-slate-400">Loading menu...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-24">
      {/* Header Section */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Menu Builder</h1>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Create and organize your restaurant's digital menu.</p>
        </div>
        <button 
          onClick={() => setIsAddingCategory(true)}
          className="bg-[#0F172A] text-white px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Category
        </button>
      </div>

      <AnimatePresence>
        {isAddingCategory && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Add New Category</h3>
                <button 
                  onClick={() => setIsAddingCategory(false)} 
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="e.g. Main Course, Beverages"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsAddingCategory(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addCategory}
                    className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Create Category
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-2 snap-x">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border snap-start",
                activeCategoryId === cat.id
                  ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-100"
                  : "bg-white text-slate-500 border-slate-200 hover:border-brand-200 hover:text-brand-600"
              )}
            >
              {cat.name}
              <span className={cn(
                "ml-1.5 px-1 py-0.5 rounded-md text-[8px]",
                activeCategoryId === cat.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {cat.menu_items?.length || 0}
              </span>
            </button>
          ))}
        </div>
      )}
      
      {/* Add Item Modal */}
      <AnimatePresence>
        {isAddingItem && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto"
            >
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate">Add Menu Item</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">Adding to {categories.find(c => c.id === selectedCategoryId)?.name}</p>
                </div>
                <button 
                  onClick={() => setIsAddingItem(false)} 
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* Image Upload Section */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Item Image</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 border-dashed group hover:border-slate-900/50 transition-all">
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden relative shrink-0 shadow-sm group/img">
                      {newItem.image_url ? (
                        <>
                          <img src={newItem.image_url} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setNewItem({ ...newItem, image_url: '' });
                            }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-200" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!newItem.image_url && (
                        <button 
                          onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'new' })}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">
                        Upload a photo of your dish. <br/>
                        Max 2MB. JPG, PNG or WebP.
                      </p>
                      <button 
                        onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'new' })}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                        disabled={isUploading}
                      >
                        <Upload className="w-2.5 h-2.5" /> {isUploading ? 'Uploading...' : 'Choose Image'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Grilled Salmon"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-[11px] font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Price (Rs.)</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-[11px] font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => setNewItem({...newItem, is_on_offer: !newItem.is_on_offer})}
                        className={cn(
                          "w-8 h-4 rounded-full transition-all relative",
                          newItem.is_on_offer ? "bg-amber-500" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                          newItem.is_on_offer ? "left-4.5" : "left-0.5"
                        )} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Special Offer</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => setNewItem({...newItem, is_chef_special: !newItem.is_chef_special})}
                        className={cn(
                          "w-8 h-4 rounded-full transition-all relative",
                          newItem.is_chef_special ? "bg-emerald-500" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                          newItem.is_chef_special ? "left-4.5" : "left-0.5"
                        )} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Chef's Special</span>
                    </label>
                  </div>

                  {newItem.is_on_offer && (
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-amber-500 uppercase tracking-widest ml-1">Original Price (Rs.)</label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={newItem.original_price}
                        onChange={(e) => setNewItem({...newItem, original_price: e.target.value})}
                        className="w-full bg-amber-50/50 border border-amber-200 rounded-xl py-1.5 px-2.5 text-[11px] font-medium focus:bg-white focus:border-amber-500 focus:ring-0 transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => setNewItem({...newItem, is_visible: !newItem.is_visible})}
                      className={cn(
                        "w-8 h-4 rounded-full transition-all relative",
                        newItem.is_visible ? "bg-slate-900" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                        newItem.is_visible ? "left-4.5" : "left-0.5"
                      )} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Public Menu</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => setNewItem({...newItem, is_sold_out: !newItem.is_sold_out})}
                      className={cn(
                        "w-8 h-4 rounded-full transition-all relative",
                        newItem.is_sold_out ? "bg-red-500" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                        newItem.is_sold_out ? "left-4.5" : "left-0.5"
                      )} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sold Out</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    placeholder="Briefly describe the dish..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-medium focus:bg-white focus:border-slate-900 focus:ring-0 h-24 resize-none transition-all"
                  />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-2 shrink-0">
                <button 
                  onClick={() => setIsAddingItem(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-500 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={addItem}
                  className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                  Add to Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto"
            >
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="min-w-0">
                  <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate">Edit Menu Item</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">Editing {editingItem.name}</p>
                </div>
                <button 
                  onClick={() => setEditingItem(null)} 
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* Image Upload Section */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Item Image</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 border-dashed group hover:border-brand-600/50 transition-all">
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden relative shrink-0 shadow-sm group/img">
                      {editingItem.image_url ? (
                        <>
                          <img src={editingItem.image_url} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingItem({ ...editingItem, image_url: '' });
                            }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-200" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!editingItem.image_url && (
                        <button 
                          onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'edit' })}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">
                        Update photo of your dish. <br/>
                        Max 2MB. JPG, PNG or WebP.
                      </p>
                      <button 
                        onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'edit' })}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                        disabled={isUploading}
                      >
                        <Upload className="w-2.5 h-2.5" /> {isUploading ? 'Uploading...' : 'Change Image'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Grilled Salmon"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] font-medium focus:bg-white focus:border-brand-600 focus:ring-0 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Price (Rs.)</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] font-medium focus:bg-white focus:border-brand-600 focus:ring-0 transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => setEditingItem({...editingItem, is_on_offer: !editingItem.is_on_offer})}
                        className={cn(
                          "w-8 h-4 rounded-full transition-all relative",
                          editingItem.is_on_offer ? "bg-amber-500" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                          editingItem.is_on_offer ? "left-4.5" : "left-0.5"
                        )} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Special Offer</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => setEditingItem({...editingItem, is_chef_special: !editingItem.is_chef_special})}
                        className={cn(
                          "w-8 h-4 rounded-full transition-all relative",
                          editingItem.is_chef_special ? "bg-emerald-500" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                          editingItem.is_chef_special ? "left-4.5" : "left-0.5"
                        )} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Chef's Special</span>
                    </label>
                  </div>

                  {editingItem.is_on_offer && (
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-amber-500 uppercase tracking-widest ml-1">Original Price (Rs.)</label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={editingItem.original_price || ''}
                        onChange={(e) => setEditingItem({...editingItem, original_price: e.target.value})}
                        className="w-full bg-amber-50/50 border border-amber-200 rounded-lg py-1.5 px-2.5 text-[11px] font-medium focus:bg-white focus:border-amber-500 focus:ring-0 transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => setEditingItem({...editingItem, is_visible: !editingItem.is_visible})}
                      className={cn(
                        "w-8 h-4 rounded-full transition-all relative",
                        editingItem.is_visible ? "bg-brand-600" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                        editingItem.is_visible ? "left-4.5" : "left-0.5"
                      )} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Public Menu</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => setEditingItem({...editingItem, is_sold_out: !editingItem.is_sold_out})}
                      className={cn(
                        "w-8 h-4 rounded-full transition-all relative",
                        editingItem.is_sold_out ? "bg-red-500" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                        editingItem.is_sold_out ? "left-4.5" : "left-0.5"
                      )} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sold Out</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    placeholder="Describe your item..."
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-[11px] h-24 resize-none font-medium focus:bg-white focus:border-brand-600 focus:ring-0 transition-all"
                  />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2 shrink-0">
                <button 
                  onClick={updateItem}
                  className="w-fit mx-auto px-10 bg-[#0F172A] text-white py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="w-full sm:flex-1 bg-white border border-slate-200 text-slate-500 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 gap-12">
        {categories.filter(c => !activeCategoryId || c.id === activeCategoryId).map((cat, i) => (
          <motion.div 
            key={cat.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="space-y-6"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between px-1">
              {editingCategory?.id === cat.id ? (
                <div className="flex items-center gap-1 w-full max-w-[200px] sm:max-w-md mr-2">
                  <input 
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    className="flex-1 bg-white border border-brand-600 rounded py-1 px-1.5 text-[10px] font-bold focus:ring-0 min-w-0"
                    placeholder="Name"
                    autoFocus
                  />
                  <input 
                    type="number"
                    value={editingCategory.sort_order}
                    onChange={(e) => setEditingCategory({...editingCategory, sort_order: e.target.value})}
                    className="w-10 bg-white border border-brand-600 rounded py-1 px-1 text-[10px] font-bold focus:ring-0 text-center shrink-0"
                    placeholder="Pos"
                    min="1"
                  />
                  <button onClick={updateCategory} className="p-1 bg-brand-600 text-white rounded hover:bg-brand-700 shadow-sm shrink-0"><Check className="w-3 h-3" /></button>
                  <button onClick={() => setEditingCategory(null)} className="p-1 bg-slate-100 text-slate-400 rounded hover:bg-slate-200 shrink-0"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    <span className="text-brand-600 mr-2">#{cat.sort_order || 0}</span>
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-1 transition-all">
                    <button 
                      onClick={() => setEditingCategory({ id: cat.id, name: cat.name, sort_order: cat.sort_order || 0 })}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-600 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => { setCategoryToDeleteConfirm({ isOpen: true, catId: cat.id, catName: cat.name }); }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <button 
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setIsAddingItem(true);
                }}
                className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 px-2.5 py-1 bg-brand-50 rounded-lg transition-all"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {cat.menu_items?.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col">
                  <div 
                    className="relative h-28 bg-slate-100 overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveItemOptions(item.id === activeItemOptions ? null : item.id);
                    }}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.name} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-8 h-8 text-slate-200" />
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {activeItemOptions === item.id && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 backdrop-blur-sm z-10"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ isOpen: true, itemId: item.id, catId: cat.id });
                              setActiveItemOptions(null);
                            }}
                            className="w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">{item.name}</h4>
                      <span className="text-[10px] font-bold text-brand-600 whitespace-nowrap">Rs. {item.price}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mb-3 flex-1 leading-relaxed">
                      {item.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.is_visible ? "bg-emerald-500" : "bg-slate-300"
                        )} />
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest",
                          item.is_visible ? "text-slate-400" : "text-slate-300"
                        )}>
                          {item.is_visible ? 'Visible' : 'Hidden'}
                        </span>
                        {item.is_sold_out && (
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded">
                            Sold Out
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => setEditingItem({ ...item, price: item.price.toString() })}
                        className="text-[9px] font-bold text-brand-600 hover:underline uppercase tracking-widest transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(!cat.menu_items || cat.menu_items.length === 0) && (
                <div className="col-span-full py-16 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-slate-200" />
                  </div>
                  <p className="text-sm text-slate-400 font-semibold">No items in this category yet.</p>
                  <button 
                    onClick={() => { setSelectedCategoryId(cat.id); setIsAddingItem(true); }}
                    className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-4 py-2 rounded-xl transition-all"
                  >
                    Add your first item
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {categories.length === 0 && (
          <div className="py-32 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8">
              <Utensils className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Your menu is empty</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">Start by adding a category like "Main Course" or "Drinks" to organize your menu.</p>
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="mt-10 bg-brand-600 text-white px-10 py-4 rounded-xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
            >
              Create First Category
            </button>
          </div>
        )}
      </div>

      <MediaSelectorModal
        isOpen={mediaSelectorConfig.isOpen}
        onClose={() => setMediaSelectorConfig({ ...mediaSelectorConfig, isOpen: false })}
        onSelect={handleMediaSelect}
        restaurantId={restaurant?.id || ''}
      />

      <AnimatePresence>
        {deleteConfirm?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-2">Delete Item?</h3>
              <p className="text-[10px] text-slate-500 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteItem(deleteConfirm.itemId, deleteConfirm.catId);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-[10px] font-bold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {categoryToDeleteConfirm?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-2">Delete Category?</h3>
              <p className="text-[10px] text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{categoryToDeleteConfirm.catName}"</span>? 
                This will delete all items within this category. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCategoryToDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteCategory(categoryToDeleteConfirm.catId);
                    setCategoryToDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-[10px] font-bold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TableManagement = () => {
  const { restaurant } = useDashboard();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableLocation, setNewTableLocation] = useState('');
  const [editingTable, setEditingTable] = useState<any>(null);
  const [activeTableOptions, setActiveTableOptions] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) {
      fetchData();
    }
  }, [restaurant]);

  useEffect(() => {
    const handleClickOutside = () => setActiveTableOptions(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchData = async () => {
    if (tables.length === 0) setLoading(true);
    try {
      const { data: tableData, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('table_number', { ascending: true });
      
      if (error) throw error;
      if (tableData) setTables(tableData);
    } catch (error: any) {
      console.error('Error fetching tables:', error);
      toast.error(`Error loading tables: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addTable = async () => {
    if (!newTableNumber.trim() || !restaurant) {
      if (!restaurant) toast.error('Restaurant data not loaded. Please refresh.');
      return;
    }

    // Check if table number already exists locally to avoid unnecessary DB call
    if (tables.some(t => t.table_number === newTableNumber.trim())) {
      toast.error('This table number already exists.');
      return;
    }
    
    try {
      console.log('Attempting to add table:', { table_number: newTableNumber.trim(), restaurant_id: restaurant.id, location: newTableLocation.trim() });
      const { data, error } = await supabase
        .from('tables')
        .insert([{ 
          table_number: newTableNumber.trim(), 
          restaurant_id: restaurant.id,
          location: newTableLocation.trim()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error adding table:', error);
        throw error;
      }
      
      console.log('Table added successfully:', data);
      if (data) {
        setTables([...tables, data]);
        setNewTableNumber('');
        setNewTableLocation('');
        setIsAddingTable(false);
      }
    } catch (error: any) {
      console.error('Error adding table:', error);
      toast.error(`Failed to add table: ${error.message || 'Table number might already exist.'}`);
    }
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (!error) {
      setTables(tables.filter(t => t.id !== id));
      toast.success(
        <span className="text-[8px] font-bold uppercase tracking-widest">Table Deleted</span>,
        { duration: 1500 }
      );
    } else {
      toast.error('Failed to delete table');
    }
  };

  const updateTable = async () => {
    if (!editingTable || !editingTable.table_number.trim()) return;
    try {
      const { error } = await supabase
        .from('tables')
        .update({ 
          table_number: editingTable.table_number,
          location: editingTable.location
        })
        .eq('id', editingTable.id);
      
      if (error) throw error;
      
      setTables(tables.map(t => t.id === editingTable.id ? { ...t, table_number: editingTable.table_number, location: editingTable.location } : t));
      setEditingTable(null);
      toast.success(
        <span className="text-[8px] font-bold uppercase tracking-widest">Table Updated</span>,
        { duration: 1500 }
      );
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const downloadQR = (tableNumber: string) => {
    const svg = document.getElementById(`qr-${tableNumber}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size for a high-quality print-ready card
      const width = 1200;
      const height = 1600;
      canvas.width = width;
      canvas.height = height;

      // 1. White Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // 2. Decorative Border
      ctx.strokeStyle = "#f1f5f9"; // slate-100
      ctx.lineWidth = 60;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // 3. Restaurant Name (Header)
      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.font = "bold 50px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(restaurant.name.toUpperCase(), width / 2, 180);

      // 4. Table Number (Main Feature)
      ctx.fillStyle = "#000000";
      ctx.font = "900 140px Inter, system-ui, sans-serif";
      ctx.fillText(`TABLE ${tableNumber}`, width / 2, 350);

      // 5. QR Code Container (Shadow effect)
      const qrSize = 700;
      const qrX = (width - qrSize) / 2;
      const qrY = 450;
      
      ctx.fillStyle = "#f8fafc"; // slate-50
      ctx.beginPath();
      ctx.roundRect?.(qrX - 40, qrY - 40, qrSize + 80, qrSize + 80, 40);
      ctx.fill();
      
      // Draw the QR code
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // 6. Instructions
      ctx.fillStyle = "#334155"; // slate-700
      ctx.font = "bold 45px Inter, system-ui, sans-serif";
      ctx.fillText("SCAN TO VIEW MENU & ORDER", width / 2, 1320);
      
      // 7. Footer Branding
      ctx.fillStyle = "#94a3b8"; // slate-400
      ctx.font = "bold 25px Inter, system-ui, sans-serif";
      ctx.fillText("POWERED BY SCANANK", width / 2, 1450);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${restaurant.name.replace(/\s+/g, '-')}-Table-${tableNumber}-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-slate-100 rounded-full" />
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-sm font-semibold text-slate-400">Loading tables...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-24">
      {/* Header Section */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Table Management</h1>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Manage your restaurant's physical layout and QR codes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAddingTable(true)}
            className="bg-[#0F172A] text-white px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Table
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAddingTable && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Add New Table</h3>
                <button 
                  onClick={() => setIsAddingTable(false)} 
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Table Identifier</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="e.g. Table 01, VIP-A"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location / Area</label>
                  <input 
                    type="text"
                    placeholder="e.g. Main Hall, Terrace"
                    value={newTableLocation}
                    onChange={(e) => setNewTableLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsAddingTable(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addTable}
                    className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Save Table
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingTable && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Edit Table</h3>
                <button 
                  onClick={() => setEditingTable(null)} 
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Table Identifier</label>
                  <input 
                    autoFocus
                    type="text"
                    value={editingTable.table_number}
                    onChange={(e) => setEditingTable({...editingTable, table_number: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location / Area</label>
                  <input 
                    type="text"
                    value={editingTable.location || ''}
                    onChange={(e) => setEditingTable({...editingTable, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setEditingTable(null)}
                    className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={updateTable}
                    className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tables.map((table, i) => (
          <motion.div 
            key={table.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm group hover:shadow-md transition-all relative overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTableOptions(table.id === activeTableOptions ? null : table.id);
            }}
          >
            <div className="flex flex-col items-center text-center space-y-4 relative">
                <div className="w-full flex items-center justify-between">
                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold uppercase tracking-widest">
                    Available
                  </div>
                </div>

                <div className="relative">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300 group-hover:bg-white group-hover:shadow-inner">
                    <QRCodeSVG 
                      id={`qr-${table.table_number}`}
                      value={`${window.location.origin}/scan/${restaurant.slug}/${table.table_number}`}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  
                  <AnimatePresence>
                    {activeTableOptions === table.id && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-2 backdrop-blur-sm z-10"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadQR(table.table_number);
                            setActiveTableOptions(null);
                          }}
                          className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTable(table);
                            setActiveTableOptions(null);
                          }}
                          className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTable(table.id);
                            setActiveTableOptions(null);
                          }}
                          className="w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Table {table.table_number}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{table.location || 'No Location Set'}</span>
                  </div>
                </div>

              </div>
          </motion.div>
        ))}
        {tables.length === 0 && (
          <div className="col-span-full py-32 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8">
              <LayoutGrid className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">No tables configured</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">Add your first table to generate a QR code for your customers to scan.</p>
            <button 
              onClick={() => setIsAddingTable(true)}
              className="mt-10 bg-brand-600 text-white px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ORDER_TABS = [
  { id: 'incoming', label: 'Incoming', icon: <Bell className="w-3.5 h-3.5" />, statuses: ['pending'] },
  { id: 'cooking', label: 'Cooking', icon: <Utensils className="w-3.5 h-3.5" />, statuses: ['cooking', 'ready'] },
  { id: 'completed', label: 'Completed', icon: <CheckCircle className="w-3.5 h-3.5" />, statuses: ['completed', 'cancelled', 'revoked'] },
  { id: 'assistance', label: 'Assistance', icon: <PhoneCall className="w-3.5 h-3.5" />, statuses: [] },
] as const;

type OrderTabId = typeof ORDER_TABS[number]['id'];

// Helper to get time elapsed with SLA tracking
const TimeElapsed = ({ createdAt, status }: { createdAt: string; status: string }) => {
  const [elapsed, setElapsed] = useState('');
  const [colorClass, setColorClass] = useState('text-emerald-600');

  useEffect(() => {
    const update = () => {
      // Don't show timer for completed or cancelled orders
      if (!['pending', 'cooking', 'ready'].includes(status)) {
        setElapsed('');
        return;
      }

      const start = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      
      setElapsed(`${mins}m ${secs}s`);

      // SLA Tracking: Only for active orders
      if (mins >= 10) {
        setColorClass('text-red-600 animate-pulse');
      } else if (mins >= 5) {
        setColorClass('text-amber-600');
      } else {
        setColorClass('text-emerald-600');
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (!elapsed) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] font-bold text-slate-500">{new Date(createdAt).getDate()} {new Date(createdAt).toLocaleDateString('en-US', { month: 'short' })}</span>
      <span className={cn("text-[8px] font-bold tabular-nums", colorClass)}>{elapsed}</span>
    </div>
  );
};

// Order Details Wizard Component
const OrderDetailsWizard = ({ 
  order, 
  onClose, 
  onUpdateStatus,
  onReject
}: { 
  order: any; 
  onClose: () => void; 
  onUpdateStatus: (id: string, status: string, reason?: string) => Promise<void>;
  onReject: (order: any) => void;
}) => {
  const [showRevokeConfirm, setShowRevokeConfirm] = React.useState(false);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Minimal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Table {order.tables?.table_number || '??'}
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 rounded text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* Customer Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Customer</p>
              <p className="text-xs font-bold text-slate-900">{order.customer_name || 'Guest'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time</p>
              <p className="text-sm font-bold text-slate-900">
                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Items</p>
            <div className="space-y-2">
              {order.order_items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">{item.quantity}x</span>
                    <span className="text-[10px] font-mono font-medium text-slate-600 uppercase tracking-tight">{item.menu_items?.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    Rs. {(item.unit_price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {order.customer_notes && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-xs font-medium text-amber-900/80 leading-relaxed italic">"{order.customer_notes}"</p>
            </div>
          )}

          {order.rejection_reason && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
              <p className="text-xs font-bold text-red-900/80 leading-relaxed">
                {order.rejection_reason === 'revoked' ? 'This transaction was revoked by admin.' : order.rejection_reason}
              </p>
            </div>
          )}

          {/* Total & Status */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</p>
              <p className="text-lg font-bold text-slate-900">Rs. {Number(order.total_amount || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
              <div className="flex items-center gap-2 justify-end">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  (order.payment_status?.toLowerCase() === 'paid' || order.status === 'completed') && order.status !== 'revoked' && !(order.status === 'cancelled' && order.rejection_reason === 'revoked') ? "bg-emerald-500" : ((order.status === 'revoked' || (order.status === 'cancelled' && order.rejection_reason === 'revoked')) ? "bg-slate-300" : "bg-amber-500 animate-pulse")
                )} />
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  (order.payment_status?.toLowerCase() === 'paid' || order.status === 'completed') && order.status !== 'revoked' && !(order.status === 'cancelled' && order.rejection_reason === 'revoked') ? "text-emerald-600" : ((order.status === 'revoked' || (order.status === 'cancelled' && order.rejection_reason === 'revoked')) ? "text-slate-400" : "text-amber-600")
                )}>{(order.status === 'revoked' || (order.status === 'cancelled' && order.rejection_reason === 'revoked')) ? 'REVOKED' : ((order.payment_status?.toLowerCase() === 'paid' || order.status === 'completed') ? 'PAID' : (order.payment_status || 'Unpaid'))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-white">
          {order.status === 'pending' && (
            <>
              <button 
                onClick={() => { onReject(order); onClose(); }}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 flex items-center justify-center"
                title="Reject Order"
              >
                <X className="w-5 h-5 mt-0.5" />
              </button>
              <button 
                onClick={() => { onUpdateStatus(order.id, 'cooking'); onClose(); }}
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            </>
          )}
          {order.status === 'cooking' && (
            <>
              <button 
                onClick={() => { onReject(order); onClose(); }}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 flex items-center justify-center"
                title="Reject Order"
              >
                <X className="w-5 h-5 mt-0.5" />
              </button>
              <button 
                onClick={() => { onUpdateStatus(order.id, 'ready'); onClose(); }}
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Mark Ready
              </button>
            </>
          )}
          {order.status === 'ready' && (
            <button 
              onClick={() => { onUpdateStatus(order.id, 'completed'); onClose(); }}
              className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> PAID
            </button>
          )}
          {order.status === 'completed' && !showRevokeConfirm && (
            <button 
              onClick={() => setShowRevokeConfirm(true)}
              className="flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Revoke Transaction
            </button>
          )}
          {order.status === 'completed' && showRevokeConfirm && (
            <div className="flex-1 flex flex-col gap-2">
              <p className="text-[8px] font-bold text-red-600 uppercase tracking-widest text-center">
                Sure want to revoke?
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowRevokeConfirm(false)}
                  className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  No
                </button>
                <button 
                  onClick={() => { 
                    onUpdateStatus(order.id, 'cancelled', 'revoked'); 
                    onClose(); 
                  }}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-md"
                >
                  Yes
                </button>
              </div>
            </div>
          )}
          {(order.status === 'revoked' || (order.status === 'cancelled' && order.rejection_reason === 'revoked')) && (
            <div className="flex-1 bg-slate-50 text-slate-400 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 border-dashed">
              <Ban className="w-4 h-4" /> Revoked
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const OrdersManager = () => {
  const { restaurant, pendingOrdersCount, waiterCalls, setWaiterCalls, hasUnseenCalls, setHasUnseenCalls, activeTab, setActiveTab, playAssistanceSoundFor10s, setPlayAssistanceSoundFor10s, orders, setOrders } = useDashboard();
  const [loading, setLoading] = useState(orders.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectionOrder, setRejectionOrder] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [completedTotalCount, setCompletedTotalCount] = useState(0);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const itemsPerPage = 25;
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const { playNotification } = useDashboard();

  useEffect(() => {
    if (activeTab === 'assistance') {
      setHasUnseenCalls(false);
    }
    setCurrentPage(1);
  }, [activeTab, setHasUnseenCalls]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const prevWaiterCallsLength = useRef(waiterCalls.length);

  // Update hasUnseenCalls when new calls arrive
  useEffect(() => {
    if (waiterCalls.length > prevWaiterCallsLength.current) {
      if (activeTab !== 'assistance') {
        setHasUnseenCalls(true);
      } else {
        setPlayAssistanceSoundFor10s(true);
        setTimeout(() => setPlayAssistanceSoundFor10s(false), 10000);
      }
    }
    prevWaiterCallsLength.current = waiterCalls.length;
  }, [waiterCalls.length, activeTab, setHasUnseenCalls, setPlayAssistanceSoundFor10s]);

  // Waiter call logic moved to combined sound loop

  // Waiter call logic moved to combined sound loop
  const fetchWaiterCalls = useCallback(async () => {
    if (!restaurant) return;
    try {
      const { data, error } = await supabase
        .from('waiter_calls')
        .select('*, tables(location)')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWaiterCalls(data || []);
    } catch (err) {
      console.error('Error fetching waiter calls:', err);
    }
  }, [restaurant]);

  useEffect(() => {
    if (!restaurant) return;
    fetchWaiterCalls();

    const subscription = supabase
      .channel(`orders-waiter-calls-${restaurant.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'waiter_calls',
        filter: `restaurant_id=eq.${restaurant.id}`
      }, () => {
        fetchWaiterCalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [restaurant, fetchWaiterCalls]);

  const handleResolveCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('waiter_calls')
        .update({ status: 'resolved' })
        .eq('id', callId);

      if (error) throw error;
      
      fetchWaiterCalls();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const ordersRef = useRef(orders);
  const lastUpdatedRef = useRef(lastUpdated);

  useEffect(() => {
    ordersRef.current = orders;
    lastUpdatedRef.current = lastUpdated;
  }, [orders, lastUpdated]);

  const fetchOrders = useCallback(async (isInitial = false) => {
    if (!restaurant) return;
    try {
      // Smart check: Only do full fetch if count or latest update changed
      if (!isInitial && ordersRef.current.length > 0) {
        const { count, error: countError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id);
        
        if (!countError && count === ordersRef.current.length) {
          const { data: latest } = await supabase
            .from('orders')
            .select('created_at')
            .eq('restaurant_id', restaurant.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (latest?.[0] && new Date(latest[0].created_at) <= lastUpdatedRef.current) {
            return; // No changes detected, skip full fetch
          }
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, tables(table_number), order_items(*, menu_items(name))')
        .eq('restaurant_id', restaurant.id)
        .in('status', ['pending', 'cooking', 'ready'])
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data) {
        setOrders(data);
        setLastUpdated(new Date());
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [restaurant, setOrders]);

  const fetchCompletedOrders = useCallback(async () => {
    if (!restaurant) return;
    try {
      let query = supabase
        .from('orders')
        .select('*, tables(table_number), order_items(*, menu_items(name))', { count: 'exact' })
        .eq('restaurant_id', restaurant.id)
        .in('status', ['completed', 'cancelled', 'revoked'])
        .order('completed_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }) // Secondary sort
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (searchQuery) {
        query = query.or(`id.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`);
      }

      let { data, error, count } = await query;
      
      // Fallback if completed_at column doesn't exist yet
      if (error && error.code === '42703') {
        let fallbackQuery = supabase
          .from('orders')
          .select('*, tables(table_number), order_items(*, menu_items(name))', { count: 'exact' })
          .eq('restaurant_id', restaurant.id)
          .in('status', ['completed', 'cancelled', 'revoked'])
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
          
        if (searchQuery) {
          fallbackQuery = fallbackQuery.or(`id.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`);
        }
        
        const fallbackResult = await fallbackQuery;
        data = fallbackResult.data;
        error = fallbackResult.error;
        count = fallbackResult.count;
      }

      if (error) throw error;
      if (data) {
        setCompletedOrders(data);
        if (count !== null) setCompletedTotalCount(count);
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    }
  }, [restaurant, currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    if (activeTab === 'completed') {
      fetchCompletedOrders();
    }
  }, [activeTab, fetchCompletedOrders]);

  useEffect(() => {
    if (!restaurant) return;
    fetchOrders(true);

    // Visibility change listener to refetch when user returns to tab (crucial for mobile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders(false);
        if (activeTabRef.current === 'completed') fetchCompletedOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Smart polling fallback (every 10 seconds) - only runs if tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders(false);
        if (activeTabRef.current === 'completed') fetchCompletedOrders();
      }
    }, 10000);

    const subscription = supabase
      .channel(`orders-manager-${restaurant.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `restaurant_id=eq.${restaurant.id}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          // Immediately update local state with new status to prevent flickering
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          if (activeTabRef.current === 'completed') fetchCompletedOrders();
        } else {
          // For INSERT/DELETE, refetch
          fetchOrders(false);
          if (activeTabRef.current === 'completed') fetchCompletedOrders();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [restaurant, fetchOrders, setOrders, fetchCompletedOrders]);

  const updateStatus = async (orderId: string, status: string, reason?: string) => {
    if (!restaurant) {
      console.error('Update failed: Restaurant object is null');
      toast.error("Restaurant data not loaded. Please refresh.");
      return;
    }

    console.log('Attempting status update:', { orderId, status, restaurantId: restaurant.id });

    try {
      const updateData: any = { status };
      if (reason) updateData.rejection_reason = reason;
      if (status === 'completed') {
        updateData.payment_status = 'paid';
        updateData.completed_at = new Date().toISOString();
      }
      if (status === 'revoked' || (status === 'cancelled' && reason === 'revoked')) {
        updateData.payment_status = 'unpaid';
      }
      
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));
      setCompletedOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));

      let message = `Order updated to ${status}`;
      if (status === 'cooking' || status === 'ready') message = "Order moved to Cooking";
      else if (status === 'completed' || status === 'cancelled') message = "Order moved to Completed";

      // Perform the update
      // We'll try to update by ID first. RLS will handle the security.
      // Including restaurant_id is good for safety but can cause issues if there's a mismatch.
      let { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select(); 

      // Fallback if completed_at column doesn't exist yet
      if (error && error.code === '42703' && updateData.completed_at) {
        delete updateData.completed_at;
        const fallbackResult = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId)
          .select();
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Supabase Update Error:', error);
        throw new Error(error.message || "Database rejected the update");
      }

      if (!data || data.length === 0) {
        console.error('Update failed: 0 rows affected. This is likely an RLS permission issue.', { 
          orderId, 
          restaurantId: restaurant.id,
          authUid: (await supabase.auth.getUser()).data.user?.id
        });
        throw new Error("Permission denied. Your account may not be correctly linked to this restaurant in the database.");
      }
      
    } catch (error: any) {
      console.error('Detailed Update Failure:', error);
      toast.error(`Update Failed: ${error.message}`);
      // Revert optimistic update by refetching
      fetchOrders();
    }
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === 'assistance') {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return waiterCalls.filter(c => 
          c.table_number.toString().includes(query) || 
          c.request?.toLowerCase().includes(query) ||
          c.tables?.location?.toLowerCase().includes(query)
        );
      }
      return waiterCalls;
    }

    if (activeTab === 'completed') {
      return completedOrders;
    }

    const tab = ORDER_TABS.find(t => t.id === activeTab);
    if (!tab) return [];
       return orders.filter(o => {
      const isInTab = (tab.statuses as readonly string[]).includes(o.status);
      if (!isInTab) return false;

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = o.customer_name?.toLowerCase().includes(query);
        const matchesId = o.id.toLowerCase().includes(query);
        const matchesTable = o.tables?.table_number?.toString().includes(query);
        if (!matchesName && !matchesId && !matchesTable) return false;
      }

      return true;
    }).sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [orders, waiterCalls, activeTab, searchQuery, completedOrders]);

  const prevPendingOrdersCount = useRef(orders.filter(o => o.status === 'pending').length);
  const isNewOrder = useRef(false);

  useEffect(() => {
    const currentPendingCount = orders.filter(o => o.status === 'pending').length;
    if (currentPendingCount > prevPendingOrdersCount.current) {
      isNewOrder.current = true;
    } else if (currentPendingCount === 0) {
      isNewOrder.current = false;
    }
    prevPendingOrdersCount.current = currentPendingCount;
  }, [orders]);

  const paginatedOrders = useMemo(() => {
    if (activeTab === 'completed') return filteredOrders; // Already paginated from server
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, activeTab]);

  const totalPages = activeTab === 'completed' 
    ? Math.ceil(completedTotalCount / itemsPerPage)
    : Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className="max-w-full mx-auto space-y-3 pb-24 px-2 sm:px-4">
      <div className="flex-1 space-y-5">
        {/* Header & Tabs */}
      <div className="bg-white rounded-2xl p-2 sm:p-3 border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shadow-sm">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">Kitchen Flow</h2>
              <p className="text-slate-400 font-normal text-[9px] uppercase tracking-widest mt-1.5">Live Monitor • {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
            <button 
              onClick={() => setIsManualOrderOpen(true)}
              className="w-8 h-8 sm:w-7 sm:h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center hover:bg-brand-700 transition-all shadow-md shadow-brand-100 active:scale-95 order-last sm:order-first"
              title="Manual Order Entry"
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Compact Search & Filters */}
            <div className="flex-1 flex items-center gap-1.5 bg-slate-50 p-1.5 sm:p-2 rounded-xl border border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search ID, Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-2 py-1.5 sm:py-2 bg-white border-none rounded-lg text-[10px] sm:text-xs font-medium focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-slate-300"
                />
              </div>
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); }}
                  className="p-1.5 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button 
              onClick={async () => {
                setIsRefreshing(true);
                await fetchOrders();
                setTimeout(() => setIsRefreshing(false), 1000);
              }}
              className="w-8 h-8 sm:w-7 sm:h-7 shrink-0 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-brand-600 transition-all active:scale-90 shadow-md"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 sm:p-1.5 bg-slate-50 rounded-2xl gap-1 sm:gap-1.5 border border-slate-100 overflow-x-auto no-scrollbar">
          {ORDER_TABS.map((tab) => {
            const isAssistanceTab = tab.id === 'assistance';
            const isIncomingTab = tab.id === 'incoming';
            const isCompletedTab = tab.id === 'completed';
            const count = isAssistanceTab 
              ? waiterCalls.length 
              : isCompletedTab ? completedTotalCount : orders.filter(o => (tab.statuses as readonly string[]).includes(o.status)).length;
            const isActive = activeTab === tab.id;
            const hasActiveCalls = isAssistanceTab && count > 0;
            const hasIncomingOrders = isIncomingTab && count > 0;
            const shouldGlow = (isAssistanceTab && hasActiveCalls) || (isIncomingTab && isNewOrder.current);
            const shouldPlaySound = isAssistanceTab && hasUnseenCalls && !isActive;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
                  isActive 
                    ? "bg-white text-brand-600 shadow-md ring-1 ring-slate-200/50" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50",
                  shouldGlow && (isAssistanceTab ? "animate-pulse bg-amber-50 text-amber-600 border border-amber-200" : "animate-pulse bg-emerald-50 text-emerald-600 border border-emerald-200")
                )}
              >
                {React.cloneElement(tab.icon as React.ReactElement, { className: cn('w-3.5 h-3.5 sm:w-4 sm:h-4', shouldGlow && "animate-bounce") })}
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                    isActive ? "bg-brand-100 text-brand-600" : 
                    shouldGlow ? (isAssistanceTab ? "bg-amber-500 text-white" : "bg-emerald-500 text-white") : "bg-slate-200 text-slate-500"
                  )}>
                    {count}
                  </span>
                )}
                {shouldGlow && (
                  <span className={cn("absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping", isAssistanceTab ? "bg-amber-500" : "bg-emerald-500")} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Grid/List */}
      <div className={cn(
        (activeTab === 'completed' || activeTab === 'assistance') ? "flex flex-col gap-1" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-2"
      )}>
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Syncing Kitchen...</p>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 opacity-40 grayscale">
            <ShoppingBag className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">No {activeTab} items</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {paginatedOrders.map((order) => (
              activeTab === 'assistance' ? (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setSelectedCall(order)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center justify-between group shadow-sm hover:shadow-md border-l-4 border-l-amber-500 cursor-pointer"
                >
                  <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
                    {/* Table & ID */}
                    <div className="flex flex-col sm:w-32 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">T{order.table_number}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-medium text-slate-400">#{order.id.slice(0, 6).toUpperCase()}</span>
                      </div>
                      <span className="text-[10px] font-normal text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    {/* Request Details */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm sm:text-base font-bold text-slate-900 truncate block">{order.request || 'Assistance Requested'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{order.tables?.location || 'Main Area'}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex flex-col items-end sm:w-40 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveCall(order.id);
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-md active:scale-95"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'completed' ? (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
                    {/* Table & ID */}
                    <div className="flex flex-col sm:w-32 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">T{order.tables?.table_number || '??'}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-medium text-slate-400">#{order.id.slice(0, 6).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-normal text-slate-400">{new Date(order.created_at).getDate()} {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-normal text-slate-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    
                    {/* Customer Name */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">{order.customer_name || 'Guest'}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{order.order_items?.length || 0} items</span>
                        {order.customer_notes && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </div>
                    </div>

                    {/* Total & Status */}
                    <div className="flex flex-col items-end sm:w-36 shrink-0">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-900">Rs. {Number(order.total_amount || 0).toLocaleString()}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          order.status === 'completed' ? "bg-emerald-500" : (order.status === 'revoked' ? "bg-slate-400" : "bg-red-500")
                        )} />
                        <span className={cn(
                          "text-[8px] font-bold uppercase tracking-widest",
                          order.status === 'completed' ? "text-emerald-600" : ((order.status === 'revoked' || (order.status === 'cancelled' && order.rejection_reason === 'revoked')) ? "text-slate-400" : "text-red-600")
                        )}>
                          {order.status === 'cancelled' ? (order.rejection_reason === 'revoked' ? 'REVOKED' : 'REJECTED') : (order.status === 'revoked' ? 'REVOKED' : (order.status === 'completed' ? 'PAID' : order.status))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors ml-3" />
                </motion.div>
              ) : (
                <motion.div 
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedOrder(order)}
                  className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-400 hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden flex flex-col h-fit relative"
                >
                  {/* Status Indicator Dot */}
                  <div className={cn(
                    "absolute top-1.5 right-1.5 rounded-full transition-all duration-500",
                    order.status === 'pending' ? "w-2.5 h-2.5 bg-emerald-500 animate-ping" : "w-1 h-1",
                    order.status === 'pending' ? "bg-emerald-500" :
                    order.status === 'cooking' ? "bg-brand-500" :
                    order.status === 'ready' ? "bg-emerald-500" : "bg-slate-300"
                  )} />
                  {order.status === 'pending' && (
                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  )}

                  {/* Ticket Header */}
                  <div className="px-4 py-3 flex items-center border-b border-slate-100 bg-slate-50/50 overflow-hidden">
                    <div className="flex items-center gap-4 min-w-0 w-full">
                      <div className="flex flex-col shrink-0">
                        <span className="text-xs font-black text-slate-900 leading-none">T{order.tables?.table_number || '??'}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-200 shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-black text-brand-600 leading-none truncate pr-2 uppercase">{order.customer_name || 'Guest'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Metadata - Simplified */}
                  <div className="px-4 py-2 flex flex-col gap-0.5 bg-slate-50/30 border-b border-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-2.5 h-2.5 text-slate-300" />
                      <TimeElapsed createdAt={order.created_at} status={order.status} />
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 space-y-3 flex-1">
                    <div className="space-y-2">
                      {order.order_items?.slice(0, 4).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 text-xs">
                          <div className="w-4 h-4 rounded bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[9px] shrink-0 border border-slate-200">
                            {item.quantity}
                          </div>
                          <span className="font-mono text-[10px] text-slate-600 uppercase tracking-tight leading-tight line-clamp-2">{item.menu_items?.name}</span>
                        </div>
                      ))}
                      {order.order_items?.length > 4 && (
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-7">
                          + {order.order_items.length - 4} more items
                        </p>
                      )}
                    </div>

                    {order.customer_notes && (
                      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-100/50">
                        <p className="text-[10px] font-medium text-amber-700 leading-relaxed italic line-clamp-2">
                          "{order.customer_notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="p-3 bg-white border-t border-slate-100 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setRejectionReason('');
                        setRejectionOrder(order);
                      }}
                      className="w-7 h-7 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 shrink-0"
                    >
                      <X className="w-3.5 h-3.5 mt-0.5" />
                    </button>

                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'cooking')}
                        className="flex-1 bg-emerald-600 text-white py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-md"
                      >
                        Approve
                      </button>
                    )}

                    {order.status === 'cooking' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="flex-1 bg-brand-600 text-white py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all active:scale-95 shadow-md"
                      >
                        Ready
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="flex-1 bg-emerald-600 text-white py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-md"
                      >
                        PAID
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              // Show limited pages if too many
              if (totalPages > 7) {
                if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-slate-400">...</span>;
                  return null;
                }
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all",
                    currentPage === page 
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-100" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>

    {/* Assistance Detail Modal */}
    <AnimatePresence>
      {selectedCall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCall(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[320px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col my-auto"
          >
            {/* Minimal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Assistance</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest">
                  Table {selectedCall.table_number}
                </span>
              </div>
              <button 
                onClick={() => setSelectedCall(null)}
                className="p-1.5 hover:bg-slate-50 rounded text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Minimal Content */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Request Details</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedCall.request || 'No details provided'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                  <p className="text-[10px] font-bold text-slate-900">
                    {new Date(selectedCall.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                  <p className="text-[10px] font-bold text-slate-900">
                    {selectedCall.tables?.location || 'Main Area'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    handleResolveCall(selectedCall.id);
                    setSelectedCall(null);
                  }}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Rejection Modal */}
      <AnimatePresence>
        {rejectionOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectionOrder(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[300px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col my-auto"
            >
              {/* Minimal Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Reject Order</h2>
                  <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded text-[9px] font-bold uppercase tracking-widest">
                    #{rejectionOrder.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>
                <button 
                  onClick={() => setRejectionOrder(null)}
                  className="p-1.5 hover:bg-slate-50 rounded text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reason (Required)</label>
                  <textarea 
                    placeholder="Why are you rejecting this order?"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className={cn(
                      "w-full bg-slate-50 border rounded-xl py-3 px-4 text-sm font-medium focus:bg-white focus:ring-0 h-24 resize-none transition-all",
                      rejectionReason.trim() ? "border-slate-200" : "border-red-100"
                    )}
                  />
                </div>

                <button 
                  disabled={!rejectionReason.trim()}
                  onClick={() => {
                    updateStatus(rejectionOrder.id, 'cancelled', rejectionReason).then(() => {
                      setRejectionOrder(null);
                      setRejectionReason('');
                    });
                  }}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-20 active:scale-95"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsWizard 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onUpdateStatus={updateStatus}
            onReject={(order) => {
              setRejectionReason('');
              setRejectionOrder(order);
            }}
          />
        )}
      </AnimatePresence>

      <ManualOrderModal 
        isOpen={isManualOrderOpen}
        onClose={() => setIsManualOrderOpen(false)}
        restaurant={restaurant}
        onOrderCreated={(isPaid) => {
          fetchOrders();
          if (isPaid) {
            fetchCompletedOrders();
            setActiveTab('completed');
          } else {
            setActiveTab('cooking');
          }
        }}
      />
    </div>
  );
};

export const WaiterCallManager = () => {
  const { restaurant, waiterCalls } = useDashboard();
  const calls = waiterCalls;
  const loading = false;

  const handleResolveCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('waiter_calls')
        .update({ status: 'resolved' })
        .eq('id', callId);

      if (error) throw error;
      toast.success(
        <span className="text-[8px] font-bold uppercase tracking-widest">Call Resolved</span>,
        { duration: 1500 }
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-slate-900 tracking-tight">Waiter Assistance</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Real-time requests from customers at their tables.</p>
        </div>
        <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{calls.length} Active Calls</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
          ))
        ) : calls.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No active requests</p>
          </div>
        ) : (
          calls.map((call) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black text-sm">
                  {call.table_number}
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(call.created_at).getDate()} {new Date(call.created_at).toLocaleDateString('en-US', { month: 'short' })} {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900">Table {call.table_number}</h3>
                  <div className="flex items-center gap-1 text-[8px] font-bold text-brand-600 uppercase tracking-widest">
                    <MapPin className="w-2.5 h-2.5" />
                    {call.tables?.location || 'General'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1 opacity-50">Request:</p>
                  <p className="text-xs text-slate-900 font-medium leading-relaxed">{call.request || 'Assistance requested'}</p>
                </div>
              </div>

              <button
                onClick={() => handleResolveCall(call.id)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 group"
              >
                <CheckCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                Mark Resolved
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export const StaffManager = () => {
  const { restaurant } = useDashboard();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', role: 'waiter' });
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (restaurant) {
      fetchStaff();
    }
  }, [restaurant]);

  const fetchStaff = async () => {
    if (staff.length === 0) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setStaff(data);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      toast.error(`Error loading staff: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.phone.trim() || !restaurant) {
      toast.error('Please fill in all fields.');
      return;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newStaff.phone.trim())) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          full_name: newStaff.name.trim(),
          phone: newStaff.phone.trim(),
          role: newStaff.role,
          restaurant_id: restaurant.id
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      if (data) {
        setStaff([data, ...staff]);
        setNewStaff({ name: '', phone: '', role: 'waiter' });
        setIsAddingStaff(false);
        setCurrentPage(1); // Reset to first page to see new staff
      }
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast.error(`Failed to add staff: ${error.message}`);
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      setStaff(staff.filter(s => s.id !== id));
      
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const updateStaff = async () => {
    if (!editingStaff || !editingStaff.full_name?.trim()) return;

    const currentPhone = editingStaff.phone?.trim() || editingStaff.email?.trim() || '';
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(currentPhone)) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .update({ 
          full_name: editingStaff.full_name.trim(),
          phone: currentPhone,
          role: editingStaff.role
        })
        .eq('id', editingStaff.id);
      
      if (error) throw error;
      
      setStaff(staff.map(s => s.id === editingStaff.id ? { ...s, ...editingStaff } : s));
      setEditingStaff(null);
      
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(staff.length / itemsPerPage);
  const paginatedStaff = staff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Loading Staff...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Staff Management</h2>
          <p className="text-slate-500 font-medium text-[10px]">Manage your kitchen and service team accounts.</p>
        </div>
        <button 
          onClick={() => setIsAddingStaff(true)}
          className="bg-[#0F172A] text-white px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Staff
        </button>
      </div>

      <AnimatePresence>
        {isAddingStaff && (
          <div className="fixed inset-0 z-50 grid place-items-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Add Staff Member</h3>
                <button onClick={() => setIsAddingStaff(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 98XXXXXXXX"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <div className="relative">
                    <select 
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 appearance-none transition-all"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="kitchen_staff">Kitchen Staff</option>
                      <option value="chef">Chef</option>
                      <option value="host">Host/Hostess</option>
                      <option value="bartender">Bartender</option>
                      <option value="delivery_driver">Delivery Driver</option>
                      <option value="cleaner">Cleaner</option>
                      <option value="manager">Manager</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsAddingStaff(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addStaff}
                    className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                  >
                    Save Staff
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingStaff && (
          <div className="fixed inset-0 z-50 grid place-items-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Edit Staff Member</h3>
                <button onClick={() => setEditingStaff(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={editingStaff.full_name}
                    onChange={(e) => setEditingStaff({...editingStaff, full_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 98XXXXXXXX"
                    value={editingStaff.phone || editingStaff.email || ''}
                    onChange={(e) => setEditingStaff({...editingStaff, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <div className="relative">
                    <select 
                      value={editingStaff.role}
                      onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium focus:bg-white focus:border-slate-900 focus:ring-0 appearance-none transition-all"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="kitchen_staff">Kitchen Staff</option>
                      <option value="chef">Chef</option>
                      <option value="host">Host/Hostess</option>
                      <option value="bartender">Bartender</option>
                      <option value="delivery_driver">Delivery Driver</option>
                      <option value="cleaner">Cleaner</option>
                      <option value="manager">Manager</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setEditingStaff(null)}
                    className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={updateStaff}
                    className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {deletingStaffId && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Staff Member?</h3>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone. The staff member will lose access to the dashboard.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingStaffId(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    deleteStaff(deletingStaffId);
                    setDeletingStaffId(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedStaff.map((member) => (
          <div 
            key={member.id}
            className={cn(
              "p-3 rounded-xl border transition-all relative overflow-hidden flex flex-col gap-3",
              "bg-white border-slate-200 shadow-sm hover:shadow-md"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                {member.full_name?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-bold text-slate-900 truncate tracking-tight">{member.full_name}</h3>
                <p className="text-[9px] font-medium text-slate-400 truncate">{member.phone || member.email}</p>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setEditingStaff(member)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-600 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setDeletingStaffId(member.id)}
                  className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <div className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest",
                member.role === 'manager' && "bg-purple-50 text-purple-600",
                member.role === 'kitchen_staff' && "bg-orange-50 text-orange-600",
                member.role === 'waiter' && "bg-emerald-50 text-emerald-600",
                member.role === 'chef' && "bg-blue-50 text-blue-600",
                member.role === 'host' && "bg-pink-50 text-pink-600",
                member.role === 'bartender' && "bg-indigo-50 text-indigo-600",
                member.role === 'delivery_driver' && "bg-cyan-50 text-cyan-600",
                member.role === 'cleaner' && "bg-slate-100 text-slate-600"
              )}>
                {member.role.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        ))}
        {staff.length === 0 && !isAddingStaff && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">No staff members added</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-600 disabled:opacity-50 disabled:hover:text-slate-400 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-8 h-8 rounded-lg text-[10px] font-bold transition-all",
                  currentPage === i + 1 
                    ? "bg-brand-600 text-white shadow-md shadow-brand-100" 
                    : "bg-white border border-slate-200 text-slate-400 hover:border-brand-200 hover:text-brand-600"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-600 disabled:opacity-50 disabled:hover:text-slate-400 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 shadow-xl ring-1 ring-black/20">
        <div className="mb-0.5 border-b border-white/5 pb-0.5">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
            {data.name || data.hour || 'Data'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Qty</span>
            <span className="text-[11px] font-black text-white leading-none">
              {data.value || data.orders || data.sales || 0}
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Rev</span>
            <span className="text-[11px] font-black text-emerald-400 leading-none">
              Rs.{Number(data.revenue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsView = () => {
  const { restaurant } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topItemsData, setTopItemsData] = useState<any[]>([]);
  const [leastPopularItemsData, setLeastPopularItemsData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<any[]>([]);
  const [tablePerformanceData, setTablePerformanceData] = useState<any[]>([]);
  
  // Filter state
  const [rangeType, setRangeType] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    if (restaurant) {
      fetchAnalyticsData();
    }
  }, [restaurant, rangeType, customDates.start, customDates.end]);

  const fetchAnalyticsData = async () => {
    if (revenueData.length === 0) setLoading(true);
    try {
      let startDate = new Date();
      let endDate = new Date();
      
      if (rangeType === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (rangeType === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (rangeType === '30d') {
        startDate = new Date(); // Reset to today
        startDate.setDate(startDate.getDate() - 30);
      } else if (rangeType === 'custom' && customDates.start && customDates.end) {
        startDate = new Date(customDates.start);
        endDate = new Date(customDates.end);
      } else if (rangeType === 'custom') {
        // Fallback if custom dates aren't set yet
        startDate.setDate(startDate.getDate() - 7);
      }
      
      // Set hours for accurate filtering
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // 1. Revenue Data
      console.log('Fetching analytics for restaurant:', restaurant.id);
      const { data: revData, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('restaurant_id', restaurant.id)
        .neq('status', 'revoked')
        .neq('status', 'cancelled')
        .or('payment_status.eq.paid,status.eq.completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (error) {
        console.error('Supabase error:', error);
      }
      console.log('Analytics Data Query Result:', { startDate: startDate.toISOString(), endDate: endDate.toISOString(), revData });

      // Grouping logic based on range length
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log('Diff Days:', diffDays);
      
      let formattedRev = [];

      if (rangeType === 'today') {
        // Hourly grouping
        const groupedRev = (revData || []).reduce((acc: any, curr) => {
          const hour = new Date(curr.created_at).getHours();
          if (!acc[hour]) acc[hour] = { revenue: 0, orders: 0 };
          acc[hour].revenue += Number(curr.total_amount);
          acc[hour].orders += 1;
          return acc;
        }, {});
        
        for (let i = 0; i < 24; i++) {
          formattedRev.push({
            name: `${i === 0 ? 12 : i > 12 ? i - 12 : i} ${i < 12 ? 'AM' : 'PM'}`,
            revenue: groupedRev[i]?.revenue || 0,
            orders: groupedRev[i]?.orders || 0
          });
        }
      } else if (rangeType === '7d') {
        // Default weekly view
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const groupedRev = (revData || []).reduce((acc: any, curr) => {
          const day = days[new Date(curr.created_at).getDay()];
          if (!acc[day]) acc[day] = { revenue: 0, orders: 0 };
          acc[day].revenue += Number(curr.total_amount);
          acc[day].orders += 1;
          return acc;
        }, {});

        formattedRev = days.map(day => ({
          name: day,
          revenue: groupedRev[day]?.revenue || 0,
          orders: groupedRev[day]?.orders || 0
        }));
        const today = new Date().getDay();
        formattedRev = [...formattedRev.slice(today + 1), ...formattedRev.slice(0, today + 1)];
      } else {
        // Dynamic range view - group by interval
        const interval = diffDays <= 32 ? 'day' : diffDays <= 365 ? 'month' : 'year';

        const getGroupingKey = (date: Date) => {
          // Use UTC to avoid timezone shifts
          const d = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
          if (interval === 'day') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (interval === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          return d.getFullYear().toString();
        };

        const incrementDate = (date: Date) => {
          if (interval === 'day') date.setDate(date.getDate() + 1);
          else if (interval === 'month') date.setMonth(date.getMonth() + 1);
          else date.setFullYear(date.getFullYear() + 1);
        };

        const groupedByDate = revData?.reduce((acc: any, curr) => {
          const key = getGroupingKey(new Date(curr.created_at));
          if (!acc[key]) acc[key] = { revenue: 0, orders: 0 };
          acc[key].revenue += Number(curr.total_amount);
          acc[key].orders += 1;
          return acc;
        }, {});
        console.log('Grouped By Date:', groupedByDate);

        // Fill in missing dates in range
        const tempDate = new Date(startDate);
        while (tempDate.getTime() <= endDate.getTime()) {
          const key = getGroupingKey(tempDate);
          console.log('Checking key:', key);
          formattedRev.push({
            name: key,
            revenue: groupedByDate?.[key]?.revenue || 0,
            orders: groupedByDate?.[key]?.orders || 0
          });
          incrementDate(tempDate);
          if (formattedRev.length > 100) break; // Limit to 100 points for chart readability
        }
      }
      setRevenueData(formattedRev);

      // 2. Top Items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('quantity, unit_price, menu_items(name), orders!inner(status, created_at)')
        .eq('orders.restaurant_id', restaurant.id)
        .neq('orders.status', 'revoked')
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString())
        .not('menu_items', 'is', null);

      const groupedItems = itemsData?.reduce((acc: any, curr: any) => {
        const name = curr.menu_items?.name;
        if (name) {
          if (!acc[name]) acc[name] = { sales: 0, revenue: 0 };
          acc[name].sales += curr.quantity;
          acc[name].revenue += (curr.quantity * (curr.unit_price || 0));
        }
        return acc;
      }, {});

      const formattedItems = Object.entries(groupedItems || {})
        .map(([name, data]: [string, any]) => ({ name, sales: data.sales, revenue: data.revenue }));
        
      setTopItemsData([...formattedItems].sort((a, b) => b.sales - a.sales).slice(0, 5));
      setLeastPopularItemsData([...formattedItems].sort((a, b) => a.sales - b.sales).slice(0, 5));

      // 3. Order Status
      const { data: statusData } = await supabase
        .from('orders')
        .select('status, created_at, total_amount')
        .eq('restaurant_id', restaurant.id)
        .neq('status', 'revoked')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const statusStats = statusData?.reduce((acc: any, curr) => {
        if (!acc[curr.status]) acc[curr.status] = { count: 0, revenue: 0 };
        acc[curr.status].count += 1;
        acc[curr.status].revenue += Number(curr.total_amount || 0);
        return acc;
      }, {});

      const getStatusData = (name: string, statuses: string[], color: string) => {
        const count = statuses.reduce((sum, s) => sum + (statusStats?.[s]?.count || 0), 0);
        const revenue = statuses.reduce((sum, s) => sum + (statusStats?.[s]?.revenue || 0), 0);
        return { name, value: count, revenue, color };
      };

      setOrderStatusData([
        getStatusData('Completed', ['completed'], '#22c55e'),
        getStatusData('Rejected', ['cancelled'], '#ef4444'),
        getStatusData('Pending', ['pending', 'cooking', 'ready'], '#f97316'),
      ]);

      // 4. Peak Hours & Table Performance
      const peakHours = statusData?.reduce((acc: any, curr) => {
        const hour = new Date(curr.created_at).getHours();
        const label = hour >= 12 ? `${hour === 12 ? 12 : hour - 12} PM` : `${hour === 0 ? 12 : hour} AM`;
        if (!acc[label]) acc[label] = { orders: 0, revenue: 0 };
        acc[label].orders += 1;
        acc[label].revenue += Number(curr.total_amount || 0);
        return acc;
      }, {});

      const hourLabels = ['11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'];
      setPeakHoursData(hourLabels.map(label => ({ 
        hour: label, 
        orders: peakHours?.[label]?.orders || 0,
        revenue: peakHours?.[label]?.revenue || 0
      })));

      // 5. Table Performance
      const { data: tableOrders } = await supabase
        .from('orders')
        .select('total_amount, tables(table_number)')
        .eq('restaurant_id', restaurant.id)
        .neq('status', 'revoked')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const tableStats = tableOrders?.reduce((acc: any, curr) => {
        const tableData = Array.isArray(curr.tables) ? curr.tables[0] : curr.tables;
        const tableNum = tableData?.table_number;
        if (tableNum) {
          if (!acc[tableNum]) acc[tableNum] = { orders: 0, revenue: 0 };
          acc[tableNum].orders += 1;
          acc[tableNum].revenue += Number(curr.total_amount || 0);
        }
        return acc;
      }, {});

      const formattedTables = Object.entries(tableStats || {})
        .map(([name, data]: [string, any]) => ({ 
          name: `Table ${name}`, 
          orders: data.orders,
          revenue: data.revenue
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);
      setTablePerformanceData(formattedTables);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-400">Analyzing data...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pb-32 select-none">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 -skew-x-12 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="space-y-1.5 w-full text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full text-[8px] font-bold uppercase tracking-widest border border-brand-100">
                <TrendingUp className="w-2.5 h-2.5" /> Performance Insights
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Business <span className="text-brand-600">Analytics</span>
              </h2>
              <p className="text-slate-500 font-medium text-[10px] max-w-xl">
                Deep dive into your restaurant's performance metrics. Track revenue, popular items, and customer behavior.
              </p>
            </div>
            <button 
              onClick={async () => {
                setIsRefreshing(true);
                await fetchAnalyticsData();
                setTimeout(() => setIsRefreshing(false), 1000);
              }}
              className="sm:hidden w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-brand-600 transition-all shrink-0 ml-4"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[8px] font-bold text-slate-900 uppercase tracking-widest mb-0.5">Last Updated</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Just Now</p>
            </div>
            <button 
              onClick={async () => {
                setIsRefreshing(true);
                await fetchAnalyticsData();
                setTimeout(() => setIsRefreshing(false), 1000);
              }}
              className="hidden sm:flex w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-brand-600 transition-all shrink-0"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'custom', label: 'Custom' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setRangeType(option.id as any)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 sm:flex-none",
                rangeType === option.id 
                  ? "bg-white text-brand-600 shadow-sm border border-slate-200" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {rangeType === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 w-full sm:w-auto max-w-[320px] sm:max-w-none sm:mx-0"
          >
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Calendar className="hidden sm:block absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input 
                  type="date"
                  value={customDates.start}
                  onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-1.5 sm:pl-8 sm:pr-1 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] sm:text-[10px] font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
              <span className="text-slate-300 text-[10px] shrink-0">→</span>
              <div className="relative flex-1 min-w-0">
                <Calendar className="hidden sm:block absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input 
                  type="date"
                  value={customDates.end}
                  onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-1.5 sm:pl-8 sm:pr-1 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] sm:text-[10px] font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
            </div>
            
          </motion.div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        {[
          { label: 'Total Revenue', value: `Rs. ${revenueData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}`, icon: <Banknote className="w-3.5 h-3.5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Orders', value: orderStatusData.reduce((acc, curr) => acc + curr.value, 0), icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Avg. Order', value: `Rs. ${orderStatusData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? Math.round(revenueData.reduce((acc, curr) => acc + curr.revenue, 0) / orderStatusData.reduce((acc, curr) => acc + curr.value, 0)).toLocaleString() : 0}`, icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Success Rate', value: `${orderStatusData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? Math.round((orderStatusData.find(d => d.name === 'Completed')?.value || 0) / orderStatusData.reduce((acc, curr) => acc + curr.value, 0) * 100) : 0}%`, icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className={cn("p-1.5 rounded-lg", stat.bg, stat.color)}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-base font-bold text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px] select-none outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Revenue Overview</h3>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Earnings Growth</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 p-0.5 bg-slate-50 rounded-lg border border-slate-100">
                <button 
                  onClick={() => setChartType('line')}
                  className={cn("p-1 rounded-md transition-all", chartType === 'line' ? "bg-white shadow-sm text-brand-600" : "text-slate-400 hover:text-slate-600")}
                >
                  <TrendingUp className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setChartType('bar')}
                  className={cn("p-1 rounded-md transition-all", chartType === 'bar' ? "bg-white shadow-sm text-brand-600" : "text-slate-400 hover:text-slate-600")}
                >
                  <LayoutGrid className="w-3 h-3" />
                </button>
              </div>
              <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <Banknote className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 pointer-events-auto">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <AreaChart 
                  id="revenue-area-chart" 
                  data={revenueData} 
                  margin={{ left: -10, right: 0, top: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                    tickFormatter={(value) => `Rs.${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} offset={20} isAnimationActive={false} />
                  <Area 
                    isAnimationActive={false}
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0F172A" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area isAnimationActive={false} type="monotone" dataKey="orders" hide />
                </AreaChart>
              ) : (
                <BarChart 
                  id="revenue-bar-chart" 
                  data={revenueData}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                    tickFormatter={(value) => `Rs.${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} offset={20} isAnimationActive={false} />
                  <Bar isAnimationActive={false} dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                  <Bar isAnimationActive={false} dataKey="orders" hide />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Order Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px] select-none outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Order Status</h3>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Efficiency Distribution</p>
            </div>
            <div className="w-7 h-7 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
              <PieChart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 min-h-0 pointer-events-auto">
            <div className="w-full h-48 sm:w-1/2 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart 
                  id="order-status-pie"
                >
                  <Pie
                    isAnimationActive={false}
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} offset={20} isAnimationActive={false} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-row sm:flex-col flex-wrap gap-3 sm:gap-4 w-full sm:w-auto px-2 justify-center sm:justify-start">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                    <span className="text-[10px] sm:text-sm font-bold text-slate-900 whitespace-nowrap">{item.value} Orders</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Selling Items */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px] select-none outline-none"
        >
          <div className="flex items-center justify-between mb-4 select-none">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Selling Items</h3>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Most Popular Menu Choices</p>
            </div>
            <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center">
              <Star className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 pointer-events-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                id="top-items-chart" 
                data={topItemsData} 
                layout="vertical" 
                margin={{ left: -10, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 600 }}
                  width={80}
                />
                <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.4 }} content={<CustomTooltip />} offset={20} isAnimationActive={false} />
                <Bar isAnimationActive={false} dataKey="sales" radius={[0, 6, 6, 0]} barSize={20}>
                  {topItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0F172A' : '#94a3b8'} />
                  ))}
                </Bar>
                <Bar isAnimationActive={false} dataKey="revenue" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Least Popular Items */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px] select-none outline-none"
        >
          <div className="flex items-center justify-between mb-4 select-none">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Least Popular Items</h3>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Items needing attention</p>
            </div>
            <div className="w-7 h-7 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 pointer-events-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                id="least-items-chart" 
                data={leastPopularItemsData} 
                layout="vertical" 
                margin={{ left: -10, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 600 }}
                  width={80}
                />
                <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.4 }} content={<CustomTooltip />} offset={20} isAnimationActive={false} />
                <Bar isAnimationActive={false} dataKey="sales" radius={[0, 6, 6, 0]} barSize={20}>
                  {leastPopularItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : '#e2e8f0'} />
                  ))}
                </Bar>
                <Bar isAnimationActive={false} dataKey="revenue" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Popular Tables */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px] select-none outline-none"
        >
          <div className="flex items-center justify-between mb-6 select-none">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Popular Tables</h3>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Most Active Dining Areas</p>
            </div>
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 pointer-events-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                id="popular-tables-chart" 
                data={tablePerformanceData} 
                margin={{ left: -10, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.4 }} content={<CustomTooltip />} offset={20} isAnimationActive={false} />
                <Bar isAnimationActive={false} dataKey="orders" fill="#0F172A" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar isAnimationActive={false} dataKey="revenue" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Peak Hours */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px] lg:col-span-2 select-none outline-none"
        >
          <div className="flex items-center justify-between mb-6 select-none">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Peak Hours</h3>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Busy Time Analysis</p>
            </div>
            <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 pointer-events-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                id="peak-hours-chart" 
                data={peakHoursData} 
                margin={{ left: -10, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.4 }} content={<CustomTooltip />} offset={20} isAnimationActive={false} />
                <Bar isAnimationActive={false} dataKey="orders" fill="#0F172A" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar isAnimationActive={false} dataKey="revenue" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Subscription Management Framework
const SubscriptionManager = ({ restaurant, onRefresh }: { restaurant: any; onRefresh: () => Promise<void> }) => {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<any>(null);

  // Map database tier to display plan
  const currentTier = restaurant?.subscription_tier || 'free';
  const currentStatus = restaurant?.subscription_status || 'active';
  const currentCredit = Number(restaurant?.subscription_credit || 0);
  const expiryDate = restaurant?.subscription_expires_at || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();

  const availablePlans = [
    {
      id: 'free',
      name: 'Basic Starter',
      price: 0,
      description: 'Perfect for small cafes and food trucks.',
      features: ['Up to 100 orders/mo', 'Standard Support', 'Basic Analytics'],
      tier: 'free'
    },
    {
      id: 'pro',
      name: 'Premium POS',
      price: 49.99,
      description: 'The complete solution for busy restaurants.',
      features: ['Unlimited Orders', 'Priority Support', 'Advanced Analytics', 'Custom Domain'],
      tier: 'pro'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 149.99,
      description: 'For multi-location chains and large venues.',
      features: ['Multiple Locations', 'Dedicated Manager', 'API Access', 'White-label App'],
      tier: 'enterprise'
    }
  ];

  const currentPlan = availablePlans.find(p => p.tier === currentTier) || availablePlans[0];

  const calculateProration = (newTier: string) => {
    const newPlan = availablePlans.find(p => p.tier === newTier)!;
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    // Calculate remaining time in current month (assuming 30-day month for simplicity)
    const remainingTime = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    // Credit from current plan's remaining time + existing credit
    const unusedValue = currentPlan.price * remainingTime;
    const totalCredit = currentCredit + unusedValue;
    
    const amountToPay = Math.max(0, newPlan.price - totalCredit);
    const remainingCredit = Math.max(0, totalCredit - newPlan.price);

    return {
      newPlan,
      unusedValue: unusedValue.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      amountToPay: amountToPay.toFixed(2),
      remainingCredit: remainingCredit.toFixed(2)
    };
  };

  const handleUpgrade = async (tier: string) => {
    if (!restaurant) return;
    const calculation = calculateProration(tier);
    setShowConfirm({ tier, ...calculation });
  };

  const confirmUpgrade = async () => {
    if (!restaurant || !showConfirm) return;
    const { tier, amountToPay, remainingCredit } = showConfirm;
    setUpgrading(tier);
    
    try {
      // In a real app, this would involve a payment gateway call if amountToPay > 0
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_expires_at: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          subscription_credit: Number(remainingCredit)
        })
        .eq('id', restaurant.id);

      if (error) throw error;
      
      toast.success(
        <span className="text-[8px] font-bold uppercase tracking-widest">Plan Switched to {tier.toUpperCase()}</span>,
        { duration: 1500 }
      );
      setShowConfirm(null);
      await onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded-full text-[8px] font-bold uppercase tracking-widest border border-brand-500/30">
              <Zap className="w-2.5 h-2.5" /> Current Plan
            </div>
            <h3 className="text-lg font-bold tracking-tight">{currentPlan.name}</h3>
            <div className="flex flex-wrap gap-3 text-slate-400 text-[10px] font-medium">
              <div className="flex items-center gap-1">
                <CheckCircle className={cn("w-3 h-3", currentStatus === 'active' ? "text-brand-400" : "text-red-400")} />
                Status: <span className="text-white capitalize">{currentStatus}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand-400" />
                Renews on: <span className="text-white">{new Date(expiryDate).toLocaleDateString()}</span>
              </div>
              {currentCredit > 0 && (
                <div className="flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-emerald-400" />
                  Credit: <span className="text-emerald-400">Rs. {currentCredit.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center items-end gap-0.5">
            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Monthly Investment</p>
            <p className="text-xl font-bold tracking-tight">Rs. {currentPlan.price}<span className="text-xs text-slate-500 font-medium">/mo</span></p>
          </div>
        </div>
      </motion.div>

      {/* Available Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availablePlans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -3 }}
              className={cn(
                "bg-white rounded-xl p-4 border transition-all flex flex-col h-full",
                isCurrent ? "border-brand-500 shadow-md shadow-brand-50" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  isCurrent ? "bg-brand-50 text-brand-600" : "bg-slate-50 text-slate-400"
                )}>
                  <Package className="w-3.5 h-3.5" />
                </div>
                {isCurrent && (
                  <span className="bg-brand-500 text-white text-[6px] font-black uppercase tracking-widest px-1 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-0.5">{plan.name}</h4>
              <p className="text-[9px] text-slate-500 font-medium mb-2 leading-tight">{plan.description}</p>
              <div className="mb-3">
                <span className="text-lg font-bold text-slate-900">Rs. {plan.price}</span>
                <span className="text-slate-400 text-[9px] font-medium">/mo</span>
              </div>
              <div className="space-y-1.5 mb-4 flex-grow">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[9px] font-medium text-slate-600">
                    <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleUpgrade(plan.tier)}
                disabled={isCurrent || upgrading !== null}
                className={cn(
                  "w-full py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                  isCurrent 
                    ? "bg-slate-100 text-slate-400 cursor-default" 
                    : "bg-slate-900 text-white hover:bg-brand-600 shadow-md shadow-slate-200"
                )}
              >
                {upgrading === plan.tier ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                ) : null}
                {isCurrent ? 'Current Plan' : upgrading === plan.tier ? 'Processing...' : 'Switch Plan'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Confirm Plan Change</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Prorated Calculation</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-6">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-slate-500">New Plan ({showConfirm.newPlan.name})</span>
                  <span className="text-slate-900 font-bold">Rs. {showConfirm.newPlan.price}</span>
                </div>
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-slate-500">Unused Time Credit</span>
                  <span className="text-emerald-600 font-bold">- Rs. {showConfirm.unusedValue}</span>
                </div>
                {currentCredit > 0 && (
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-slate-500">Existing Credit</span>
                    <span className="text-emerald-600 font-bold">- Rs. {currentCredit.toFixed(2)}</span>
                  </div>
                )}
                <div className="h-px bg-slate-200 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Total to Pay Now</span>
                  <span className="text-lg font-black text-brand-600 tracking-tight">Rs. {showConfirm.amountToPay}</span>
                </div>
                {Number(showConfirm.remainingCredit) > 0 && (
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest text-right">
                    + Rs. {showConfirm.remainingCredit} Remaining Credit
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpgrade}
                  className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                >
                  Confirm & Pay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Billing History Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Billing History</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Recent Transactions</p>
          </div>
          <button className="text-brand-600 text-[10px] font-bold hover:underline flex items-center gap-1 uppercase tracking-widest">
            <Download className="w-3 h-3" /> Export PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-[10px] font-medium text-slate-600">Mar {i + 10}, 2026</td>
                  <td className="px-4 py-3 text-[10px] font-bold text-slate-900">{currentPlan.name} Subscription</td>
                  <td className="px-4 py-3 text-[10px] font-bold text-slate-900">Rs. {currentPlan.price}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">Paid</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-all">
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const RestaurantSettings = () => {
  const { 
    restaurant: initialRestaurant, 
    refreshRestaurant,
    isSoundEnabled,
    setIsSoundEnabled,
    playNotification,
    isSidebarOpen
  } = useDashboard();
  const [restaurant, setRestaurant] = useState<any>(initialRestaurant);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'subscription'>('general');
  const [initialSoundEnabled, setInitialSoundEnabled] = useState(isSoundEnabled);

  const hasChanges = useMemo(() => {
    if (!restaurant || !initialRestaurant) return false;
    return (
      restaurant.name !== initialRestaurant.name ||
      restaurant.phone !== initialRestaurant.phone ||
      restaurant.address !== initialRestaurant.address ||
      restaurant.storefront_config?.monthly_goal !== initialRestaurant.storefront_config?.monthly_goal ||
      isSoundEnabled !== initialSoundEnabled
    );
  }, [restaurant, initialRestaurant, isSoundEnabled, initialSoundEnabled]);

  useEffect(() => {
    setRestaurant(initialRestaurant);
    setInitialSoundEnabled(isSoundEnabled);
  }, [initialRestaurant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setSaving(true);
    
    try {
      const newConfig = { 
        ...(restaurant.storefront_config || {}), 
        monthly_goal: restaurant.storefront_config?.monthly_goal || 0 
      };

      const { error } = await supabase
        .from('restaurants')
        .update({
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          storefront_config: newConfig
        })
        .eq('id', restaurant.id);
      
      if (error) throw error;
      
      await refreshRestaurant();
      setInitialSoundEnabled(isSoundEnabled);
      toast.success(
        <span className="text-[8px] font-bold uppercase tracking-widest">Settings Saved</span>,
        { duration: 1500 }
      );
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!restaurant) return (
    <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center">
      <Settings className="w-12 h-12 text-slate-100 mx-auto mb-4" />
      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Restaurant profile not found</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest"
      >
        Retry Refresh
      </button>
    </div>
  );

  return (
    <div className="space-y-8 pb-32">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 -skew-x-12 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full text-[8px] font-bold uppercase tracking-widest border border-brand-100">
              <Settings className="w-2.5 h-2.5" /> Configuration
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              Restaurant <span className="text-brand-600">Settings</span>
            </h2>
            <p className="text-slate-500 font-medium text-[10px] max-w-xl">
              Manage your restaurant's profile, contact information, and subscription plans.
            </p>
          </div>
          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md">
            <Store className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'general' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'subscription' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Subscription & Plans
        </button>
      </div>

      {activeTab === 'general' ? (
        <>
          <form onSubmit={handleSave} className="space-y-6">
          {/* Restaurant Profile Block */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Restaurant Profile</h3>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Basic Identity Details</p>
              </div>
              <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={restaurant.name}
                    onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-slate-900 font-medium text-xs"
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input
                    type="tel"
                    value={restaurant.phone || ''}
                    onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-slate-900 font-medium text-xs"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                <textarea
                  value={restaurant.address || ''}
                  onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-slate-900 font-medium min-h-[80px] resize-none text-xs"
                  placeholder="Enter full address"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Business Objectives Block */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Business Objectives</h3>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Growth & Revenue Targets</p>
              </div>
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Revenue Goal (Rs.)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rs.</div>
                  <input
                    type="number"
                    value={restaurant.storefront_config?.monthly_goal || ''}
                    onChange={(e) => setRestaurant({ 
                      ...restaurant, 
                      storefront_config: { 
                        ...(restaurant.storefront_config || {}), 
                        monthly_goal: Number(e.target.value) 
                      } 
                    })}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-slate-900 font-medium text-xs"
                    placeholder="e.g. 500000"
                  />
                </div>
                <p className="text-[8px] text-slate-400 ml-1">Set a monthly revenue target to track progress on your overview dashboard. Leave empty or 0 to hide.</p>
              </div>
            </div>
          </motion.div>

          {/* System Notifications Block */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">System Notifications</h3>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Audio & Alert Preferences</p>
              </div>
              <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">New Order Sound</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-sm">
                      Play a continuous alert tone when a new order arrives until it is approved or rejected.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    className={cn(
                      "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isSoundEnabled ? "bg-brand-600" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isSoundEnabled ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {isSoundEnabled && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200/50">
                    <button
                      type="button"
                      onClick={playNotification}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Test Sound
                    </button>
                    <p className="text-[9px] text-slate-400 font-medium italic">
                      * If you don't hear anything, please click the test button to grant browser permission.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </form>

        {/* Sticky Save Footer */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className={cn(
                "fixed !bottom-0 !mb-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 z-[60] flex items-center justify-between gap-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] transition-all duration-300",
                isSidebarOpen ? "lg:left-52" : "lg:left-16"
              )}
            >
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Unsaved Changes</p>
                </div>
                <p className="text-[9px] text-slate-500 font-medium">Don't forget to save your settings.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={() => {
                    setRestaurant(initialRestaurant);
                    setIsSoundEnabled(initialSoundEnabled);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#0F172A] text-white px-10 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50 active:scale-95"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Account Status</p>
              <p className="text-xs font-bold text-slate-900">Verified Partner</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Public Profile</p>
              <p className="text-xs font-bold text-slate-900">Active & Visible</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Plan Details</p>
              <p className="text-xs font-bold text-slate-900">Premium POS</p>
            </div>
          </div>
        </div>
      </>
    ) : (
        <SubscriptionManager restaurant={restaurant} onRefresh={refreshRestaurant} />
      )}
    </div>
  );
};

export const Storefront = () => {
  const { restaurant, refreshRestaurant } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [heroImage, setHeroImage] = useState(restaurant?.hero_image_url || '');
  const [logoUrl, setLogoUrl] = useState(restaurant?.logo_url || '');
  const [config, setConfig] = useState<any>(() => {
    const baseConfig = restaurant?.storefront_config || {
      banners: [],
      theme: 'modern',
      showRating: true,
      showPrepTime: true,
      showSearch: true
    };
    if (!baseConfig.banners || baseConfig.banners.length === 0) {
      baseConfig.banners = [{ title: '', subtitle: '', image_url: '', link: '' }];
    }
    return baseConfig;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [mediaSelectorConfig, setMediaSelectorConfig] = useState<{ isOpen: boolean; type: 'hero' | 'banner' | 'logo'; index?: number }>({ isOpen: false, type: 'hero' });
  const { isSidebarOpen } = useDashboard();

  const hasChanges = useMemo(() => {
    if (!restaurant) return false;
    
    // Get the current "initial" state from the restaurant object
    const initialHero = restaurant.hero_image_url || '';
    const initialLogo = restaurant.logo_url || '';
    const initialConfig = restaurant.storefront_config || {};
    
    // Normalize initial config for comparison (matching the initialization logic)
    const normalizedInitialConfig = {
      banners: initialConfig.banners || [],
      theme: initialConfig.theme || 'modern',
      showRating: initialConfig.showRating !== false,
      showPrepTime: initialConfig.showPrepTime !== false,
      showSearch: initialConfig.showSearch !== false,
      ...initialConfig
    };
    if (!normalizedInitialConfig.banners || normalizedInitialConfig.banners.length === 0) {
      normalizedInitialConfig.banners = [{ title: '', subtitle: '', image_url: '', link: '' }];
    }

    // Normalize current config for comparison
    const normalizedCurrentConfig = {
      banners: config.banners || [],
      theme: config.theme || 'modern',
      showRating: config.showRating !== false,
      showPrepTime: config.showPrepTime !== false,
      showSearch: config.showSearch !== false,
      ...config
    };

    return (
      heroImage !== initialHero ||
      logoUrl !== initialLogo ||
      JSON.stringify(normalizedCurrentConfig) !== JSON.stringify(normalizedInitialConfig)
    );
  }, [config, heroImage, logoUrl, restaurant]);

  useEffect(() => {
    if (restaurant) {
      setHeroImage(restaurant.hero_image_url || '');
      setLogoUrl(restaurant.logo_url || '');
      const baseConfig = JSON.parse(JSON.stringify(restaurant.storefront_config || {
        banners: [],
        theme: 'modern',
        showRating: true,
        showPrepTime: true,
        showSearch: true
      }));
      if (!baseConfig.banners || baseConfig.banners.length === 0) {
        baseConfig.banners = [{ title: '', subtitle: '', image_url: '', link: '' }];
      }
      setConfig(baseConfig);
    }
  }, [restaurant]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          hero_image_url: heroImage,
          logo_url: logoUrl,
          storefront_config: config
        })
        .eq('id', restaurant.id);

      if (error) throw error;
      toast.success(
        <span className="text-[8px] font-bold uppercase tracking-widest">Storefront Updated</span>,
        { duration: 1500 }
      );
      await refreshRestaurant();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    if (mediaSelectorConfig.type === 'hero') {
      setHeroImage(url);
    } else if (mediaSelectorConfig.type === 'logo') {
      setLogoUrl(url);
    } else if (mediaSelectorConfig.type === 'banner' && mediaSelectorConfig.index !== undefined) {
      const newBanners = [...(config.banners || [])];
      newBanners[mediaSelectorConfig.index] = { ...newBanners[mediaSelectorConfig.index], image_url: url };
      setConfig({ ...config, banners: newBanners });
    }
  };

  const addBanner = () => {
    if ((config.banners || []).length >= 3) {
      toast.error("Maximum 3 banners allowed");
      return;
    }
    setConfig({
      ...config,
      banners: [...(config.banners || []), { title: '', subtitle: '', image_url: '', link: '' }]
    });
  };

  const removeBanner = (index: number) => {
    const newBanners = config.banners.filter((_: any, i: number) => i !== index);
    setConfig({ ...config, banners: newBanners });
  };

  const updateBanner = (index: number, field: string, value: string) => {
    const newBanners = [...config.banners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setConfig({ ...config, banners: newBanners });
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Storefront Settings</h1>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Customize your public menu page appearance and features.</p>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={`/order/${restaurant?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0"
          >
            <ExternalLink className="w-3 h-3" /> Preview Menu
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Logo & Hero Section Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Branding & Hero</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Set your restaurant's logo and main hero image.</p>
            </div>
            <div className="p-5 space-y-5">
              {/* Logo Upload */}
              <div className="space-y-3">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Restaurant Logo</label>
                <div className="flex items-center gap-5">
                  <div className="relative group w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center shrink-0">
                    {logoUrl ? (
                      <>
                        <img src={logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <button 
                            onClick={() => setLogoUrl('')}
                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-300">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'logo' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all"
                    >
                      <Upload className="w-3 h-3" />
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    <p className="text-[9px] text-slate-400 font-medium">Recommended: Square PNG or SVG (max 2MB)</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-3">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hero Image</label>
                <div className="relative group aspect-[21/9] rounded-xl overflow-hidden bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                  {heroImage ? (
                    <>
                      <img src={heroImage} className="w-full h-full object-cover" alt="Hero" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'hero' })}
                          className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all shadow-lg flex items-center gap-1.5"
                        >
                          <Upload className="w-3 h-3" />
                          Change
                        </button>
                        <button 
                          onClick={() => setHeroImage('')}
                          className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-600 transition-all shadow-lg flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <button 
                      onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'hero' })}
                      className="flex flex-col items-center gap-2 text-slate-400 hover:text-brand-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold">Upload Hero Image (Recommended 1920x800)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Promotional Banners / Ads */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Promotional Banners</h3>
                <p className="text-[10px] text-slate-500 font-medium">Add up to 3 special offers or ads that appear between menu categories.</p>
              </div>
              {(config.banners || []).length < 3 && (
                <button 
                  onClick={addBanner}
                  className="p-1.5 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-5 space-y-5">
              {config.banners?.map((banner: any, index: number) => (
                <div key={index} className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Banner Slot {index + 1}</span>
                    <button 
                      onClick={() => removeBanner(index)}
                      className="p-1.5 bg-red-50 text-red-600 rounded-lg transition-all border border-red-100 hover:bg-red-100 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Remove Banner</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Banner Image</label>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                          {banner.image_url ? (
                            <>
                              <img src={banner.image_url} className="w-full h-full object-cover" alt="Banner" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'banner', index })}
                                  className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all shadow-lg flex items-center gap-1.5"
                                >
                                  <Upload className="w-3 h-3" />
                                  Change
                                </button>
                                <button 
                                  onClick={() => updateBanner(index, 'image_url', '')}
                                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-600 transition-all shadow-lg flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              </div>
                            </>
                          ) : (
                            <button 
                              onClick={() => setMediaSelectorConfig({ isOpen: true, type: 'banner', index })}
                              className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-[9px] font-bold">Upload Image</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Headline</label>
                        <input 
                          type="text" 
                          value={banner.title}
                          onChange={(e) => updateBanner(index, 'title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 transition-all"
                          placeholder="e.g. 20% OFF on Weekends"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subtext</label>
                        <input 
                          type="text" 
                          value={banner.subtitle}
                          onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-medium text-slate-600 focus:ring-2 focus:ring-brand-500 transition-all"
                          placeholder="e.g. Valid on all main courses"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!config.banners || config.banners.length === 0) && (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No banners active</p>
                  <button 
                    onClick={addBanner}
                    className="mt-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-brand-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-3 h-3" /> Add Promotional Banner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Public Link Card */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl shadow-slate-200">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10">
                <Globe className="w-2.5 h-2.5" /> Public Menu Link
              </div>
              <h3 className="text-base font-bold tracking-tight">Your Storefront URL</h3>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-3">
              <code className="text-[10px] font-mono text-brand-400 flex-1 truncate">
                {window.location.origin}/order/{restaurant?.slug}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/order/${restaurant?.slug}`);
                  toast.success(
                    <span className="text-[8px] font-bold uppercase tracking-widest">Link Copied</span>,
                    { duration: 1500 }
                  );
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-white/40 text-[9px] font-medium leading-relaxed">
              This link is unique to your restaurant. Customers can scan your QR codes to reach this page instantly.
            </p>
          </div>

          {/* Display Settings */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Display Options</h3>
              <p className="text-[10px] text-slate-500 font-medium">Control what information is visible on your menu.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Storefront Status (Open/Closed)', key: 'is_open' },
                { label: 'Show Estimated Prep Time', key: 'showPrepTime' },
                { label: 'Enable Search Bar', key: 'showSearch' },
              ].map((option) => (
                <label key={option.key} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{option.label}</span>
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={config[option.key] !== false}
                      onChange={(e) => setConfig({ ...config, [option.key]: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Footer Settings */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Footer Section</h3>
              <p className="text-[10px] text-slate-500 font-medium">Customize the culinary philosophy section at the bottom of your menu.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Section Title</label>
                <input 
                  type="text"
                  value={config.footerTitle ?? 'Our Culinary Philosophy'}
                  onChange={(e) => setConfig({ ...config, footerTitle: e.target.value })}
                  placeholder="e.g. Our Culinary Philosophy"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-brand-500 appearance-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <textarea 
                  value={config.footerDescription ?? "We believe that a great meal is more than just food—it is an experience, a memory, and a celebration of life's simple pleasures. Every dish we serve is crafted with passion, honoring tradition while embracing innovation."}
                  onChange={(e) => setConfig({ ...config, footerDescription: e.target.value })}
                  placeholder="Enter your restaurant's philosophy or description..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-brand-500 appearance-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Theme & Social Media */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Theme Color</h3>
                <p className="text-[10px] text-slate-500 font-medium">Choose a color that matches your brand identity.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {['#0F172A', '#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#16A34A'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setConfig({ ...config, themeColor: color })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      config.themeColor === color ? "border-slate-900 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden">
                  <input 
                    type="color" 
                    value={config.themeColor || '#0F172A'}
                    onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Social Media</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enable to show on menu</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Instagram', key: 'instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
                  { label: 'Facebook', key: 'facebook', icon: Facebook, placeholder: 'https://facebook.com/page' },
                  { label: 'WhatsApp', key: 'whatsapp', icon: MessageCircle, placeholder: 'Phone number with country code' },
                  { label: 'TikTok', key: 'tiktok', icon: Music2, placeholder: 'https://tiktok.com/@username' },
                ].map((social) => {
                  const isEnabled = config.social?.[`${social.key}_enabled`] !== false;
                  return (
                    <div key={social.key} className={cn(
                      "p-3 rounded-2xl border transition-all duration-300",
                      isEnabled ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60"
                    )}>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0",
                            isEnabled ? "bg-brand-50 text-brand-600" : "bg-slate-200 text-slate-400"
                          )}>
                            <social.icon className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{social.label}</span>
                        </div>
                        <button
                          onClick={() => setConfig({
                            ...config,
                            social: {
                              ...(config.social || {}),
                              [`${social.key}_enabled`]: !isEnabled
                            }
                          })}
                          className={cn(
                            "w-9 h-5 rounded-full relative transition-all duration-300 shrink-0",
                            isEnabled ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300",
                            isEnabled ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                      {isEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-1"
                        >
                          <input 
                            type="text" 
                            value={config.social?.[social.key] || ''}
                            onChange={(e) => setConfig({ 
                              ...config, 
                              social: { ...(config.social || {}), [social.key]: e.target.value } 
                            })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-medium focus:ring-2 focus:ring-brand-500 transition-all"
                            placeholder={social.placeholder}
                          />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Footer */}
      <AnimatePresence>
        {hasChanges && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className={cn(
                "fixed !bottom-0 !mb-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 z-[60] flex items-center justify-between gap-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] transition-all duration-300",
                isSidebarOpen ? "lg:left-52" : "lg:left-16"
              )}
            >
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Unsaved Changes</p>
              </div>
              <p className="text-[9px] text-slate-500 font-medium">Don't forget to save your storefront configuration.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => {
                  if (restaurant) {
                    setHeroImage(restaurant.hero_image_url || '');
                    setLogoUrl(restaurant.logo_url || '');
                    const baseConfig = JSON.parse(JSON.stringify(restaurant.storefront_config || {
                      banners: [],
                      theme: 'modern',
                      showRating: true,
                      showPrepTime: true,
                      showSearch: true
                    }));
                    if (!baseConfig.banners || baseConfig.banners.length === 0) {
                      baseConfig.banners = [{ title: '', subtitle: '', image_url: '', link: '' }];
                    }
                    setConfig(baseConfig);
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-[#0F172A] text-white px-10 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50 active:scale-95"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MediaSelectorModal
        isOpen={mediaSelectorConfig.isOpen}
        onClose={() => setMediaSelectorConfig({ ...mediaSelectorConfig, isOpen: false })}
        onSelect={handleMediaSelect}
        restaurantId={restaurant?.id || ''}
      />
    </div>
  );
};

export const FeedbackManager = () => {
  const { restaurant } = useDashboard();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const pageSize = 15;

  useEffect(() => {
    if (restaurant) {
      fetchFeedbacks();

      // Set up real-time subscription
      const subscription = supabase
        .channel(`feedbacks-${restaurant.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'feedbacks',
          filter: `restaurant_id=eq.${restaurant.id}`
        }, () => {
          fetchFeedbacks();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [restaurant, page]);

  const fetchFeedbacks = async () => {
    if (feedbacks.length === 0) setLoading(true);
    try {
      const { data, count, error } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setFeedbacks(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .update({ status: 'resolved' })
        .eq('id', id);

      if (error) throw error;
      
      fetchFeedbacks();
      setSelectedFeedback(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-slate-900 tracking-tight">Customer Feedback</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Manage and acknowledge feedback from your customers.</p>
        </div>
        <div className="px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{totalCount} Pending</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
          ))
        ) : feedbacks.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No pending feedback</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {feedbacks.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => setSelectedFeedback(item)}
                className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-4 flex items-center justify-between transition-all group shadow-sm hover:shadow-md border-l-4 border-l-brand-500 cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0">
                  {/* Customer & Table */}
                  <div className="flex flex-col w-20 sm:w-32 shrink-0">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate max-w-[60px] sm:max-w-[80px]">
                        {item.is_anonymous ? 'Anon' : item.customer_name}
                      </span>
                      {!item.is_anonymous && item.table_number && (
                        <>
                          <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-slate-300" />
                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">T{item.table_number}</span>
                        </>
                      )}
                    </div>
                    {!item.is_anonymous && (
                      <span className="text-[7px] sm:text-[8px] font-normal text-slate-400 mt-0.5">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  
                  {/* Feedback Content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] sm:text-xs font-medium text-slate-600 truncate block leading-relaxed">
                      {item.feedback}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col items-end w-24 sm:w-36 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcknowledge(item.id);
                      }}
                      className="px-2 sm:px-4 py-1 sm:py-2 bg-slate-900 text-white rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-bold uppercase tracking-widest hover:bg-brand-600 transition-all shadow-sm active:scale-95"
                    >
                      Ack
                      <span className="hidden sm:inline ml-0.5">nowledge</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all",
                  page === i + 1 
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-100" 
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Feedback Detail Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeedback(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[320px] bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] my-auto"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {selectedFeedback.is_anonymous ? 'Anonymous Feedback' : 'Customer Feedback'}
                    </h3>
                    {!selectedFeedback.is_anonymous && (
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        {selectedFeedback.customer_name} • Table {selectedFeedback.table_number || 'N/A'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedFeedback.feedback}
                  </p>
                </div>

                {!selectedFeedback.is_anonymous && (
                  <div className="flex items-center justify-between text-[7px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
                    <span>{new Date(selectedFeedback.created_at).toLocaleDateString()}</span>
                    <span>{new Date(selectedFeedback.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                <button
                  onClick={() => handleAcknowledge(selectedFeedback.id)}
                  className="w-fit mx-auto px-8 bg-[#0F172A] text-white py-2 rounded-lg font-bold text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Acknowledge & Resolve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MediaManager = () => {
  const { restaurant } = useDashboard();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string, name: string } | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [activeImageOptions, setActiveImageOptions] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    if (restaurant) {
      fetchMedia();
    }
  }, [restaurant]);

  useEffect(() => {
    const handleClickOutside = () => setActiveImageOptions(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchMedia = async () => {
    if (files.length === 0) setLoading(true);
    try {
      const [menuItemsResult, storefrontResult] = await Promise.all([
        supabase.storage
          .from('menu_items')
          .list(restaurant.id, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          }),
        supabase.storage
          .from('menu_items')
          .list(`storefront/${restaurant.id}`, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          })
      ]);

      if (menuItemsResult.error) throw menuItemsResult.error;
      if (storefrontResult.error) throw storefrontResult.error;

      const menuFiles = (menuItemsResult.data || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({ ...f, folderPath: restaurant.id }));
      const storefrontFiles = (storefrontResult.data || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({ ...f, folderPath: `storefront/${restaurant.id}` }));

      // Combine and sort by created_at desc
      const allFiles = [...menuFiles, ...storefrontFiles].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setFiles(allFiles);
    } catch (err: any) {
      console.error('Error fetching media:', err);
      toast.error('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;
    
    const fileToDelete = files.find(f => f.name === imageToDelete);
    if (!fileToDelete) return;

    setDeleting(imageToDelete);
    try {
      const { error } = await supabase.storage
        .from('menu_items')
        .remove([`${fileToDelete.folderPath}/${imageToDelete}`]);

      if (error) throw error;
      
      setFiles(files.filter(f => f.name !== imageToDelete));
      
    } catch (err: any) {
      console.error('Error deleting media:', err);
      toast.error('Failed to delete image');
    } finally {
      setDeleting(null);
      setImageToDelete(null);
    }
  };

  const totalPages = Math.ceil(files.length / itemsPerPage);
  const currentFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Media Library</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Manage your uploaded restaurant images</p>
        </div>
        <div className="text-[10px] sm:text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
          {files.length} Files
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
        {currentFiles.map((file) => {
          const { data } = supabase.storage.from('menu_items').getPublicUrl(`${file.folderPath}/${file.name}`);
          return (
            <div 
              key={`${file.folderPath}-${file.name}`} 
              className="group relative aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageOptions(file.name === activeImageOptions ? null : file.name);
              }}
            >
              <img 
                src={data.publicUrl} 
                alt={file.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              <AnimatePresence>
                {activeImageOptions === file.name && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 backdrop-blur-sm"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage({ url: data.publicUrl, name: file.name });
                        setActiveImageOptions(null);
                      }}
                      className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageToDelete(file.name);
                        setActiveImageOptions(null);
                      }}
                      disabled={deleting === file.name}
                      className="w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
                    >
                      {deleting === file.name ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {files.length === 0 && (
          <div className="col-span-full py-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">No media files found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Full Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-transparent rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setSelectedImage(null)} className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full transition-colors text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center min-h-[50vh] max-h-[80vh]">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.name} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {imageToDelete && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setImageToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Image</h3>
                  <p className="text-[10px] text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-6">Are you sure you want to permanently delete this image from your media library?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setImageToDelete(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting !== null}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting !== null ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

