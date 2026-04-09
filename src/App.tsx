import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Settings } from 'lucide-react';
import { supabase } from './lib/supabase';
import LandingPage from './components/LandingPage';
import AboutUs from './components/AboutUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AuthPage from './components/AuthPage';
import VerifyEmail from './components/VerifyEmail';
import ForgotPassword from './components/ForgotPassword';
import { CustomerMenu } from './components/CustomerMenu';
import { ScanQR } from './components/ScanQR';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout, Overview, MenuBuilder, TableManagement, OrdersManager, WaiterCallManager, StaffManager, AnalyticsView, RestaurantSettings, Storefront, FeedbackManager, MediaManager } from './components/Dashboard';
import { SuperAdminLayout, SuperAdminOverview, SuperAdminRestaurants, SuperAdminOrders, SuperAdminUsers, SuperAdminSubscriptions, SuperAdminSettings, SuperAdminAnalytics } from './components/SuperAdmin';
import { SuperAdminAuth } from './components/SuperAdminAuth';

import { SuspendedPage } from './components/SuspendedPage';
import { ReceiptsManager } from './components/ReceiptsManager';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, restaurant, role, isImpersonating } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = React.useState<boolean | null>(null);
  
  React.useEffect(() => {
    const checkMaintenance = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'global_settings')
        .maybeSingle();
      
      setMaintenanceMode(data?.value?.maintenanceMode || false);
    };
    checkMaintenance();
  }, []);

  if (loading || maintenanceMode === null) return <div className="min-h-screen flex items-center justify-center font-black text-orange-500 animate-pulse uppercase tracking-[0.2em]">Loading...</div>;
  
  // If maintenance mode is ON and user is NOT a super admin, show suspended/maintenance page
  if (maintenanceMode && role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-brand-500/20">
            <Settings className="w-10 h-10 text-brand-500 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">System Maintenance</h1>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
            The platform is currently undergoing scheduled maintenance to improve our services. We'll be back online shortly.
          </p>
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Estimated Downtime</p>
            <p className="text-xs font-black text-brand-500 mt-1 uppercase tracking-widest">~ 30 Minutes</p>
          </div>
        </div>
      </div>
    );
  }

  // If no user is logged in, redirect to the regular login page
  if (!user) return <Navigate to="/login" replace />;

  // If user is logged in but email is not confirmed, redirect to verify-email
  // Skip this for super admins
  if (role !== 'super_admin' && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }
  
  // If the user is a restaurant owner or staff, check if their restaurant is active
  // Skip this check if it's a super admin (even if impersonating)
  if (role !== 'super_admin' && !isImpersonating && restaurant && restaurant.is_active === false) {
    return <SuspendedPage />;
  }
  
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-brand-600 animate-pulse uppercase tracking-[0.2em]">Authenticating Master Admin...</div>;
  
  // If not a super admin, redirect to the super admin login terminal, NOT the regular login
  if (!user || role !== 'super_admin') return <Navigate to="/master-admin/login" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/signup" element={<AuthPage type="signup" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Restaurant Admin Routes */}
          <Route path="/restaurant" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="dashboard" element={<Overview />} />
            <Route path="menu" element={<MenuBuilder />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="receipts" element={<ReceiptsManager />} />
            <Route path="orders" element={<OrdersManager />} />
            <Route path="staff" element={<StaffManager />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="storefront" element={<Storefront />} />
            <Route path="feedback" element={<FeedbackManager />} />
            <Route path="media" element={<MediaManager />} />
            <Route path="settings" element={<RestaurantSettings />} />
          </Route>
          
          {/* Super Admin Routes (Master Admin) */}
          <Route path="/master-admin/login" element={<SuperAdminAuth />} />
          <Route path="/master-admin" element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<SuperAdminOverview />} />
            <Route path="restaurants" element={<SuperAdminRestaurants />} />
            <Route path="orders" element={<SuperAdminOrders />} />
            <Route path="users" element={<SuperAdminUsers />} />
            <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
            <Route path="analytics" element={<SuperAdminAnalytics />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>
          
          {/* Customer Menu Routes */}
          <Route path="/scan/:slug/:tableNumber" element={<ScanQR />} />
          <Route path="/order/:slug" element={<CustomerMenu />} />
          <Route path="/order/:slug/:tableNumber" element={<CustomerMenu />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
