import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Mail, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const SuperAdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auto-redirect if already logged in as super_admin
  React.useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role === 'super_admin') {
          navigate('/master-admin/overview');
        }
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      if (data.user) {
        // Strict role check in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Supabase Profile Error:', profileError);
          throw new Error(`Database Error: ${profileError.message} (Code: ${profileError.code})`);
        }

        if (profile?.role !== 'super_admin') {
          await supabase.auth.signOut();
          throw new Error(`Access Denied: Your account role is "${profile?.role || 'user'}". You need "super_admin" privileges to enter this terminal.`);
        }

        toast.success('Master Access Granted');
        navigate('/master-admin/overview');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-brand-500/30">
      {/* Matrix-like background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_70%)]" />
        <div className="grid grid-cols-12 gap-4 h-full w-full opacity-10">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="h-20 border-[0.5px] border-brand-500/20 rounded-lg" />
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-500/10 rounded-[2rem] border border-brand-500/20 mb-6 shadow-[0_0_50px_-12px_rgba(14,165,233,0.5)]">
            <Shield className="w-10 h-10 text-brand-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
            System <span className="text-brand-500">Terminal</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            Authorized Personnel Only
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Identifier</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-base font-bold text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-slate-700"
                  placeholder="admin@system.local"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-base font-bold text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-500 hover:shadow-[0_0_30px_-5px_rgba(14,165,233,0.6)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Initialize Session
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Encrypted Connection • AES-256
        </p>
      </motion.div>
    </div>
  );
};
