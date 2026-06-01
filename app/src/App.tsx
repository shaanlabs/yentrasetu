import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, CheckCircle2, Shield, TrendingUp,
  Wrench, Users, MapPin, Star, ChevronRight
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useUtmTracker } from './hooks/useUtmTracker';
import { useSEO } from './hooks/useSEO';
import Navbar from './components/Navbar';
import { analyticsApi, machineryApi } from './services/api';
import './App.css';

/* ─── Framer Motion Variants ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const, delay },
  }),
};

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay },
  }),
};

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const VP = { once: true, margin: '-80px' };

/* ─── Category data ───────────────────────────────────────────── */
const CATEGORIES = [
  { label: 'Excavators', img: '/images/category_excavators.jpg', count: '3,200+', href: '/browse?category=excavators' },
  { label: 'Cranes', img: '/images/category_cranes.jpg', count: '840+', href: '/browse?category=cranes' },
  { label: 'Dumpers', img: '/images/category_dumpers.jpg', count: '1,600+', href: '/browse?category=dumpers' },
  { label: 'Loaders', img: '/images/howitworks_operator.jpg', count: '920+', href: '/browse?category=loaders' },
  { label: 'Concrete', img: '/images/safety_quarry.jpg', count: '560+', href: '/browse?category=concrete' },
  { label: 'All Equipment', img: '/images/hero_excavator.jpg', count: '12,500+', href: '/browse', featured: true },
];

const STEPS = [
  { n: '01', title: 'Browse & Filter', body: 'Search 12,500+ verified listings by category, location, price, and brand. AI-powered recommendations match your scope.' },
  { n: '02', title: 'Inspect & Verify', body: 'Every listing includes a certified inspection report — engine, hydraulics, undercarriage, cab. No surprises.' },
  { n: '03', title: 'Transact Safely', body: 'Escrow-backed payments. Ownership transfer support. Pan-India logistics. Deal closes in as little as 48 hours.' },
];

const STATS = [
  { value: '12,500+', label: 'Verified Listings' },
  { value: '₹2,800Cr', label: 'Equipment Traded' },
  { value: '18+', label: 'States Active' },
  { value: '45,000+', label: 'Registered Users' },
];

const TICKER_ITEMS = [
  'JCB 3DX · ₹15.2L', 'Tata Hitachi EX200 · ₹42L', 'ACE Crane 16T · ₹28.5L',
  'Komatsu PC200 · ₹38L', 'CAT 320 · ₹52L', 'L&T Excavator · ₹35L',
  'Volvo EC210 · ₹44L', 'Hyundai R140 · ₹22L', 'BEML BH40 · ₹68L',
];

const SERVICES = [
  { icon: Users, title: 'Hire Operators', body: 'DGMS-certified machine operators. Day rates from ₹1,200.', href: '/operators', color: '#FF6A00' },
  { icon: Wrench, title: 'Find Mechanics', body: 'On-site repairs & maintenance. ITI-certified, 4-hr response.', href: '/mechanics', color: '#2563EB' },
  { icon: TrendingUp, title: 'Get Financing', body: 'Equipment loans up to ₹5Cr. Check eligibility in 2 min.', href: '/loan-eligibility', color: '#16A34A' },
  { icon: Shield, title: 'Inspections', body: 'Certified assessment with full photo + condition report.', href: '/certifications', color: '#7C3AED' },
];

/* ─── Parallax hero image hook ────────────────────────────────── */
function HeroSection({ isAuthenticated, navigate }: { isAuthenticated: boolean; navigate: (path: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [stats, setStats] = useState(STATS);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    analyticsApi.getPublicStats()
      .then(data => {
        setStats([
          { value: `${data.totalListings.toLocaleString()}+`, label: 'Verified Listings' },
          { value: `₹${(data.totalValue / 10000000).toFixed(1)}Cr`, label: 'Equipment Traded' },
          { value: `${data.activeStates}+`, label: 'States Active' },
          { value: `${data.totalUsers.toLocaleString()}+`, label: 'Registered Users' },
        ]);
        setLoadingStats(false);
      })
      .catch(() => {
        // Fallback to static if error
        setLoadingStats(false);
      });
  }, []);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[600px] overflow-hidden bg-[#0D0F10] flex items-center">
      {/* Parallax background */}
      <motion.div className="absolute inset-0 z-0" style={{ y: imgY }}>
        <img
          src="/images/sany_cranes.png"
          alt="Heavy machinery cranes"
          className="w-full h-[120%] object-cover object-center"
          style={{ marginTop: '-10%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F10]/90 via-[#0D0F10]/60 to-[#0D0F10]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F10]/80 via-transparent to-transparent" />
      </motion.div>

      {/* Noise texture */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      {/* Hero content */}
      <motion.div
        className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 w-full"
        style={{ y: textY, opacity }}
      >
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-sm mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[11px] text-white/50 font-medium tracking-[0.16em]"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            LIVE · 18+ STATES · 12,500+ LISTINGS
          </span>
        </motion.div>

        {/* Headline */}
        <div className="overflow-hidden mb-4">
          <motion.h1
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.85, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-white"
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(42px, 7.5vw, 100px)',
              lineHeight: 0.92,
              letterSpacing: '-0.03em',
            }}
          >
            India's Heavy<br />Equipment<br />
            <span style={{ background: 'linear-gradient(135deg, #FF6A00 0%, #FF9A3C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Market.
            </span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/50 text-base md:text-lg max-w-lg mb-10 leading-relaxed"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Buy, sell, and rent verified machinery. Hire operators. Get financing.
          All on one inspected, documented platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap gap-3"
        >
          <button
            onClick={() => navigate('/browse')}
            className="group flex items-center gap-2 px-6 py-3.5 bg-[#FF6A00] hover:bg-[#e55f00] text-white font-semibold rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Browse Equipment
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => navigate(isAuthenticated ? '/sell' : '/login')}
            className="group flex items-center gap-2 px-6 py-3.5 border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-medium rounded-xl text-sm transition-all duration-200 backdrop-blur-sm"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            List Your Machine
            <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Bottom stat strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-wrap gap-6 mt-14 pt-8 border-t border-white/[0.08]"
        >
          {loadingStats ? (
            <div className="text-white/50 text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Loading stats...</div>
          ) : (
            stats.map((s) => (
              <div key={s.label}>
                <p className="text-white text-xl font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{s.value}</p>
                <p className="text-white/30 text-[11px] mt-0.5 tracking-wide">{s.label}</p>
              </div>
            ))
          )}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="absolute bottom-8 right-8 z-10 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-[1px] h-10 bg-gradient-to-b from-transparent to-white/30"
        />
        <span className="text-[10px] text-white/20 tracking-[0.15em]" style={{ fontFamily: 'IBM Plex Mono, monospace', writingMode: 'vertical-rl' }}>SCROLL</span>
      </motion.div>
    </section>
  );
}

/* ─── Marquee ticker ──────────────────────────────────────────── */
function PriceTicker() {
  const [tickerItems, setTickerItems] = useState(TICKER_ITEMS);

  useEffect(() => {
    machineryApi.getListings({ limit: 15, sortBy: 'createdAt', sortOrder: 'DESC' })
      .then((res: any) => {
        if (res.listings && res.listings.length > 0) {
          const items = res.listings.map((l: any) => `${l.make} ${l.model} · ₹${(l.price / 100000).toFixed(1)}L`);
          setTickerItems(items);
        }
      })
      .catch(() => {});
  }, []);

  const items = [...tickerItems, ...tickerItems];
  return (
    <div className="bg-[#0D0F10] border-y border-white/[0.06] py-3.5 overflow-hidden select-none">
      <motion.div
        className="flex gap-0 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
      >
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 px-6" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            <span className="text-[11px] text-white/40 uppercase tracking-widest">{item}</span>
            <span className="text-white/10">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Category helper ───────────────────────────────────────────── */
const getFallbackBase64 = (category: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#2A2D32"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${category}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/* ─── Category section ────────────────────────────────────────── */
function CategorySection({ navigate }: { navigate: (path: string) => void }) {
  const [categories, setCategories] = useState(CATEGORIES);

  useEffect(() => {
    machineryApi.getCategories()
      .then((res: any) => {
        if (res.categories && res.categories.length > 0) {
          // Map DB categories to UI categories
          // Fallback to our existing static image map for known categories
          const imgMap: Record<string, string> = {
            'Excavators': '/images/category_excavators.jpg',
            'Cranes': '/images/category_cranes.jpg',
            'Dumpers': '/images/category_dumpers.jpg',
            'Loaders': '/images/howitworks_operator.jpg',
            'Concrete': '/images/safety_quarry.jpg'
          };
          
          const mapped = res.categories.map((c: any) => ({
            label: c.category,
            img: imgMap[c.category] || getFallbackBase64(c.category),
            count: `${c.count}`,
            href: `/browse?category=${c.category.toLowerCase()}`,
            featured: false
          }));

          // Always add 'All Equipment' at the end
          mapped.push({
            label: 'All Equipment',
            img: '/images/hero_excavator.jpg',
            count: 'Browse All',
            href: '/browse',
            featured: true
          });

          setCategories(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="bg-[#F2EDE7] py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="mb-14"
        >
          <motion.p variants={staggerItem} className="text-[11px] font-bold text-[#FF6A00] tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            EQUIPMENT MARKETPLACE
          </motion.p>
          <motion.h2 variants={staggerItem}
            className="text-[#0D0F10]"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 1.0, letterSpacing: '-0.025em' }}>
            Shop by Category.
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.label}
              variants={staggerItem}
              onClick={() => navigate(cat.href)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative overflow-hidden rounded-2xl text-left ${cat.featured ? 'md:col-span-1 row-span-1' : ''}`}
              style={{ aspectRatio: '4/3' }}
            >
              <img
                src={cat.img}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F10]/80 via-[#0D0F10]/20 to-transparent" />
              {cat.featured && (
                <div className="absolute inset-0 bg-[#FF6A00]/20" />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white font-bold text-base md:text-lg mb-0.5"
                  style={{ fontFamily: 'Sora, sans-serif' }}>{cat.label}</p>
                <p className="text-white/50 text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {cat.count} listings
                </p>
              </div>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-[#FF6A00]">
                <ArrowUpRight size={14} className="text-white" />
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          variants={fadeUp}
          className="mt-10 flex justify-center"
        >
          <button
            onClick={() => navigate('/browse')}
            className="group flex items-center gap-2 text-sm font-semibold text-[#0D0F10] hover:text-[#FF6A00] transition-colors"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Browse all categories
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How it works ────────────────────────────────────────────── */
function HowItWorksSection() {
  return (
    <section className="bg-[#0D0F10] py-24 md:py-32 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#FF6A00]/[0.04] blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          variants={staggerContainer}
          className="mb-16"
        >
          <motion.p variants={staggerItem}
            className="text-[11px] font-bold text-[#FF6A00] tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            HOW IT WORKS
          </motion.p>
          <motion.h2 variants={staggerItem}
            className="text-white"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 1.0, letterSpacing: '-0.025em' }}>
            Deal in 3 Steps.
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              custom={i * 0.12}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="bg-[#0D0F10] p-8 md:p-10 group hover:bg-white/[0.03] transition-colors duration-300"
            >
              <span className="text-[56px] font-black text-white/[0.04] block mb-6 leading-none"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{step.n}</span>
              <h3 className="text-white font-bold text-xl mb-4"
                style={{ fontFamily: 'Sora, sans-serif' }}>{step.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed"
                style={{ fontFamily: 'DM Sans, sans-serif' }}>{step.body}</p>
              <motion.div
                className="mt-8 h-[1px] bg-gradient-to-r from-[#FF6A00] to-transparent"
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={VP}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured split section ──────────────────────────────────── */
function FeaturedSection({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section className="bg-[#F2EDE7] py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: image */}
          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src="/images/howitworks_operator.jpg"
                alt="Operator on equipment"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0D0F10]/40 to-transparent" />
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VP}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 shadow-xl"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} className="text-[#FF6A00]" />
                </div>
                <div>
                  <p className="text-[#0D0F10] text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>Inspection Verified</p>
                  <p className="text-[#6B6560] text-xs">Engine · Hydraulics · Undercarriage · Cab — all checked</p>
                </div>
              </motion.div>
            </div>

            {/* Decorative offset block */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl bg-[#FF6A00]/10 -z-10" />
          </motion.div>

          {/* Right: content */}
          <motion.div
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
          >
            <p className="text-[11px] font-bold text-[#FF6A00] tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              WHY YANTRASETU
            </p>
            <h2 className="text-[#0D0F10] mb-6"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.025em' }}>
              Every Machine is<br />Documented.
            </h2>
            <p className="text-[#6B6560] text-base leading-relaxed mb-10"
              style={{ fontFamily: 'DM Sans, sans-serif' }}>
              We physically inspect each listing before it goes live. Engine, hydraulics, undercarriage, cab — full certified report attached to every purchase.
            </p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="space-y-4 mb-10"
            >
              {[
                'Physical inspection by a certified assessor',
                'Full photographic documentation',
                'Clear title verification & ownership support',
                'Escrow-backed secure payments',
              ].map((item) => (
                <motion.div key={item} variants={staggerItem} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] mt-2 shrink-0" />
                  <p className="text-[#0D0F10] text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>{item}</p>
                </motion.div>
              ))}
            </motion.div>

            <button
              onClick={() => navigate('/certifications')}
              className="group flex items-center gap-2 text-sm font-semibold text-[#0D0F10] hover:text-[#FF6A00] transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              See a sample report
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Services section ────────────────────────────────────────── */
function ServicesSection({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section className="bg-[#0D0F10] py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="mb-16"
        >
          <motion.p variants={staggerItem}
            className="text-[11px] font-bold text-[#FF6A00] tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            MORE THAN MACHINES
          </motion.p>
          <motion.h2 variants={staggerItem}
            className="text-white"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 1.0, letterSpacing: '-0.025em' }}>
            Everything Your<br />Project Needs.
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {SERVICES.map((svc) => (
            <motion.button
              key={svc.title}
              variants={staggerItem}
              onClick={() => navigate(svc.href)}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group text-left p-7 rounded-2xl border border-white/[0.07] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${svc.color}18` }}
              >
                <svc.icon size={20} style={{ color: svc.color }} />
              </div>
              <h3 className="text-white font-bold text-base mb-2.5 group-hover:text-[#FF6A00] transition-colors"
                style={{ fontFamily: 'Sora, sans-serif' }}>{svc.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed"
                style={{ fontFamily: 'DM Sans, sans-serif' }}>{svc.body}</p>
              <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-white/30 group-hover:text-[#FF6A00] transition-colors">
                Explore <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Social proof / stats ────────────────────────────────────── */
function StatsSection() {
  return (
    <section className="bg-[#FF6A00] py-20 md:py-24 overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        >
          {STATS.map((s) => (
            <motion.div key={s.label} variants={staggerItem} className="text-center">
              <p className="text-white text-3xl md:text-4xl font-black mb-2"
                style={{ fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p className="text-white/60 text-xs uppercase tracking-widest"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Testimonial ─────────────────────────────────────────────── */
function TestimonialSection() {
  return (
    <section className="bg-[#F2EDE7] py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={slideLeft} initial="hidden" whileInView="visible" viewport={VP}>
            <span className="text-[120px] leading-none text-[#FF6A00]/20 font-serif block -mb-8">"</span>
            <blockquote className="text-[#0D0F10] text-2xl md:text-3xl font-medium leading-snug mb-8"
              style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.015em' }}>
              I needed three excavators on short notice. YantraSetu had inspected options with reports I could share with my PM. Closed in 48 hours.
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center text-white font-bold text-sm"
                style={{ fontFamily: 'Sora, sans-serif' }}>A</div>
              <div>
                <p className="font-bold text-[#0D0F10] text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Arjun Mehta</p>
                <p className="text-[#6B6560] text-xs">Site Manager · Bengaluru</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-[#FF6A00] fill-[#FF6A00]" />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={slideRight} initial="hidden" whileInView="visible" viewport={VP}
            className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <img src="/images/testimonial_portrait.jpg" alt="Arjun Mehta" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6A00]/20 to-transparent" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Financing CTA ───────────────────────────────────────────── */
function FinancingSection({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section className="bg-[#0D0F10] py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#FF6A00]/[0.08] blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-[#FF6A00]/[0.05] blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div variants={slideLeft} initial="hidden" whileInView="visible" viewport={VP}>
            <p className="text-[11px] font-bold text-[#FF6A00] tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              EQUIPMENT FINANCING
            </p>
            <h2 className="text-white mb-6"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.025em' }}>
              Built for<br />Contractors.<br />
              <span style={{ background: 'linear-gradient(135deg, #FF6A00, #FF9A3C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Backed by<br />Inspection.
              </span>
            </h2>
            <p className="text-white/40 text-base leading-relaxed mb-8"
              style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Equipment loans up to ₹5Cr. Check eligibility in 2 minutes. Partner NBFCs and banks with pre-approved rates for YantraSetu buyers.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/loan-eligibility')}
                className="group flex items-center gap-2 px-6 py-3.5 bg-[#FF6A00] hover:bg-[#e55f00] text-white font-semibold rounded-xl text-sm transition-all"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Check Eligibility
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/market-insights')}
                className="flex items-center gap-2 px-6 py-3.5 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-medium rounded-xl text-sm transition-all"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Market Insights
              </button>
            </div>
          </motion.div>

          <motion.div variants={slideRight} initial="hidden" whileInView="visible" viewport={VP}
            className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <img src="/images/hero_excavator.jpg" alt="Machinery" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0D0F10]/60 to-[#FF6A00]/20" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                <p className="text-white/50 text-xs mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>TALK TO A SPECIALIST</p>
                <p className="text-white font-bold text-lg mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Get a financing quote</p>
                <button onClick={() => navigate('/contact-specialist')}
                  className="text-[#FF6A00] text-sm font-semibold hover:underline flex items-center gap-1"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Talk to a specialist <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ───────────────────────────────────────────────── */
function FinalCTA({ isAuthenticated, navigate }: { isAuthenticated: boolean; navigate: (path: string) => void }) {
  return (
    <section className="bg-[#F2EDE7] py-24 md:py-32">
      <div className="max-w-[800px] mx-auto px-6 md:px-12 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
        >
          <motion.p variants={staggerItem}
            className="text-[11px] font-bold text-[#FF6A00] tracking-[0.2em] uppercase mb-6"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            GET STARTED TODAY
          </motion.p>
          <motion.h2 variants={staggerItem}
            className="text-[#0D0F10] mb-6"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 1.0, letterSpacing: '-0.03em' }}>
            India's Equipment.<br />One Platform.
          </motion.h2>
          <motion.p variants={staggerItem}
            className="text-[#6B6560] text-base md:text-lg mb-10 leading-relaxed max-w-md mx-auto"
            style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Join 45,000+ contractors, dealers, and fleet managers already using YantraSetu.
          </motion.p>
          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/browse')}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-[#0D0F10] hover:bg-[#FF6A00] text-white font-semibold rounded-xl text-sm transition-all duration-300"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Browse Equipment
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? '/sell' : '/register')}
              className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#0D0F10] hover:border-[#FF6A00] text-[#0D0F10] hover:text-[#FF6A00] font-semibold rounded-xl text-sm transition-all duration-300"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {isAuthenticated ? 'List Equipment' : 'Create Free Account'}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────── */
function SiteFooter({ navigate }: { navigate: (path: string) => void }) {
  const links = {
    Marketplace: [
      { label: 'Browse Equipment', href: '/browse' },
      { label: 'For Sale', href: '/browse?type=sale' },
      { label: 'For Rent', href: '/browse?type=rent' },
      { label: 'Spare Parts', href: '/parts' },
    ],
    Services: [
      { label: 'Hire Operators', href: '/operators' },
      { label: 'Find Mechanics', href: '/mechanics' },
      { label: 'Equipment Finance', href: '/loan-eligibility' },
      { label: 'Inspections', href: '/certifications' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/jobs' },
      { label: 'Terms', href: '/terms' },
      { label: 'Market Insights', href: '/market-insights' },
    ],
  };

  return (
    <footer className="bg-[#0D0F10] border-t border-white/[0.06] pt-16 pb-8">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <p className="text-white text-xl font-extrabold mb-3" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em' }}>
              YantraSetu
            </p>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              India's verified heavy equipment marketplace. Buy, sell, rent, hire — all on one platform.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <MapPin size={13} className="text-[#FF6A00]" />
              <span className="text-white/30 text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>PAN-INDIA · 18+ STATES</span>
            </div>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em] mb-4"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{group}</p>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.href}>
                    <button
                      onClick={() => navigate(item.href)}
                      className="text-sm text-white/40 hover:text-white transition-colors"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            © 2025 YantraSetu Technologies Pvt. Ltd.
          </p>
          <p className="text-white/20 text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            GSTIN: 29AABCY1234F1ZS
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Root App component ──────────────────────────────────────── */
export default function App() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useUtmTracker();
  useSEO({
    title: "India's Machinery Market. Bridged. — YantraSetu",
    description: "Buy, sell, and rent verified excavators, cranes, loaders, and trucks on India's largest heavy equipment marketplace. AI-powered pricing, trusted sellers, pan-India delivery.",
  });

  return (
    <div className="relative">
      <Navbar />

      {/* Remove top spacer — hero fills full screen */}
      <div className="-mt-16">
        <HeroSection isAuthenticated={isAuthenticated} navigate={navigate} />
      </div>

      <div className="overflow-x-hidden">
        <PriceTicker />
        <CategorySection navigate={navigate} />
        <HowItWorksSection />
        <FeaturedSection navigate={navigate} />
        <StatsSection />
        <ServicesSection navigate={navigate} />
        <TestimonialSection />
        <FinancingSection navigate={navigate} />
        <FinalCTA isAuthenticated={isAuthenticated} navigate={navigate} />
      </div>
      <SiteFooter navigate={navigate} />
    </div>
  );
}
