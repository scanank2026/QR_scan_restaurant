import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, QrCode, Shield, Lock, Eye, FileText } from 'lucide-react';
import { motion } from 'motion/react';

const PrivacyPolicy = () => {
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                <Shield className="w-3 h-3" /> Data Protection
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Last Updated: April 09, 2026
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: <Lock className="w-5 h-5" />, title: "Secure Storage", desc: "Your data is encrypted and stored in secure cloud servers." },
                { icon: <Eye className="w-5 h-5" />, title: "Transparency", desc: "We are clear about what data we collect and why." },
                { icon: <FileText className="w-5 h-5" />, title: "Your Rights", desc: "You have full control over your restaurant's data." },
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="text-orange-500">{item.icon}</div>
                  <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-8">
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">1. Information We Collect</h2>
                <p>
                  We collect information you provide directly to us when you create an account, such as your name, email address, restaurant details, and payment information. We also collect data related to your restaurant's operations, including menu items, orders, and staff information.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">2. How We Use Your Information</h2>
                <p>
                  We use the information we collect to provide, maintain, and improve our services. This includes processing orders, generating analytics, and communicating with you about your account and our platform.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">3. Data Sharing and Disclosure</h2>
                <p>
                  We do not sell your personal or business data to third parties. We may share information with service providers who perform services on our behalf, such as payment processing and data hosting, strictly under confidentiality agreements.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">4. Data Security</h2>
                <p>
                  We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">5. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at support@scanank.com.
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

export default PrivacyPolicy;
