import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ShieldAlert, Mail, Phone } from 'lucide-react';

export const SuspendedPage = () => {
  const { signOut, restaurant } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-red-500 p-8 flex justify-center">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            <ShieldAlert className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Account Suspended</h1>
          <p className="text-slate-500 font-medium mb-8">
            Access to your restaurant dashboard for <span className="text-slate-900 font-bold">"{restaurant?.name}"</span> has been restricted by the system administrator.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 text-left">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <Mail className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Support</p>
                <p className="text-sm font-bold text-slate-900">support@qrorder.com</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 text-left">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <Phone className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Line</p>
                <p className="text-sm font-bold text-slate-900">+1 (555) 0123-4567</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => signOut()}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Master Control System v2.1
          </p>
        </div>
      </div>
    </div>
  );
};
