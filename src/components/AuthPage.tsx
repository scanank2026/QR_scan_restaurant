import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QrCode, ArrowRight, Mail, Lock, User, AlertCircle, Loader2, Zap, Ban } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface AuthPageProps {
  type: 'login' | 'signup';
}

const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(type === 'signup');
  const navigate = useNavigate();

  React.useEffect(() => {
    // Reset states when switching between login and signup
    setLoading(false);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setRestaurantName('');
    setSignupDisabled(false);
    setCheckingStatus(type === 'signup');

    if (type === 'signup') {
      const checkSignupStatus = async () => {
        try {
          const { data: settingsData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'global_settings')
            .maybeSingle();
          
          if (settingsData?.value?.allowNewRegistrations === false) {
            setSignupDisabled(true);
            setError('New registrations are currently disabled by the administrator.');
          }
        } finally {
          setCheckingStatus(false);
        }
      };
      checkSignupStatus();
    }
  }, [type]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        // Check if registrations are allowed
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'global_settings')
          .single();
        
        const allowSignup = settingsData?.value?.allowNewRegistrations !== false;
        
        if (!allowSignup) {
          throw new Error('New registrations are currently disabled by the administrator.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          // Check if we have an active session (email confirmation might be ON)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // 1. Create profile (using upsert to avoid conflicts with triggers)
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert([{ id: data.user.id, email, full_name: fullName, role: 'restaurant_owner' }]);
            
            if (profileError) {
              console.warn('Profile creation error (might be RLS):', profileError);
            }

            // 2. Create default restaurant for the owner
            const slug = restaurantName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
            const { error: restaurantError } = await supabase
              .from('restaurants')
              .upsert([{ 
                owner_id: data.user.id, 
                name: restaurantName,
                slug: slug,
                subscription_tier: 'free'
              }]);
            
            if (restaurantError) {
              console.warn('Restaurant creation error (might be RLS):', restaurantError);
            }
            
            // Even if session exists, the user wants them to see the verify email page
            // So we sign them out and redirect
            await supabase.auth.signOut();
            navigate('/verify-email', { state: { email } });
          } else {
            // Email confirmation is likely enabled
            navigate('/verify-email', { state: { email } });
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          // Check if user is a super admin or if their restaurant is suspended
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, restaurant_id')
            .eq('id', data.user.id)
            .single();

          if (profile?.role === 'super_admin') {
            // Super admins should use the master-admin login
            await supabase.auth.signOut();
            throw new Error('This account is a Super Admin. Please use the secure terminal to log in.');
          }

          // Fetch restaurant - try by profile.restaurant_id first, then fallback to owner_id
          let restaurantData = null;
          if (profile?.restaurant_id) {
            const { data: rData } = await supabase
              .from('restaurants')
              .select('id, is_active, name')
              .eq('id', profile.restaurant_id)
              .single();
            restaurantData = rData;
          } else if (profile?.role === 'restaurant_owner') {
            const { data: rData } = await supabase
              .from('restaurants')
              .select('id, is_active, name')
              .eq('owner_id', data.user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            restaurantData = rData;
          }

          if (restaurantData && restaurantData.is_active === false) {
            await supabase.auth.signOut();
            throw new Error(`Your restaurant "${restaurantData.name}" has been suspended. Please contact support@qrorder.com for assistance.`);
          }
        }
        
        navigate('/restaurant/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (type === 'signup' && checkingStatus) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4 font-sans">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (type === 'signup' && signupDisabled) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4 font-sans selection:bg-orange-100 selection:text-orange-900">
        <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
              <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                <QrCode className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Scan<span className="text-orange-500">Ank</span></span>
            </Link>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Ban className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
              Registrations Closed.
            </h1>
            
            <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
              We are currently not accepting new restaurant signups. Please check back later or contact our support team if you have an invitation.
            </p>

            <div className="space-y-3">
              <Link
                to="/login"
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                Back to Login
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors block">
                Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] grid place-items-center p-4 overflow-y-auto font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Background Accents */}
      <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm my-auto"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
              <QrCode className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Scan<span className="text-orange-500">Ank</span></span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
            {type === 'login' ? 'Welcome Back.' : 'Join the Revolution.'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {type === 'login' 
              ? 'Log in to manage your restaurant empire.' 
              : 'Start your 14-day free trial today.'}
          </p>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {type === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurant Name</label>
                  <div className="relative">
                    <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      required
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                      placeholder="The Gourmet Kitchen"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                  placeholder="name@restaurant.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                {type === 'login' && (
                  <Link 
                    to="/forgot-password" 
                    className="text-[9px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-colors"
                  >
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {type === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Repeat Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (type === 'signup' && signupDisabled)}
              className="w-full bg-slate-900 text-white py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {type === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-xs font-bold text-slate-400">
              {type === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <Link
                to={type === 'login' ? '/signup' : '/login'}
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                {type === 'login' ? 'Sign up for free' : 'Log in here'}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 opacity-50 grayscale">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Fast Setup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Secure SSL</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
