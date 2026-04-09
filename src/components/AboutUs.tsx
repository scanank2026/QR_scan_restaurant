import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, QrCode, Utensils, Users, Target, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const AboutUs = () => {
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
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                Empowering Nepal's <br />
                <span className="text-orange-500 italic font-serif font-light">Hospitality Future.</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
                ScanAnk is more than just a QR menu. We are a technology partner dedicated to modernizing the way Nepal dines.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Our Mission</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  To provide world-class digital solutions that are accessible, reliable, and specifically tailored for the unique challenges and opportunities of the Nepali market.
                </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Our Vision</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  To become the backbone of digital transformation for every restaurant, cafe, and hotel in Nepal, fostering growth and efficiency through innovation.
                </p>
              </div>
            </div>

            <div className="space-y-8 pt-12">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">The ScanAnk Story</h2>
              <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-6">
                <p>
                  Founded in Kathmandu, ScanAnk emerged from a simple observation: while the world was moving towards digital-first dining, many of our local favorites were being left behind due to complex, expensive, or ill-fitting software.
                </p>
                <p>
                  We set out to build a platform that speaks the language of the Nepali restaurant owner. From handling VAT and service charges correctly to providing multi-language support that caters to both locals and tourists, every feature of ScanAnk is built with local context in mind.
                </p>
                <p>
                  Today, we are proud to support hundreds of establishments across the country, from the bustling streets of Thamel to the serene lakeside of Pokhara.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl font-black tracking-tight">Why Choose Us?</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    { icon: <ShieldCheck className="w-5 h-5" />, title: "Local Support", desc: "Our team is based in Nepal, providing on-site training and 24/7 local support." },
                    { icon: <Utensils className="w-5 h-5" />, title: "Industry Focus", desc: "We specialize exclusively in hospitality, ensuring deep feature relevance." },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-3 text-orange-500">
                        {item.icon}
                        <h4 className="font-bold text-sm uppercase tracking-wider">{item.title}</h4>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
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

export default AboutUs;
