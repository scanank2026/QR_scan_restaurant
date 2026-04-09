import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Store, Users, CreditCard, Settings, Utensils,
  LogOut, Menu, X, Search, Filter, ChevronLeft, ChevronRight, 
  TrendingUp, Banknote, Activity, AlertCircle, DollarSign,
  CheckCircle, Shield, Globe, Zap, Package,
  ArrowUpRight, ArrowDownRight, MoreVertical,
  Edit3, Trash2, Eye, ExternalLink, RefreshCw, Save,
  Loader2, Image as ImageIcon, ShieldCheck, Ban, Upload,
  FileText, Share2, Instagram, Facebook, MessageCircle, Music2,
  ShoppingBag, CheckCircle2, Clock3, AlertTriangle, ClipboardList, RotateCcw,
  QrCode, BarChart3, Check, Download, PieChart, Calendar, Mail, Phone, MapPin, Plus, Bell, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// --- Components ---

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  isLoading = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
  isLoading?: boolean;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">{message}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Pagination = ({ 
  currentPage, 
  totalCount, 
  itemsPerPage, 
  onPageChange 
}: { 
  currentPage: number; 
  totalCount: number; 
  itemsPerPage: number; 
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100 sm:px-6">
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="text-slate-900">{totalCount}</span> results
          </p>
        </div>
        <div>
          <nav className="inline-flex -space-x-px rounded-xl shadow-sm isolate" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 text-slate-400 bg-white border border-slate-200 rounded-l-xl hover:bg-slate-50 focus:z-20 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={cn(
                    "relative inline-flex items-center px-4 py-2 text-xs font-bold focus:z-20",
                    currentPage === pageNumber
                      ? "z-10 bg-brand-600 text-white border-brand-600"
                      : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 text-slate-400 bg-white border border-slate-200 rounded-r-xl hover:bg-slate-50 focus:z-20 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export const SuperAdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Open sidebar by default on desktop
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: 'overview' },
    { icon: Store, label: 'Restaurants', path: 'restaurants' },
    { icon: ShoppingBag, label: 'Orders', path: 'orders' },
    { icon: Users, label: 'Users', path: 'users' },
    { icon: CreditCard, label: 'Subscriptions', path: 'subscriptions' },
    { icon: BarChart3, label: 'Analytics', path: 'analytics' },
    { icon: Settings, label: 'Settings', path: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[60] bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col shadow-sm lg:translate-x-0",
        isSidebarOpen ? "w-44 translate-x-0" : "w-12 -translate-x-full lg:translate-x-0"
      )}>
        <div className="h-10 flex items-center justify-between px-2.5 border-b border-slate-100">
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <div className={cn("flex items-center gap-2", !isSidebarOpen && "lg:hidden")}>
              <div className="bg-slate-900 p-1 rounded-lg">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black tracking-tight uppercase text-slate-900">Master<span className="text-brand-600">Admin</span></span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
          >
            {isSidebarOpen ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
          </button>
        </div>

        <nav className="flex-1 px-1 py-2.5 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-all group"
            >
              <item.icon className="w-3 h-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
              {(isSidebarOpen || window.innerWidth >= 1024) && (
                <span className={cn(
                  "font-bold text-[9px] uppercase tracking-wider text-slate-500 group-hover:text-slate-900",
                  !isSidebarOpen && "lg:hidden"
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-1 border-t border-slate-100">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-3 h-3 transition-transform" />
            {(isSidebarOpen || window.innerWidth >= 1024) && (
              <span className={cn(
                "font-bold text-[9px] uppercase tracking-wider",
                !isSidebarOpen && "lg:hidden"
              )}>
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-w-0",
        isSidebarOpen ? "lg:ml-44" : "lg:ml-12"
      )}>
        <header className="h-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 lg:hidden"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
            <h1 className="text-[8px] sm:text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] truncate">System Control Center</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-slate-900 leading-none uppercase tracking-tight">{profile?.full_name}</p>
              <p className="text-[7px] font-black text-brand-600 uppercase tracking-[0.15em] mt-0.5">Master Authority</p>
            </div>
            <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-[9px] shadow-sm">
              {profile?.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-5 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export const SuperAdminOverview = () => {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    monthlyRevenue: 0,
    allTiers: [] as any[]
  });
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoading(true);
      try {
        const [restCount, userCount, subCount, cancelledCount, recent, tiersData] = await Promise.all([
          supabase.from('restaurants').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('restaurants').select('*', { count: 'exact', head: true }).neq('subscription_tier', 'free').eq('subscription_status', 'active'),
          supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('subscription_status', 'canceled'),
          supabase.from('restaurants').select('*, profiles(full_name, email)').order('created_at', { ascending: false }).limit(5),
          supabase.from('restaurants').select('subscription_tier, subscription_status')
        ]);
        
        const allTiers = tiersData.data || [];
        const monthlyRevenue = allTiers.reduce((acc, r) => {
          if (r.subscription_status !== 'active') return acc;
          if (r.subscription_tier === 'pro') return acc + 49;
          if (r.subscription_tier === 'enterprise') return acc + 199;
          return acc;
        }, 0);

        setStats({
          totalRestaurants: restCount.count || 0,
          totalUsers: userCount.count || 0,
          activeSubscriptions: subCount.count || 0,
          cancelledSubscriptions: cancelledCount.count || 0,
          monthlyRevenue,
          allTiers // Store all tiers for distribution calculation
        });
        setRecentRegistrations(recent.data || []);
      } catch (err) {
        console.error('Error fetching overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverviewData();
  }, []);

  const cards = [
    { label: 'Total Restaurants', value: stats.totalRestaurants, icon: Store, color: 'bg-blue-500', trend: '+12%' },
    { label: 'Active Subs', value: stats.activeSubscriptions, icon: Zap, color: 'bg-amber-500', trend: '+8%' },
    { label: 'Cancelled Subs', value: stats.cancelledSubscriptions, icon: Ban, color: 'bg-red-500', trend: '-2%' },
    { label: 'Monthly Revenue', value: `Rs. ${stats.monthlyRevenue.toLocaleString()}`, icon: Banknote, color: 'bg-emerald-500', trend: '+15%' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={cn("p-1.5 rounded-lg text-white shadow-sm", card.color)}>
                <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight className="w-2 h-2" />
                {card.trend}
              </span>
            </div>
            <p className="text-slate-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-0.5">{card.label}</p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-200" /> : card.value}
            </h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">Recent Registrations</h3>
              <p className="text-[8px] sm:text-[9px] font-medium text-slate-400 truncate">New businesses on the platform</p>
            </div>
            <Link to="/master-admin/restaurants" className="text-brand-600 font-bold text-[8px] sm:text-[9px] uppercase tracking-wider hover:underline shrink-0">View All</Link>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-10 sm:h-12 bg-slate-50 animate-pulse rounded-lg" />
              ))
            ) : recentRegistrations.length === 0 ? (
              <p className="text-center py-5 text-slate-400 font-bold uppercase text-[8px] tracking-widest">No recent registrations</p>
            ) : recentRegistrations.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-[9px] sm:text-[10px] group-hover:bg-white transition-colors shrink-0">
                    {r.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate">{r.name}</p>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 truncate">{r.profiles?.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[7px] sm:text-[8px] font-bold text-slate-900 uppercase tracking-wider">{r.subscription_tier || 'Free'}</p>
                  <p className="text-[7px] sm:text-[8px] font-medium text-slate-400 uppercase tracking-widest">
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Subscription Distribution</h3>
              <p className="text-[8px] sm:text-[9px] font-medium text-slate-400">Breakdown by plan tier</p>
            </div>
            <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-500" />
          </div>
          <div className="space-y-3 sm:space-y-4">
            {[
              { label: 'Enterprise', tier: 'enterprise', color: 'bg-slate-900' },
              { label: 'Pro', tier: 'pro', color: 'bg-brand-500' },
              { label: 'Starter', tier: 'starter', color: 'bg-blue-500' },
              { label: 'Free', tier: 'free', color: 'bg-slate-200' },
            ].map((item) => {
              const total = stats.allTiers?.length || 0;
              const count = total > 0 ? Math.round((stats.allTiers.filter((r: any) => r.subscription_tier === item.tier).length / total) * 100) : 0;
              return (
                <div key={item.tier} className="space-y-1">
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-bold">
                    <span className="text-slate-600 uppercase tracking-wider">{item.label}</span>
                    <span className="text-slate-900">{count}%</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-500", item.color)} style={{ width: `${count}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-2 sm:p-2.5 bg-brand-50 border border-brand-100 rounded-xl flex items-center gap-2">
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-600" />
            <p className="text-[7px] sm:text-[8px] font-bold text-brand-700 uppercase tracking-widest">Revenue growth up 12% this month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SuperAdminRestaurants = () => {
  const { profile, impersonate, isImpersonating } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'contact' | 'admin'>('general');
  const [isUploading, setIsUploading] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'warning' | 'error' });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchRestaurants = async (page = currentPage) => {
    setLoading(true);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Fetch restaurants and profiles separately if needed to ensure we see the restaurant even if profile is missing
      const { data: restData, error: restError, count } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (restError) throw restError;
      if (count !== null) setTotalCount(count);

      // Fetch profiles for these restaurants
      const ownerIds = restData.map(r => r.owner_id).filter(Boolean);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', ownerIds);

      const combinedData = restData.map(r => ({
        ...r,
        profiles: profileData?.find(p => p.id === r.owner_id) || null
      }));

      setRestaurants(combinedData);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(currentPage);
  }, [currentPage]);

  const handleUpdateStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Restaurant ${isActive ? 'activated' : 'suspended'}`);
      
      // Optimistically update local state to reflect change immediately
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_active: isActive } : r));
      if (selectedRestaurant?.id === id) {
        setSelectedRestaurant({ ...selectedRestaurant, is_active: isActive });
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateTier = async (id: string, tier: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ subscription_tier: tier })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Subscription updated to ${tier.toUpperCase()}`);
      
      // Optimistic update
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, subscription_tier: tier } : r));
      if (selectedRestaurant?.id === id) {
        setSelectedRestaurant({ ...selectedRestaurant, subscription_tier: tier });
      }
      
      fetchRestaurants();
    } catch (err) {
      toast.error('Failed to update subscription');
    }
  };

  const handleUpdateRestaurant = async (id: string, updates: any) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Restaurant updated successfully');
      
      // Update local state to keep UI in sync
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      if (selectedRestaurant?.id === id) {
        setSelectedRestaurant({ ...selectedRestaurant, ...updates });
      }
      
      fetchRestaurants();
    } catch (err) {
      console.error('Error updating restaurant:', err);
      toast.error('Failed to update restaurant');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This action is irreversible and will delete all associated data.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Restaurant deleted successfully');
      fetchRestaurants();
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      toast.error('Failed to delete restaurant');
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const ownerEmail = formData.get('ownerEmail') as string;

    try {
      // 1. Find owner profile by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ownerEmail)
        .single();
      
      if (profileError || !profileData) {
        toast.error('Owner email not found. Please ensure the user has an account.');
        return;
      }

      // 2. Create restaurant
      const { data: newRest, error: createError } = await supabase
        .from('restaurants')
        .insert({
          name,
          slug: slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
          owner_id: profileData.id,
          is_active: true,
          subscription_tier: 'free'
        })
        .select()
        .single();
      
      if (createError) throw createError;

      toast.success('Restaurant created successfully');
      setIsCreateModalOpen(false);
      fetchRestaurants();
    } catch (err: any) {
      console.error('Error creating restaurant:', err);
      toast.error(err.message || 'Failed to create restaurant');
    }
  };

  const handleResetRestaurant = async (id: string) => {
    if (!window.confirm('Are you sure you want to reset this restaurant? This will delete all menu items, orders, tables, and waiter calls. This action is irreversible.')) {
      return;
    }

    try {
      // Delete all associated data
      await Promise.all([
        supabase.from('menu_items').delete().eq('restaurant_id', id),
        supabase.from('orders').delete().eq('restaurant_id', id),
        supabase.from('tables').delete().eq('restaurant_id', id),
        supabase.from('waiter_calls').delete().eq('restaurant_id', id)
      ]);
      
      toast.success('Restaurant account reset successfully');
      fetchRestaurants();
    } catch (err) {
      console.error('Error resetting restaurant:', err);
      toast.error('Failed to reset restaurant');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    
    setIsSendingNotification(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          restaurant_id: selectedRestaurant.id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type
        }]);
      
      if (error) throw error;
      toast.success('Notification sent successfully');
      setIsNotifyModalOpen(false);
      setNotificationData({ title: '', message: '', type: 'info' });
    } catch (err) {
      console.error('Error sending notification:', err);
      toast.error('Failed to send notification');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleImpersonate = async (restaurantId: string) => {
    try {
      await impersonate(restaurantId);
      toast.success('Impersonating restaurant admin');
      navigate('/restaurant/dashboard');
    } catch (err) {
      toast.error('Failed to impersonate');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file || !selectedRestaurant) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `superadmin/${selectedRestaurant.id}/${type}_${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu_items')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu_items')
        .getPublicUrl(filePath);

      const field = type === 'logo' ? 'logo_url' : 'hero_image_url';
      await handleUpdateRestaurant(selectedRestaurant.id, { [field]: publicUrl });
      setSelectedRestaurant({ ...selectedRestaurant, [field]: publicUrl });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded`);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = restaurants.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.toLowerCase().includes(search.toLowerCase()) ||
    r.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedRestaurants = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">Restaurants</h2>
          <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">Manage all business entities</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Restaurant
          </button>
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 transition-all w-full sm:w-60"
            />
          </div>
          <button onClick={fetchRestaurants} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0">
            <RefreshCw className={cn("w-4 h-4 text-slate-400", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Business</th>
                <th className="hidden md:table-cell px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Owner</th>
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="hidden lg:table-cell px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Created</th>
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-brand-500 animate-spin mx-auto mb-2" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fetching data...</p>
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No matching restaurants found</p>
                  </td>
                </tr>
              ) : restaurants.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-3 sm:px-4 py-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-[9px] sm:text-[10px] group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors shrink-0">
                        {r.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate">{r.name}</p>
                        <div className="flex items-center gap-1">
                          <Globe className="w-2 h-2 text-slate-300" />
                          <p className="text-[7px] sm:text-[8px] text-slate-400 font-mono tracking-tight truncate">/{r.slug}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-2">
                    <p className="text-[10px] font-bold text-slate-900">{r.profiles?.full_name}</p>
                    <p className="text-[8px] text-slate-400">{r.profiles?.email}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-2">
                    <button 
                      onClick={() => { setSelectedRestaurant(r); setIsEditModalOpen(true); }}
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-[7px] font-bold uppercase tracking-widest border transition-all hover:scale-105",
                        r.subscription_tier === 'enterprise' ? "bg-slate-900 text-white border-slate-900" :
                        r.subscription_tier === 'pro' ? "bg-brand-50 text-brand-600 border-brand-100" : 
                        "bg-slate-50 text-slate-500 border-slate-100"
                      )}
                    >
                      {r.subscription_tier || 'Free'}
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 py-2">
                    <div className="flex flex-col gap-1">
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-widest w-fit",
                        r.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      )}>
                        {r.is_active ? 'Active' : 'Suspended'}
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-[6px] sm:text-[7px] font-bold uppercase tracking-widest",
                        r.storefront_config?.is_open !== false ? "text-emerald-500" : "text-slate-400"
                      )}>
                        <div className={cn("w-0.5 h-0.5 rounded-full", r.storefront_config?.is_open !== false ? "bg-emerald-500" : "bg-slate-400")} />
                        {r.storefront_config?.is_open !== false ? 'Ordering On' : 'Ordering Off'}
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-2 text-[9px] text-slate-500 font-medium">
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-3 sm:px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      <a 
                        href={`/order/${r.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 sm:p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-brand-600"
                      >
                        <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </a>
                      <button 
                        onClick={() => handleImpersonate(r.id)}
                        title="Login as Admin"
                        className="p-1 sm:p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-brand-600"
                      >
                        <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <button 
                        onClick={() => { 
                          setSelectedRestaurant(r); 
                          setEditData({
                            name: r.name,
                            slug: r.slug,
                            description: r.description,
                            phone: r.phone,
                            address: r.address,
                            logo_url: r.logo_url,
                            hero_image_url: r.hero_image_url,
                            storefront_config: r.storefront_config || {}
                          });
                          setIsEditModalOpen(true); 
                        }}
                        className="p-1 sm:p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-brand-600"
                      >
                        <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRestaurant(r.id)}
                        className="p-1 sm:p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Powerful Centralized Management Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedRestaurant && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 m-2 sm:m-4 my-auto"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white sticky top-0 z-10 gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm shrink-0">
                    {selectedRestaurant.logo_url ? (
                      <img src={selectedRestaurant.logo_url} className="w-full h-full object-cover rounded-lg" alt="" />
                    ) : (
                      selectedRestaurant.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">{selectedRestaurant.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[7px] sm:text-[8px] font-bold uppercase tracking-widest shrink-0",
                        selectedRestaurant.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      )}>
                        {selectedRestaurant.is_active ? 'Active' : 'Suspended'}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 truncate">/{selectedRestaurant.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                  <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar max-w-[calc(100vw-80px)] sm:max-w-none">
                    {[
                      { id: 'general', label: 'General', icon: Store },
                      { id: 'branding', label: 'Branding', icon: ImageIcon },
                      { id: 'contact', label: 'Contact', icon: Globe },
                      { id: 'admin', label: 'Admin', icon: ShieldCheck },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                          activeTab === tab.id ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <tab.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className={cn(activeTab === tab.id ? "inline" : "hidden sm:inline")}>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                {activeTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Store className="w-3.5 h-3.5" />
                          Business Identity
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-1">Restaurant Name</label>
                            <input 
                              type="text" 
                              value={editData?.name || ''}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-normal text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-1">Unique Slug</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-normal">/</span>
                              <input 
                                type="text" 
                                value={editData?.slug || ''}
                                onChange={(e) => setEditData({ ...editData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-normal text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" />
                          About Business
                        </h4>
                        <div className="space-y-1">
                          <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-1">Description</label>
                          <textarea 
                            value={editData?.description || ''}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-normal text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all min-h-[120px] resize-none"
                            placeholder="Tell customers about your restaurant..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'branding' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5" />
                          Brand Logo
                        </h4>
                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-white border-2 border-dashed border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                            {editData?.logo_url ? (
                              <img src={editData.logo_url} className="w-full h-full object-contain p-2" alt="" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-slate-200" />
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 text-brand-500 animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">
                              <Upload className="w-3.5 h-3.5" />
                              Upload Logo
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                            </label>
                            <p className="text-[9px] text-slate-400 font-medium leading-relaxed">Square PNG or SVG recommended.<br />Max size: 2MB.</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5" />
                          Hero Banner
                        </h4>
                        <div className="space-y-4">
                          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center group shadow-sm">
                            {editData?.hero_image_url ? (
                              <img src={editData.hero_image_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-300">
                                <Upload className="w-6 h-6" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">No Banner</span>
                              </div>
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
                              </div>
                            )}
                          </div>
                          <label className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
                            <Upload className="w-3.5 h-3.5 text-slate-400" />
                            Change Hero Image
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} />
                          </label>
                        </div>

                        <div className="pt-4 space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5" />
                            Display Options
                          </h4>
                          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            {[
                              { label: 'Show Ratings', key: 'showRating' },
                              { label: 'Show Prep Time', key: 'showPrepTime' },
                              { label: 'Enable Search', key: 'showSearch' },
                            ].map((option) => (
                              <label key={option.key} className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-wider">{option.label}</span>
                                <div 
                                  onClick={() => {
                                    const newConfig = { 
                                      ...(editData?.storefront_config || {}), 
                                      [option.key]: editData?.storefront_config?.[option.key] === false ? true : false 
                                    };
                                    setEditData({ ...editData, storefront_config: newConfig });
                                  }}
                                  className={cn(
                                    "relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    editData?.storefront_config?.[option.key] !== false ? "bg-brand-500" : "bg-slate-200"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                      editData?.storefront_config?.[option.key] !== false ? "translate-x-4" : "translate-x-0"
                                    )}
                                  />
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" />
                          Contact Information
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                            <input 
                              type="text" 
                              value={editData?.phone || ''}
                              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-normal text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-1">Physical Address</label>
                            <textarea 
                              value={editData?.address || ''}
                              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-normal text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all min-h-[100px] resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Share2 className="w-3.5 h-3.5" />
                          Social Presence
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          {[
                            { label: 'Instagram', key: 'instagram', icon: Instagram },
                            { label: 'Facebook', key: 'facebook', icon: Facebook },
                            { label: 'WhatsApp', key: 'whatsapp', icon: MessageCircle },
                            { label: 'TikTok', key: 'tiktok', icon: Music2 },
                          ].map((social) => (
                            <div key={social.key} className="space-y-1">
                              <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-1">{social.label}</label>
                              <div className="relative">
                                <social.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input 
                                  type="text" 
                                  value={editData?.storefront_config?.social?.[social.key] || ''}
                                  onChange={(e) => {
                                    const newSocial = { ...(editData?.storefront_config?.social || {}), [social.key]: e.target.value };
                                    const newConfig = { ...(editData?.storefront_config || {}), social: newSocial };
                                    setEditData({ ...editData, storefront_config: newConfig });
                                  }}
                                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-normal text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                  placeholder={`${social.label} link or number`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'admin' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5" />
                          Subscription Management
                        </h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            {['free', 'pro', 'enterprise'].map((tier) => (
                              <button
                                key={tier}
                                onClick={() => handleUpdateTier(selectedRestaurant.id, tier)}
                                className={cn(
                                  "py-3 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
                                  selectedRestaurant.subscription_tier === tier 
                                    ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                                    : "bg-white border-slate-100 text-slate-400 hover:border-brand-200 hover:text-brand-500"
                                )}
                              >
                                {tier}
                              </button>
                            ))}
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900">Billing Cycle</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900">Next Renewal</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apr 15, 2026</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5" />
                          Communications
                        </h4>
                        <button 
                          onClick={() => setIsNotifyModalOpen(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-50 text-brand-600 border border-brand-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-100 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Send System Notification
                        </button>

                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Ban className="w-3.5 h-3.5" />
                          Account Suspension
                        </h4>
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-red-900">Business Access</p>
                              <p className="text-[10px] text-red-600 font-medium">Toggle global availability</p>
                            </div>
                            <div 
                              onClick={() => handleUpdateStatus(selectedRestaurant.id, !selectedRestaurant.is_active)}
                              className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                selectedRestaurant.is_active ? "bg-emerald-500" : "bg-red-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                  selectedRestaurant.is_active ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-red-600/80 leading-relaxed font-medium">
                            Suspending a restaurant will immediately block all access for the owner and staff. Public menu pages will display a suspension notice.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" />
                            Critical Controls
                          </h4>
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-900 truncate">Ordering Status</p>
                              <p className="text-[8px] text-slate-400 font-medium uppercase tracking-tighter truncate">Enable/Disable customer orders</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newConfig = { 
                                  ...(editData?.storefront_config || {}), 
                                  is_open: editData?.storefront_config?.is_open === false ? true : false 
                                };
                                setEditData({ ...editData, storefront_config: newConfig });
                              }}
                              className={cn(
                                "w-10 h-5 rounded-full transition-all relative shrink-0",
                                editData?.storefront_config?.is_open !== false ? "bg-emerald-500" : "bg-slate-200"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                                editData?.storefront_config?.is_open !== false ? "left-5.5" : "left-0.5"
                              )} />
                            </button>
                          </div>

                          <button 
                            onClick={() => handleResetRestaurant(selectedRestaurant.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset Restaurant Account
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-1">Owner Account</label>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-900">{selectedRestaurant.profiles?.full_name || 'No Owner'}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{selectedRestaurant.profiles?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 sm:px-8 py-3 sm:py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                    ID: <span className="text-slate-900 font-mono">{selectedRestaurant.id}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleUpdateRestaurant(selectedRestaurant.id, editData)}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-8 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Notification Modal */}
      <AnimatePresence>
        {isNotifyModalOpen && selectedRestaurant && (
          <div className="fixed inset-0 z-[110] grid place-items-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifyModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-200">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Send Notification</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">To: {selectedRestaurant.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsNotifyModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendNotification} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input 
                    type="text" 
                    required
                    value={notificationData.title}
                    onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all"
                    placeholder="e.g. Action Required"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    required
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all min-h-[100px] resize-none"
                    placeholder="Type your message here..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['info', 'success', 'warning', 'error'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNotificationData({ ...notificationData, type })}
                        className={cn(
                          "py-2 rounded-lg border text-[8px] font-bold uppercase tracking-widest transition-all",
                          notificationData.type === type 
                            ? "bg-slate-900 border-slate-900 text-white" 
                            : "bg-white border-slate-100 text-slate-400 hover:border-brand-200"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsNotifyModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSendingNotification}
                    className="flex-[2] px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                  >
                    {isSendingNotification ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                    Send Notification
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Restaurant Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Register New Business</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Onboarding</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRestaurant} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                    <input 
                      name="name"
                      type="text" 
                      required
                      onChange={(e) => {
                        const slugInput = (e.currentTarget.form?.elements.namedItem('slug') as HTMLInputElement);
                        if (slugInput) {
                          slugInput.value = e.target.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                        }
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all"
                      placeholder="e.g. Gourmet Kitchen"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">URL Slug</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        name="slug"
                        type="text" 
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all font-mono"
                        placeholder="gourmet-kitchen"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium ml-1">This will be the public URL: /order/slug</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Owner Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        name="ownerEmail"
                        type="email" 
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all"
                        placeholder="owner@example.com"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium ml-1">The user must already have an account on the platform.</p>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                  >
                    Create Restaurant
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SuperAdminUsers = () => {
  const navigate = useNavigate();
  const { profile, impersonate } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async (page = currentPage) => {
    setLoading(true);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // First fetch profiles
      const { data: profilesData, error: profilesError, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (profilesError) throw profilesError;
      if (count !== null) setTotalCount(count);

      // Then fetch all restaurants to map them
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name');
      
      if (restaurantsError) throw restaurantsError;

      const restaurantMap = (restaurantsData || []).reduce((acc: any, curr: any) => {
        acc[curr.id] = curr.name;
        return acc;
      }, {});

      const usersWithRestaurants = (profilesData || []).map(u => ({
        ...u,
        restaurants: u.restaurant_id ? { name: restaurantMap[u.restaurant_id] } : null
      }));

      setUsers(usersWithRestaurants);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleUpdateStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`User ${isActive ? 'activated' : 'suspended'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete);
      
      if (error) throw error;
      toast.success('User deleted successfully');
      fetchUsers();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImpersonateUser = async (user: any) => {
    try {
      // Find the restaurant owned by this user
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (error || !restaurant) {
        toast.error('No restaurant found for this user');
        return;
      }

      await impersonate(restaurant.id);
      toast.success(`Impersonating ${user.full_name}`);
      navigate('/restaurant/dashboard');
    } catch (err) {
      toast.error('Failed to impersonate');
    }
  };

  const filtered = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">System Users</h2>
          <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">Manage global accounts</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium focus:ring-2 focus:ring-brand-500 transition-all w-full sm:w-52"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">User Profile</th>
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Account Type</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Restaurant</th>
                <th className="hidden sm:table-cell px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-8 bg-slate-100 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No users found</p>
                  </td>
                </tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-3 sm:px-4 py-2">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] shrink-0">
                        {u.full_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate">{u.full_name}</p>
                        <p className="text-[8px] sm:text-[9px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border",
                      u.role === 'super_admin' ? "bg-brand-50 text-brand-600 border-brand-100" : "bg-slate-50 text-slate-600 border-slate-100"
                    )}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3 h-3 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">
                        {u.restaurants?.name || 'No Restaurant'}
                      </span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-2 text-[9px] text-slate-500 font-bold whitespace-nowrap uppercase tracking-tighter">
                    {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-3 sm:px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.role === 'restaurant_owner' && (
                        <button 
                          onClick={() => handleImpersonateUser(u)}
                          title="Login as Admin"
                          className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-brand-600"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (u.id === profile?.id) {
                            toast.error('You cannot delete your own account');
                            return;
                          }
                          setUserToDelete(u.id);
                          setIsDeleteModalOpen(true);
                        }}
                        disabled={u.id === profile?.id}
                        className={cn(
                          "p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400",
                          u.id === profile?.id ? "opacity-30 cursor-not-allowed" : "hover:text-red-600"
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
        title="Delete User"
        message="Are you sure you want to delete this user? If this user is a restaurant owner, their restaurant and all associated data will also be deleted. This action cannot be undone."
      />
    </div>
  );
};

export const SuperAdminSubscriptions = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubs: 0,
    churnRate: '0%',
    avgRevenue: 'Rs. 0'
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'subscription_plans')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPlans(data.value);
      } else {
        // Default plans if none exist in DB
        const defaultPlans = [
          { id: 'free', name: 'Free', price: 0, users: 0, color: 'bg-slate-100', text: 'text-slate-600', icon: 'Package', features: ['Basic QR Menu', 'Limited Orders', 'Standard Support'] },
          { id: 'pro', name: 'Pro', price: 49, users: 0, color: 'bg-brand-500', text: 'text-white', icon: 'Zap', features: ['Unlimited Orders', 'Priority Support', 'Advanced Analytics', 'Custom Branding'] },
          { id: 'enterprise', name: 'Enterprise', price: 199, users: 0, color: 'bg-slate-900', text: 'text-white', icon: 'ShieldCheck', features: ['Multi-location Support', 'Dedicated Account Manager', 'API Access', 'Custom Integrations'] },
        ];
        setPlans(defaultPlans);
        
        // Save defaults
        await supabase.from('system_settings').upsert({
          key: 'subscription_plans',
          value: defaultPlans,
          description: 'Configuration for subscription plans'
        }, { onConflict: 'key' });
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('subscription_tier');

      if (error) throw error;

      const tierCounts = (restaurants || []).reduce((acc: any, curr) => {
        const tier = curr.subscription_tier || 'free';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});

      // Update plan user counts
      setPlans(prev => prev.map(p => ({
        ...p,
        users: tierCounts[p.id] || 0
      })));

      const activeSubs = (restaurants || []).filter(r => r.subscription_tier !== 'free').length;
      const totalRevenue = (restaurants || []).reduce((acc, r) => {
        const plan = plans.find(p => p.id === r.subscription_tier);
        return acc + (plan?.price || 0);
      }, 0);

      setStats({
        totalRevenue,
        activeSubs,
        churnRate: '1.2%', // Mocked for now
        avgRevenue: activeSubs > 0 ? `Rs. ${Math.round(totalRevenue / activeSubs)}` : 'Rs. 0'
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPayments = async (page = currentPage) => {
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await supabase
        .from('payments')
        .select(`
          *,
          restaurants(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setPayments(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchPlans();
      await fetchStats();
      await fetchPayments(currentPage);
      setLoading(false);
    };
    init();
  }, [currentPage]);

  const handleSavePlan = async (planData: any) => {
    setIsSaving(true);
    try {
      let newPlans;
      if (editingPlan) {
        newPlans = plans.map(p => p.id === editingPlan.id ? { ...p, ...planData } : p);
      } else {
        const newPlan = {
          ...planData,
          id: planData.name.toLowerCase().replace(/\s+/g, '-'),
          users: 0,
          features: []
        };
        newPlans = [...plans, newPlan];
      }

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'subscription_plans',
          value: newPlans,
          description: 'Configuration for subscription plans'
        }, { onConflict: 'key' });

      if (error) throw error;
      
      setPlans(newPlans);
      toast.success(editingPlan ? 'Plan updated' : 'Plan added');
      setIsPlanModalOpen(false);
      setEditingPlan(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const newPlans = plans.filter(p => p.id !== planId);
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'subscription_plans',
          value: newPlans,
          description: 'Configuration for subscription plans'
        }, { onConflict: 'key' });

      if (error) throw error;
      setPlans(newPlans);
      toast.success('Plan deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveFeatures = async (planId: string, features: string[]) => {
    setIsSaving(true);
    try {
      const newPlans = plans.map(p => p.id === planId ? { ...p, features } : p);
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'subscription_plans',
          value: newPlans,
          description: 'Configuration for subscription plans'
        }, { onConflict: 'key' });

      if (error) throw error;
      setPlans(newPlans);
      toast.success('Features updated');
      setIsFeatureModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return Zap;
      case 'ShieldCheck': return ShieldCheck;
      case 'Package': return Package;
      default: return Package;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] grid place-items-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-tight">
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSavePlan({
                name: formData.get('name'),
                price: Number(formData.get('price')),
                color: formData.get('color'),
                text: formData.get('text'),
                icon: formData.get('icon')
              });
            }} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan Name</label>
                <input 
                  name="name"
                  defaultValue={editingPlan?.name}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  placeholder="e.g. Pro, Enterprise"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price (Rs. / mo)</label>
                <input 
                  name="price"
                  type="number"
                  defaultValue={editingPlan?.price}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Color Class</label>
                  <select 
                    name="color"
                    defaultValue={editingPlan?.color || 'bg-brand-500'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  >
                    <option value="bg-brand-500">Brand Blue</option>
                    <option value="bg-slate-900">Dark Slate</option>
                    <option value="bg-emerald-500">Emerald Green</option>
                    <option value="bg-amber-500">Amber Yellow</option>
                    <option value="bg-slate-100">Light Gray</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Icon</label>
                  <select 
                    name="icon"
                    defaultValue={editingPlan?.icon || 'Package'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  >
                    <option value="Package">Package</option>
                    <option value="Zap">Zap</option>
                    <option value="ShieldCheck">Shield</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full bg-brand-600 text-white px-10 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:opacity-50 active:scale-95"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Plan
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Feature Modal */}
      {isFeatureModalOpen && editingPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] grid place-items-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-tight">
                Configure {editingPlan.name} Features
              </h3>
              <button onClick={() => setIsFeatureModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(editingPlan.features || []).map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input 
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...editingPlan.features];
                        newFeatures[idx] = e.target.value;
                        setEditingPlan({ ...editingPlan, features: newFeatures });
                      }}
                    />
                    <button 
                      onClick={() => {
                        const newFeatures = editingPlan.features.filter((_: any, i: number) => i !== idx);
                        setEditingPlan({ ...editingPlan, features: newFeatures });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    setEditingPlan({ ...editingPlan, features: [...(editingPlan.features || []), 'New Feature'] });
                  }}
                  className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:border-brand-500 hover:text-brand-500 transition-all"
                >
                  <Plus className="w-3 h-3 mx-auto mb-1" />
                  Add Feature
                </button>
              </div>
              <button 
                onClick={() => handleSaveFeatures(editingPlan.id, editingPlan.features)}
                disabled={isSaving}
                className="w-full bg-brand-600 text-white px-10 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:opacity-50 active:scale-95"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Features
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Active Subs', value: stats.activeSubs, icon: Zap, color: 'text-brand-600 bg-brand-50' },
          { label: 'Churn Rate', value: stats.churnRate, icon: Activity, color: 'text-red-600 bg-red-50' },
          { label: 'Avg Revenue', value: stats.avgRevenue, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Subscription Plans</h3>
            <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider">Manage pricing tiers</p>
          </div>
          <button 
            onClick={() => {
              setEditingPlan(null);
              setIsPlanModalOpen(true);
            }}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Add Plan
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan, idx) => {
            const Icon = getIcon(plan.icon);
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition-all overflow-hidden">
                <div className="p-5 border-b border-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", plan.color)}>
                      <Icon className={cn("w-5 h-5", plan.text || 'text-white')} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsPlanModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{plan.name} Plan</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-900">Rs. {plan.price}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/mo</span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 bg-slate-50/50">
                  <div className="flex justify-between items-center text-[9px] font-bold mb-3">
                    <span className="text-slate-400 uppercase tracking-wider">Active Businesses</span>
                    <span className="text-slate-900">{plan.users}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
                    <div className={cn("h-full transition-all duration-1000", plan.color)} style={{ width: `${Math.min((plan.users / 100) * 100, 100)}%` }} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Features</span>
                      <button 
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsFeatureModalOpen(true);
                        }}
                        className="text-[9px] font-bold text-brand-600 uppercase tracking-widest hover:underline"
                      >
                        Configure
                      </button>
                    </div>
                    {(plan.features || []).slice(0, 4).map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                        <div className="w-1 h-1 rounded-full bg-brand-500" />
                        {f}
                      </div>
                    ))}
                    {plan.features?.length > 4 && (
                      <p className="text-[9px] font-bold text-slate-400 italic mt-1">+{plan.features.length - 4} more features</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Payment History</h3>
            <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider">Recent transactions</p>
          </div>
          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Transaction</th>
                  <th className="px-4 py-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Restaurant</th>
                  <th className="px-4 py-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="px-4 py-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-4 py-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <Loader2 className="w-5 h-5 text-brand-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No transactions found</p>
                    </td>
                  </tr>
                ) : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-900">#TXN-{p.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[8px] text-slate-400 font-medium">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-bold text-slate-900 truncate">{p.restaurants?.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{p.plan_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-black text-slate-900">{p.currency} {p.amount}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter",
                        p.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                        p.status === 'pending' ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-brand-600">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export const SuperAdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    completionRate: 0
  });
  const itemsPerPage = 10;

  const fetchOrders = async (page = currentPage) => {
    setLoading(true);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('orders')
        .select(`
          *,
          restaurants(name, slug),
          tables(table_number),
          order_items(
            *,
            menu_items(name, price)
          )
        `, { count: 'exact' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrders(data || []);
      if (count !== null) setTotalCount(count);

      // Fetch stats for the current view (or overall)
      const { data: allStatsData } = await supabase
        .from('orders')
        .select('total_amount, status');
      
      if (allStatsData) {
        const totalSales = allStatsData.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
        const totalOrders = allStatsData.length;
        const completedOrders = allStatsData.filter(o => o.status === 'completed').length;
        
        setStats({
          totalSales,
          totalOrders,
          avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
          completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
        });
      }

    } catch (error: any) {
      toast.error('Failed to fetch orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const subscription = supabase
      .channel('super-admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders(currentPage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentPage, statusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      setIsDetailModalOpen(false);
    } catch (error: any) {
      toast.error('Failed to update status');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tables?.table_number?.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cooking': return 'bg-brand-50 text-brand-600 border-brand-100';
      case 'ready': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'completed': return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'revoked': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock3 className="w-3 h-3" />;
      case 'cooking': return <Utensils className="w-3 h-3" />;
      case 'ready': return <Package className="w-3 h-3" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      case 'cancelled': return <X className="w-3 h-3" />;
      case 'revoked': return <RotateCcw className="w-3 h-3" />;
      default: return <AlertTriangle className="w-3 h-3" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-24 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">Order Monitor</h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium mt-1 truncate">Real-time tracking of all restaurant orders.</p>
        </div>
        <button 
          onClick={() => fetchOrders(currentPage)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCw className={cn("w-3 h-3 sm:w-4 sm:h-4", loading && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</span>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight">Rs. {stats.totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Orders</span>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight">{stats.totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Order</span>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight">Rs. {Math.round(stats.avgOrderValue).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion</span>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight">{stats.completionRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search Order ID, Restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[11px] sm:text-xs font-medium focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[11px] sm:text-xs font-medium focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="cooking">Cooking</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Rejected</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl lg:w-48">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Results</span>
          <span className="text-xs font-black text-slate-900">{filteredOrders.length}</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Order Info</th>
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Restaurant</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Table</th>
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="hidden lg:table-cell px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                <th className="hidden xl:table-cell px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Created</th>
                <th className="px-3 sm:px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-10 bg-slate-100 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40 grayscale">
                      <ShoppingBag className="w-12 h-12 text-slate-200 mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No orders found matching your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-3 sm:px-4 py-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-900 tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[9px] text-slate-400 font-normal mt-0.5">{order.order_items?.length || 0} items</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">
                          {order.restaurants?.name?.charAt(0)}
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-700 truncate max-w-[120px]">{order.restaurants?.name}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-2">
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-600">Table {order.tables?.table_number || 'N/A'}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-2">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase tracking-wider",
                        getStatusColor(order.status)
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status === 'cancelled' ? 'REJECTED' : order.status}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-4 py-2">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-900">Rs. {Number(order.total_amount || 0).toLocaleString()}</span>
                    </td>
                    <td className="hidden xl:table-cell px-3 sm:px-4 py-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-600">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="text-[9px] text-slate-400 font-normal">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 text-right">
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setPendingStatus(order.status);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-2 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 my-auto"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{selectedOrder.restaurants?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                {/* Status Management */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Update Order Status</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['pending', 'cooking', 'ready', 'completed', 'cancelled', 'revoked'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setPendingStatus(status)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border",
                          pendingStatus === status
                            ? getStatusColor(status) + " border-current ring-1 ring-current ring-offset-1"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {status === 'cancelled' ? 'REJECTED' : status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Table</span>
                    <p className="text-xs font-bold text-slate-900">{selectedOrder.tables?.table_number || 'N/A'}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Payment</span>
                    <p className="text-xs font-bold text-slate-900 capitalize">{selectedOrder.payment_status || 'Pending'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Total Amount</span>
                    <p className="text-xs font-black text-brand-600">Rs. {selectedOrder.total_amount?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Date</span>
                    <p className="text-[10px] font-bold text-slate-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2.5">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Order Items ({selectedOrder.order_items?.length || 0})</h4>
                  <div className="space-y-1.5">
                    {selectedOrder.order_items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-900">{item.menu_items?.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium">Rs. {Number(item.unit_price || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-slate-900">Rs. {(item.quantity * Number(item.unit_price || 0)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Notes */}
                {selectedOrder.customer_notes && (
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer Notes</h4>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-[10px] text-amber-900 leading-relaxed italic">"{selectedOrder.customer_notes}"</p>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedOrder.status === 'cancelled' && selectedOrder.rejection_reason && (
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rejection Reason</h4>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-[10px] text-red-900 leading-relaxed italic">"{selectedOrder.rejection_reason}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, pendingStatus)}
                  disabled={isUpdating || pendingStatus === selectedOrder.status}
                  className="bg-brand-600 text-white px-10 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:opacity-50 active:scale-95"
                >
                  {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SuperAdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [metrics, setMetrics] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalOrdersInRange: 0,
    totalRevenueInRange: 0,
    totalUsers: 0,
    subscriptionDistribution: {
      free: 0,
      pro: 0,
      enterprise: 0
    },
    topRestaurants: [] as any[],
    lowRestaurants: [] as any[]
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);

      // Fetch restaurants
      const { data: restaurants } = await supabase.from('restaurants').select('id, name, is_active, subscription_tier');
      const totalRestaurants = restaurants?.length || 0;
      const activeRestaurants = restaurants?.filter(r => r.is_active).length || 0;

      // Fetch orders in range
      const { data: ordersInRange } = await supabase
        .from('orders')
        .select('total_amount, restaurant_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const totalOrdersInRange = ordersInRange?.length || 0;
      const totalRevenueInRange = ordersInRange?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

      // Fetch users
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      // Subscription distribution
      const distribution = {
        free: restaurants?.filter(r => r.subscription_tier === 'free').length || 0,
        pro: restaurants?.filter(r => r.subscription_tier === 'pro').length || 0,
        enterprise: restaurants?.filter(r => r.subscription_tier === 'enterprise').length || 0
      };

      // Calculate performance per restaurant
      const performanceMap = (ordersInRange || []).reduce((acc: any, curr: any) => {
        if (!acc[curr.restaurant_id]) {
          acc[curr.restaurant_id] = { count: 0, revenue: 0 };
        }
        acc[curr.restaurant_id].count += 1;
        acc[curr.restaurant_id].revenue += Number(curr.total_amount);
        return acc;
      }, {});

      const restaurantPerformance = (restaurants || []).map(r => ({
        id: r.id,
        name: r.name,
        count: performanceMap[r.id]?.count || 0,
        revenue: performanceMap[r.id]?.revenue || 0
      }));

      const topRestaurants = [...restaurantPerformance]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const lowRestaurants = [...restaurantPerformance]
        .sort((a, b) => a.revenue - b.revenue)
        .slice(0, 5);

      setMetrics({
        totalRestaurants,
        activeRestaurants,
        totalOrdersInRange,
        totalRevenueInRange,
        totalUsers: totalUsers || 0,
        subscriptionDistribution: distribution,
        topRestaurants,
        lowRestaurants
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading && metrics.totalRestaurants === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">Platform Analytics</h2>
          <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">Global growth and performance</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-[10px] font-bold text-slate-600 bg-transparent border-none p-0 focus:ring-0"
            />
            <span className="text-slate-300">/</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-[10px] font-bold text-slate-600 bg-transparent border-none p-0 focus:ring-0"
            />
          </div>
          <button 
            onClick={fetchAnalytics}
            className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Restaurants', value: metrics.totalRestaurants, icon: Store, color: 'text-brand-600 bg-brand-50' },
          { label: 'Orders in Range', value: metrics.totalOrdersInRange, icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Revenue in Range', value: `Rs. ${metrics.totalRevenueInRange.toLocaleString()}`, icon: Banknote, color: 'text-amber-600 bg-amber-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Subscription Tiers</h3>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Distribution across plans</p>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Enterprise', count: metrics.subscriptionDistribution.enterprise, color: 'bg-slate-900' },
              { label: 'Pro', count: metrics.subscriptionDistribution.pro, color: 'bg-brand-500' },
              { label: 'Free', count: metrics.subscriptionDistribution.free, color: 'bg-slate-200' },
            ].map((item) => {
              const total = metrics.totalRestaurants || 1;
              const percentage = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-slate-600 uppercase tracking-wider">{item.label} ({item.count})</span>
                    <span className="text-slate-900">{percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-500", item.color)} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Top Performing</h3>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">By revenue in selected range</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-3">
              {metrics.topRestaurants.length === 0 ? (
                <p className="text-center py-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No data available</p>
              ) : metrics.topRestaurants.map((rest, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100">
                      {idx + 1}
                    </div>
                    <span className="text-[11px] font-bold text-slate-900">{rest.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-600">Rs. {rest.revenue.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{rest.count} Orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Low Performing</h3>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">By revenue in selected range</p>
              </div>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="space-y-3">
              {metrics.lowRestaurants.length === 0 ? (
                <p className="text-center py-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No data available</p>
              ) : metrics.lowRestaurants.map((rest, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100">
                      {idx + 1}
                    </div>
                    <span className="text-[11px] font-bold text-slate-900">{rest.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-red-600">Rs. {rest.revenue.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{rest.count} Orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const SuperAdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'Restaurant OS',
    supportEmail: 'support@restaurantos.com',
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultCurrency: 'Rs.',
    taxRate: 13,
    footerText: '© 2026 Restaurant OS. All rights reserved.'
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', 'global_settings')
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setSettings(data.value);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'global_settings',
          value: settings,
          description: 'Global platform configuration'
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Global settings saved successfully');
      
      // Update document title if platform name changed
      document.title = settings.platformName;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">System Settings</h2>
          <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">Global platform configuration</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-600 text-white px-8 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:opacity-50 active:scale-95"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-500" />
              General Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Platform Name</label>
                <input 
                  type="text" 
                  value={settings.platformName}
                  onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Support Email</label>
                <input 
                  type="email" 
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Footer Text</label>
                <input 
                  type="text" 
                  value={settings.footerText}
                  onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-500" />
              Financial Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Default Currency</label>
                <input 
                  type="text" 
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={settings.taxRate}
                  onChange={(e) => setSettings({...settings, taxRate: Number(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-500" />
              Security & Access
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-900">Maintenance Mode</p>
                  <p className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Disable access for everyone except admins</p>
                </div>
                <button 
                  onClick={() => handleToggle('maintenanceMode')}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-all duration-300",
                    settings.maintenanceMode ? "bg-brand-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                    settings.maintenanceMode ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-900">New Registrations</p>
                  <p className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Allow new restaurants to sign up</p>
                </div>
                <button 
                  onClick={() => handleToggle('allowNewRegistrations')}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-all duration-300",
                    settings.allowNewRegistrations ? "bg-brand-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                    settings.allowNewRegistrations ? "left-6" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 p-5 rounded-xl border border-brand-100 space-y-3">
            <div className="flex items-center gap-2 text-brand-700">
              <AlertCircle className="w-4 h-4" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">System Notice</h4>
            </div>
            <p className="text-[10px] text-brand-600 leading-relaxed font-medium">
              Changes made here reflect globally across the platform. Maintenance mode will immediately restrict access for all restaurant owners and customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
