import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Menu, QrCode, Utensils, BarChart3, ShieldCheck, ArrowRight, 
  CheckCircle2, Star, Users, Zap, Smartphone, Globe, Coffee, Plus, Shield,
  Receipt, Layout, SmartphoneNfc, Headphones, Languages, Bell, MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const LandingPage = () => {
  const [settings, setSettings] = React.useState<any>(null);
  const [plans, setPlans] = React.useState<any[]>([]);
  const [allowSignup, setAllowSignup] = React.useState(true);
  const [loadingPlans, setLoadingPlans] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      // Fetch Global Settings
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'global_settings')
        .maybeSingle();
      
      if (settingsData?.value) {
        setSettings(settingsData.value);
        if (settingsData.value.allowNewRegistrations === false) {
          setAllowSignup(false);
        }
        if (settingsData.value.platformName) {
          document.title = settingsData.value.platformName;
        }
      }

      // Fetch Pricing Plans
      const { data: plansData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'subscription_plans')
        .maybeSingle();
      
      if (plansData?.value) {
        setPlans(plansData.value);
      } else {
        // Fallback default plans
        setPlans([
          { id: 'free', name: 'Starter', price: 0, desc: 'Perfect for small tea shops & street food stalls', features: ['Up to 5 Tables', 'Digital Menu (QR)', 'Basic Sales Report', 'Nepali Language Support', 'Standard QR Templates'] },
          { id: 'pro', name: 'Professional', price: 2999, desc: 'Best for busy cafes & restaurants', popular: true, features: ['Unlimited Tables', 'Kitchen Display System (KDS)', 'Advanced Analytics', 'Staff Management', 'Custom Branding', 'Priority Support'] },
          { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'For large hotel chains & franchises', features: ['Multi-location Dashboard', 'Inventory Management', 'API Access', 'Dedicated Account Manager', 'Custom Integrations', '24/7 Phone Support'] }
        ]);
      }
      setLoadingPlans(false);
    };
    fetchData();
  }, []);

  if (settings?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Under Maintenance</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              We're currently performing some scheduled maintenance to improve your experience. We'll be back online shortly.
            </p>
          </div>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status: Updating</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-50 border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="bg-orange-500 p-1.5 rounded-xl shadow-lg shadow-orange-200">
                <QrCode className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">
                {settings?.platformName ? (
                  <>
                    {settings.platformName.split(' ')[0]}
                    <span className="text-orange-500">{settings.platformName.split(' ').slice(1).join(' ')}</span>
                  </>
                ) : (
                  <>Scan<span className="text-orange-500">Ank</span></>
                )}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-10 text-[13px] font-bold uppercase tracking-wider text-slate-500">
              <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
              <a href="#solutions" className="hover:text-orange-500 transition-colors">Solutions</a>
              <a href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-orange-500 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2 transition-all">Login</Link>
              <Link to="/signup" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-500 hover:shadow-xl hover:shadow-orange-200 transition-all active:scale-95">
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-200 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-[10px] font-black tracking-[0.25em] text-orange-600 uppercase bg-orange-50/50 backdrop-blur-md border border-orange-100 rounded-full shadow-sm"
            >
              <Zap className="w-3 h-3 fill-orange-600" /> Trusted by 500+ Nepali Restaurants
            </motion.div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1] sm:leading-[1.0] md:leading-[0.95]">
              Dine Smarter. <br />
              <span className="text-orange-500 italic font-serif font-light">
                Order Faster.
              </span>
            </h1>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-500 mb-8 leading-relaxed font-medium px-4">
              The all-in-one QR ordering SaaS built for the unique needs of <span className="text-slate-900 font-bold">Nepal's hospitality industry.</span> 
              Boost efficiency, reduce errors, and delight your customers with zero hardware.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
              {allowSignup ? (
                <Link to="/signup" className="w-full sm:w-auto bg-orange-500 text-white px-8 py-4 rounded-xl font-black text-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-2 group">
                  <span>Start Your Free Trial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="w-full sm:w-auto bg-slate-100 text-slate-400 px-8 py-4 rounded-xl font-black text-sm cursor-not-allowed">
                  Registrations Closed
                </div>
              )}
              <div className="w-full sm:w-auto flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="flex -space-x-1.5">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?u=nepal${i}`} className="w-7 h-7 rounded-full border-2 border-white shadow-sm" alt="User" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">500+ Owners Trust Us</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Clean Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-16 relative mx-auto max-w-5xl"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white aspect-[16/9] group">
               <img 
                src="https://picsum.photos/seed/nepali-restaurant/1600/900" 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-95 group-hover:scale-[1.02] transition-transform duration-700"
                referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section (Nepali Brands) */}
      <section className="py-16 bg-white border-y border-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Empowering Nepal's Finest Establishments</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {['The Momo Hub', 'Kathmandu Coffee', 'Pokhara Lakeside Inn', 'Everest Bakery', 'Newari Kitchen'].map((brand, i) => (
              <span key={i} className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter whitespace-nowrap">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Why ScanAnk Section (Clean Grid) */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Built for <span className="text-orange-500">Nepal.</span>
            </h2>
            <p className="text-slate-500 text-base font-medium">
              A streamlined platform optimized for local business needs, speed, and reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature Card */}
            <div className="md:col-span-2 bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
              <div className="mb-6 bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Reliable & Secure</h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm max-w-md">
                Built on enterprise-grade infrastructure to ensure your restaurant stays online during peak hours. Secure data management for your peace of mind.
              </p>
            </div>

            {/* Feature Card */}
            <div className="bg-slate-900 p-8 rounded-3xl text-white hover:shadow-xl transition-all group">
              <div className="mb-6 bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black mb-3">VAT & Tax Ready</h3>
              <p className="text-slate-400 leading-relaxed font-medium text-xs">
                Fully compliant with <span className="text-white">IRD Nepal standards.</span> Automatic calculation of 13% VAT and 10% Service Charge on every bill.
              </p>
            </div>

            {/* Feature Cards Row */}
            {[
              {
                icon: <Zap className="w-5 h-5 text-blue-500" />,
                title: "Instant KDS",
                desc: "Orders hit the kitchen in real-time. No more shouting or lost paper slips. Improve kitchen efficiency by 40%."
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
                title: "Deep Analytics",
                desc: "Track your best-selling items, peak hours, and revenue trends. Make data-driven decisions for your menu."
              },
              {
                icon: <Bell className="w-5 h-5 text-emerald-500" />,
                title: "Waiter Call System",
                desc: "Customers can request assistance or the bill with a single tap. Staff get instant notifications on their devices."
              },
              {
                icon: <SmartphoneNfc className="w-5 h-5 text-orange-500" />,
                title: "Zero Hardware",
                desc: "No expensive POS machines needed. Use any existing smartphone, tablet, or laptop to manage your entire restaurant."
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
                title: "Digital Receipts",
                desc: "Go paperless and save costs. Send professional digital receipts to customers via WhatsApp or Email instantly."
              },
              {
                icon: <Headphones className="w-5 h-5 text-rose-500" />,
                title: "24/7 Local Support",
                desc: "Our team in Kathmandu is always ready to help. On-site training and technical support whenever you need it."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all group">
                <div className="mb-4 bg-slate-50 w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium text-[11px]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple "How it Works" Section */}
      <section id="solutions" className="py-20 bg-slate-900 text-white rounded-[2.5rem] mx-4 my-8 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/nepali-food-scan/800/1000" 
                  alt="Customer Scanning QR" 
                  className="w-full aspect-[4/5] object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight tracking-tight">
                From Paper to <br />
                <span className="text-orange-500 italic font-serif font-light">Digital in Minutes.</span>
              </h2>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Digitalize Your Menu", desc: "Upload photos of your Momos, Thalis, and more. Set prices in NPR, add descriptions, and categorize items for easy browsing." },
                  { step: "02", title: "Print Smart QR Codes", desc: "Generate unique QR codes for every table. We provide beautiful, branded templates you can print and place on your tables instantly." },
                  { step: "03", title: "Customers Scan & Order", desc: "Customers scan the code, browse your beautiful digital menu, and place orders directly from their phones without waiting for a waiter." },
                  { step: "04", title: "Kitchen Gets Notified", desc: "Orders appear instantly on your Kitchen Display System (KDS). Staff can start preparing immediately, reducing wait times by up to 50%." },
                  { step: "05", title: "Track & Grow", desc: "Monitor live orders, track staff performance, and see detailed revenue analytics to grow your business from any device, anywhere." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-3xl font-black text-slate-700 leading-none">{item.step}</span>
                    <div>
                      <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                      <p className="text-slate-400 leading-relaxed font-medium text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Nepali Friendly) */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Simple, Transparent <span className="text-orange-500">Pricing.</span></h2>
            <p className="text-slate-500 text-lg font-medium">Choose the plan that fits your restaurant's size. No hidden setup fees, ever.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center text-left">
            {plans.map((plan, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -10 }}
                className={cn(
                  "relative p-10 rounded-[3.5rem] border transition-all duration-500",
                  plan.popular 
                    ? "border-orange-500 shadow-[0_40px_100px_-20px_rgba(249,115,22,0.15)] scale-105 z-10 bg-white py-16" 
                    : "border-slate-100 bg-white hover:border-slate-200"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-lg shadow-orange-200">
                    Recommended
                  </div>
                )}
                <div className="mb-10">
                  <h3 className="text-sm font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                      {typeof plan.price === 'number' ? `Rs. ${plan.price.toLocaleString()}` : plan.price}
                    </span>
                    {typeof plan.price === 'number' && <span className="text-slate-400 font-bold text-sm sm:text-lg">/mo</span>}
                  </div>
                  <p className="text-slate-500 text-xs mt-4 font-medium leading-relaxed">{plan.desc}</p>
                </div>
                <ul className="space-y-4 mb-12">
                  {plan.features?.map((feat: string, j: number) => (
                    <li key={j} className="flex items-center gap-3 text-slate-600 text-[11px] font-bold">
                      <div className="bg-orange-50 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={cn(
                  "w-full py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-black text-center block transition-all active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest",
                  plan.popular 
                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-100" 
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}>
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials (Nepali Context) */}
      <section className="py-24 bg-slate-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Trusted by <span className="text-orange-500">Local Leaders.</span></h2>
            <p className="text-slate-500 font-medium">Success stories from the heart of Nepal's hospitality scene.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "ScanAnk has completely transformed how we handle the lunch rush. Our waiters are less stressed, and customers love the digital menu.",
                author: "Ramesh Thapa",
                role: "Owner, The Momo Hub",
                img: "https://i.pravatar.cc/150?u=ramesh"
              },
              {
                quote: "The system is incredibly intuitive. We've seen a significant increase in efficiency, making our end-of-day reconciliation so much easier.",
                author: "Sunita Shrestha",
                role: "Manager, Newari Delights",
                img: "https://i.pravatar.cc/150?u=sunita"
              },
              {
                quote: "Being able to update prices and items instantly across all tables is a lifesaver. No more reprinting paper menus every time we change a dish.",
                author: "Binod Chaudhary",
                role: "Founder, Himalayan Flavors",
                img: "https://i.pravatar.cc/150?u=binod"
              }
            ].map((t, i) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.02 }}
                className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative group"
              >
                <div className="absolute -top-5 left-10 bg-slate-900 p-3 rounded-2xl shadow-lg group-hover:bg-orange-500 transition-colors">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
                <p className="text-slate-600 italic mb-8 leading-relaxed font-medium text-sm">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.img} className="w-12 h-12 rounded-full border-2 border-orange-100 shadow-sm" alt={t.author} referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-sm font-black text-slate-900">{t.author}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-orange-100 rounded-full blur-[100px] opacity-30 -z-0" />
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Common <span className="text-orange-500 italic font-serif font-light">Questions.</span></h2>
            <p className="text-slate-500 font-medium">Everything you need to know about going digital.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "Do customers need to download an app?", a: "No! Customers simply scan the QR code with their phone's camera and the menu opens instantly in their mobile browser. It works on all smartphones including iPhone and Android." },
              { q: "Is there any hardware I need to buy?", a: "None. You can use any existing tablet or smartphone to manage orders. For the kitchen, any cheap tablet works perfectly as a KDS. You can even use a laptop at the billing counter." },
              { q: "Can I use it for multiple locations?", a: "Yes! Our Enterprise plan is designed for franchises and chains, allowing you to manage multiple restaurants from a single master dashboard with centralized reporting." },
              { q: "How long does it take to set up?", a: "You can be up and running in less than 30 minutes. Simply sign up, upload your menu, and print your QR codes. Our team can also help you with the initial menu upload." },
              { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption and secure cloud hosting to ensure your restaurant's data and your customers' information are always protected." },
              { q: "Do you support offline ordering?", a: "ScanAnk is a cloud-based platform and requires an internet connection to sync orders in real-time. However, it is optimized to work even on slower 3G/4G connections common in Nepal." }
            ].map((faq, i) => (
              <details key={i} className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-slate-900 list-none">
                  <span className="text-sm">{faq.q}</span>
                  <Plus className="w-4 h-4 text-slate-400 group-open:rotate-45 transition-transform" />
                </summary>
                <p className="mt-4 text-slate-500 font-medium leading-relaxed text-xs">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 relative overflow-hidden bg-slate-900 rounded-[4rem] mx-4 mb-12">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-white mb-6 sm:mb-10 leading-none tracking-tight">
              Ready to <span className="text-orange-500 italic font-serif font-light">Transform?</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-xl font-medium mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Join the hundreds of Nepali restaurants already boosting their revenue with ScanAnk. 
              No credit card required. Start your 14-day free trial today.
            </p>
            <Link to="/signup" className="inline-flex items-center gap-3 sm:gap-4 bg-orange-500 text-white px-8 py-4 sm:px-12 sm:py-6 rounded-xl sm:rounded-[2.5rem] font-black text-sm sm:text-xl hover:bg-orange-600 hover:shadow-[0_20px_60px_-10px_rgba(249,115,22,0.5)] transition-all active:scale-95 group">
              Join Now for Free <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent opacity-50" />
      </section>


      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="bg-orange-500 p-1.5 rounded-xl">
                  <QrCode className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Scan<span className="text-orange-500">Ank</span></span>
              </div>
              <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
                Empowering restaurants to thrive in the digital age through seamless QR ordering and intelligent kitchen management.
              </p>
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Product</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#features" className="hover:text-orange-500 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</a></li>
                <li><a href="#solutions" className="hover:text-orange-500 transition-colors">Solutions</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Company</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><Link to="/about" className="hover:text-orange-500 transition-colors">About Us</Link></li>
                <li><Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2026 ScanAnk SAAS. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6">
              {['Twitter', 'Instagram', 'LinkedIn'].map(social => (
                <a key={social} href="#" className="text-slate-400 hover:text-orange-500 text-[10px] font-bold uppercase tracking-widest transition-colors">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
