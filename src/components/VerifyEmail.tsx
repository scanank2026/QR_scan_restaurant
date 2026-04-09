import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, QrCode, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      // If no email is found in state, we might want to redirect or ask for it
      // For now, let's just let the user type it if needed, but usually it's passed
    }
  }, [email]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) throw error;

      setVerified(true);
      toast.success('Email verified successfully!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/restaurant/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address is required to resend the code.');
      return;
    }

    setResending(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      toast.success('Verification code resent!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

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
          <div className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
              <QrCode className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Scan<span className="text-orange-500">Ank</span></span>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.05)] text-center">
          {verified ? (
            <div className="py-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Verified!
              </h1>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Your email has been successfully verified. Redirecting you to your dashboard...
              </p>
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-orange-500" />
              </div>
              
              <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Check your inbox.
              </h1>
              
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                We've sent a 6-digit verification code to <span className="text-slate-900 font-bold">{email}</span>. Please enter it below to activate your account.
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {!email && (
                  <div className="space-y-1.5 text-left">
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
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Code</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border-none rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-300 tracking-[0.5em]"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-slate-900 text-white py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Verify Account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 space-y-4">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50"
                >
                  {resending ? 'Resending...' : "Didn't receive the code? Resend"}
                </button>

                <div className="pt-4 border-t border-slate-50">
                  <Link
                    to="/login"
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
