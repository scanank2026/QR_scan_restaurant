import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, QrCode, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-50 border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-orange-500 p-1.5 rounded-xl shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                <QrCode className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">
                Scan<span className="text-orange-500">Ank</span>
              </span>
            </Link>
            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-orange-500 flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                <Scale className="w-3 h-3" /> Legal Agreement
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Terms of Service
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Last Updated: April 09, 2026
              </p>
            </div>

            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-8">
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using ScanAnk, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">2. Use of Services</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to use the services only for lawful purposes and in accordance with these terms.
                </p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Prohibited Actions
                  </h4>
                  <ul className="text-[11px] space-y-2 list-disc list-inside text-slate-500">
                    <li>Attempting to bypass security measures</li>
                    <li>Using the service for fraudulent activities</li>
                    <li>Reverse engineering the platform</li>
                    <li>Uploading malicious content or viruses</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">3. Subscription and Payments</h2>
                <p>
                  Certain features of ScanAnk require a paid subscription. Fees are billed in advance on a monthly or annual basis and are non-refundable except as required by law. We reserve the right to change our pricing upon notice.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">4. Intellectual Property</h2>
                <p>
                  The platform, including its original content, features, and functionality, is owned by ScanAnk and is protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">5. Limitation of Liability</h2>
                <p>
                  In no event shall ScanAnk be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, or goodwill.
                </p>
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    Our services are provided "as is" and "as available" without any warranties of any kind, either express or implied.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">6. Governing Law</h2>
                <p>
                  These terms shall be governed by and construed in accordance with the laws of Nepal, without regard to its conflict of law provisions.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2026 ScanAnk SAAS. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
