import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, Bell, Heart, User, ArrowRight, LogOut, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SearchOverlay from './SearchOverlay';

/* ── Navigation structure ── */
const NAV_ITEMS = [
  {
    label: 'Equipment',
    sections: [
      {
        title: 'Browse',
        links: [
          { label: 'All Equipment', href: '/browse', desc: 'Buy or rent machinery' },
          { label: 'For Sale', href: '/browse?type=sale', desc: 'Outright purchase' },
          { label: 'For Rent', href: '/browse?type=rent', desc: 'Daily, weekly, monthly' },
          { label: 'Spare Parts', href: '/parts', desc: 'Genuine & aftermarket' },
        ],
      },
      {
        title: 'Categories',
        links: [
          { label: 'Construction', href: '/browse?category=construction' },
          { label: 'Concrete', href: '/browse?category=concrete' },
          { label: 'Foundation', href: '/browse?category=foundation' },
          { label: 'Mining', href: '/browse?category=mining' },
          { label: 'Agriculture', href: '/browse?category=agriculture' },
          { label: 'Industrial', href: '/browse?category=industrial' },
        ],
      },
    ],
  },
  {
    label: 'Services',
    sections: [
      {
        title: 'Hire',
        links: [
          { label: 'Operators', href: '/operators', desc: 'Certified equipment operators' },
          { label: 'Mechanics', href: '/mechanics', desc: 'On-site repair & maintenance' },
          { label: 'Contact Specialist', href: '/contact-specialist', desc: 'Expert guidance' },
        ],
      },
      {
        title: 'Solutions',
        links: [
          { label: 'Fleet Optimizer', href: '/fleet-optimizer', desc: 'AI-powered fleet matching' },
          { label: 'Inspections', href: '/certifications', desc: 'Equipment certification' },
          { label: 'All Services', href: '/services', desc: 'Full platform overview' },
        ],
      },
    ],
  },
  {
    label: 'Finance',
    sections: [
      {
        title: 'Tools',
        links: [
          { label: 'Loan Eligibility', href: '/loan-eligibility', desc: 'Check in 2 minutes' },
          { label: 'Market Insights', href: '/market-insights', desc: 'Real-time pricing data' },
          { label: 'Plans & Pricing', href: '/subscriptions', desc: 'Upgrade your account' },
        ],
      },
    ],
  },
  {
    label: 'Company',
    sections: [
      {
        title: 'About',
        links: [
          { label: 'Why YantraSetu', href: '/why', desc: 'Our story & mission' },
          { label: 'About Us', href: '/about' },
          { label: 'Job Board', href: '/jobs' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Inspection Standards', href: '/inspection-standards' },
        ],
      },
    ],
  },
];

/* ── Framer variants ── */
const dropdownVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.8 },
  },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } },
};

const mobileMenuVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 34 } },
  exit: { x: '100%', transition: { duration: 0.22 } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const linkStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const linkItem = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(() => {
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
    return match ? match[1].toUpperCase() : 'EN';
  });

  const handleLanguageChange = (code: string) => {
    setActiveLang(code);
    setLangOpen(false);
    setMobileOpen(false);
    
    if (code === 'EN') {
      // Must clear cookie and reload to completely restore original React DOM for English
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      window.location.reload();
      return;
    }

    // Find Google Translate Dropdown
    const gtSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (gtSelect) {
      gtSelect.value = code.toLowerCase();
      gtSelect.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Fallback if widget hasn't loaded yet
      const val = `/en/${code.toLowerCase()}`;
      document.cookie = `googtrans=${val}; path=/;`;
      if (window.location.hostname !== 'localhost') {
        document.cookie = `googtrans=${val}; path=/; domain=${window.location.hostname};`;
      }
      setTimeout(() => window.location.reload(), 100);
    }
  };
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setProfileOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setOpenDropdown(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleDropdownEnter = useCallback((idx: number) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(idx);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 160);
  }, []);

  const isHomePage = location.pathname === '/';

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
        style={{
          background: scrolled || !isHomePage ? 'rgba(16, 18, 20, 0.97)' : 'transparent',
          backdropFilter: scrolled || !isHomePage ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled || !isHomePage ? 'blur(16px)' : 'none',
          borderBottom: scrolled || !isHomePage ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6A00] to-[#e55f00] flex items-center justify-center shadow-[0_0_15px_rgba(255,106,0,0.3)] group-hover:shadow-[0_0_20px_rgba(255,106,0,0.5)] transition-shadow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10h3v4H3z"/><path d="M6 10h12v4"/><path d="M18 10h3v4h-3z"/><path d="M8 14v4"/><path d="M16 14v4"/><path d="M12 4v6"/><path d="M8 4h8"/>
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white transition-colors" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.03em' }}>
                Yantra<span className="text-[#FF6A00]">Setu</span>
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden lg:flex items-center gap-1 ml-10">
              {NAV_ITEMS.map((item, idx) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(idx)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all rounded-md"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      color: openDropdown === idx ? '#FF6A00' : 'rgba(255,255,255,0.75)',
                      opacity: openDropdown !== null && openDropdown !== idx ? 0.4 : 1,
                    }}
                  >
                    {item.label}
                    <motion.span
                      animate={{ rotate: openDropdown === idx ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex' }}
                    >
                      <ChevronDown size={13} />
                    </motion.span>
                  </button>

                  {/* ── Animated Dropdown Panel ── */}
                  <AnimatePresence>
                    {openDropdown === idx && (
                      <motion.div
                        key="dropdown"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-0 mt-1 bg-[#1A1D20] shadow-2xl rounded-xl overflow-hidden"
                        style={{
                          border: '1px solid rgba(255,255,255,0.08)',
                          minWidth: item.sections.length > 1 ? '480px' : '280px',
                          transformOrigin: 'top left',
                        }}
                        onMouseEnter={() => handleDropdownEnter(idx)}
                        onMouseLeave={handleDropdownLeave}
                      >
                        <div className={`grid gap-0 ${item.sections.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {item.sections.map((section, sIdx) => (
                            <div
                              key={section.title}
                              className="p-5"
                              style={{
                                borderRight: sIdx < item.sections.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                              }}
                            >
                              <p
                                className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3"
                                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                              >
                                {section.title}
                              </p>
                              <div className="space-y-0.5">
                                {section.links.map((link) => (
                                  <Link
                                    key={link.href}
                                    to={link.href}
                                    className="group flex items-start gap-2 px-2 py-2 -mx-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                                    onClick={() => setOpenDropdown(null)}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-white/80 group-hover:text-[#FF6A00] transition-colors" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                                        {link.label}
                                      </p>
                                      {link.desc && (
                                        <p className="text-[11px] text-white/30 mt-0.5 leading-snug">{link.desc}</p>
                                      )}
                                    </div>
                                    <ArrowRight size={12} className="mt-1 text-white/20 opacity-0 group-hover:opacity-100 group-hover:text-[#FF6A00] transition-all" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* ── Right Side Actions ── */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-white/50 hover:text-[#FF6A00] transition-colors rounded-lg hover:bg-white/[0.06]"
                title="Search (Ctrl+K)"
              >
                <Search size={18} />
              </button>

              {isAuthenticated ? (
                <>
                  <Link to="/saved" className="hidden sm:flex p-2 text-white/50 hover:text-[#FF6A00] transition-colors rounded-lg hover:bg-white/[0.06]" title="Saved">
                    <Heart size={18} />
                  </Link>
                  <Link to="/notifications" className="hidden sm:flex p-2 text-white/50 hover:text-[#FF6A00] transition-colors rounded-lg hover:bg-white/[0.06]" title="Notifications">
                    <Bell size={18} />
                  </Link>

                  {/* Profile dropdown */}
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {user?.firstName?.[0] || 'U'}
                      </div>
                      <motion.span
                        animate={{ rotate: profileOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex' }}
                      >
                        <ChevronDown size={12} />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          key="profile"
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute top-full right-0 mt-1 w-52 bg-[#1A1D20] shadow-2xl rounded-xl overflow-hidden"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', transformOrigin: 'top right' }}
                        >
                          <div className="px-4 py-3 border-b border-white/[0.06]">
                            <p className="text-sm font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{user?.firstName} {user?.lastName}</p>
                            <p className="text-[10px] text-white/30 mt-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{user?.phone}</p>
                          </div>
                          {[
                            { to: '/dashboard', label: 'Dashboard' },
                            { to: '/my-listings', label: 'My Listings' },
                            { to: '/bookings', label: 'Bookings' },
                            { to: '/profile', label: 'Profile' },
                          ].map(item => (
                            <Link
                              key={item.to}
                              to={item.to}
                              className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}
                              onClick={() => setProfileOpen(false)}
                            >
                              {item.label}
                            </Link>
                          ))}
                          {user?.userType === 'admin' && (
                            <Link to="/admin" className="block px-4 py-2.5 text-sm text-[#FF6A00] hover:bg-white/[0.05] transition-colors" onClick={() => setProfileOpen(false)}>Admin Panel</Link>
                          )}
                          <button
                            onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/[0.06] flex items-center gap-2"
                          >
                            <LogOut size={14} /> Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  <User size={16} /> Sign In
                </Link>
              )}

              {/* Premium Language Dropdown */}
              <div className="relative hidden md:block ml-2 mr-2">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
                  title="Change Language"
                >
                  <Globe size={16} />
                  <span className="text-xs font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>{activeLang}</span>
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      key="langMenu"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute top-full right-0 mt-1 w-40 bg-[#1A1D20] shadow-2xl rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', transformOrigin: 'top right' }}
                    >
                      <div className="px-3 py-2 border-b border-white/[0.06]">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Select Language</p>
                      </div>
                      {[
                        { code: 'EN', name: 'English' },
                        { code: 'HI', name: 'हिंदी (Hindi)' },
                        { code: 'MR', name: 'मराठी (Marathi)' },
                        { code: 'KN', name: 'ಕನ್ನಡ (Kannada)' },
                        { code: 'TA', name: 'தமிழ் (Tamil)' },
                      ].map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center justify-between"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          {lang.name}
                          {activeLang === lang.code && <span className="text-[#FF6A00] text-xs">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to={isAuthenticated ? '/sell' : '/login'}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FF6A00] border border-[#FF6A00]/30 hover:bg-[#FF6A00]/10 transition-colors rounded-md ml-1"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                List Equipment
              </Link>

              <button
                className="lg:hidden p-2 text-white/70 rounded-lg hover:bg-white/[0.06] transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                      <X size={22} />
                    </motion.span>
                  ) : (
                    <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
                      <Menu size={22} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Animated Mobile Slide Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[99] lg:hidden">
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Slide Panel */}
            <motion.div
              key="panel"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-0 right-0 w-[85vw] max-w-[360px] h-full bg-[#141618] overflow-y-auto"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <span className="text-lg font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Menu</span>
                <div className="flex items-center gap-3">
                  <select
                    className="bg-transparent text-white/70 text-xs font-medium focus:outline-none cursor-pointer"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                    value={activeLang}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option className="bg-[#1A1D20]" value="EN">EN</option>
                    <option className="bg-[#1A1D20]" value="HI">HI</option>
                    <option className="bg-[#1A1D20]" value="MR">MR</option>
                    <option className="bg-[#1A1D20]" value="KN">KN</option>
                    <option className="bg-[#1A1D20]" value="TA">TA</option>
                  </select>
                  <button onClick={() => setMobileOpen(false)} className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {isAuthenticated && user && (
                <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {user.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>{user.firstName} {user.lastName}</p>
                      <div className="flex gap-2 mt-0.5">
                        <Link to="/dashboard" className="text-xs text-[#FF6A00] font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                        <span className="text-white/20">·</span>
                        <Link to="/profile" className="text-xs text-white/40" onClick={() => setMobileOpen(false)}>Profile</Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <motion.div
                className="px-5 py-4 space-y-6"
                variants={linkStagger}
                initial="hidden"
                animate="visible"
              >
                {NAV_ITEMS.map((item) => (
                  <motion.div key={item.label} variants={linkItem}>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {item.label}
                    </p>
                    {item.sections.map((section) => (
                      <div key={section.title} className="mb-3">
                        {section.links.map((link) => (
                          <Link
                            key={link.href}
                            to={link.href}
                            className="block py-2.5 text-sm font-medium text-white/70 hover:text-[#FF6A00] transition-colors"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                            onClick={() => setMobileOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                ))}

                <motion.div variants={linkItem} className="pt-4 border-t border-white/[0.06] space-y-3">
                  <Link
                    to={isAuthenticated ? '/sell' : '/login'}
                    className="block w-full text-center py-3 text-sm font-bold text-white bg-[#FF6A00] hover:bg-[#e55f00] transition-colors rounded-xl"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    List Equipment
                  </Link>
                  {!isAuthenticated && (
                    <Link
                      to="/login"
                      className="block w-full text-center py-3 text-sm font-bold text-white/70 border border-white/10 rounded-xl hover:bg-white/[0.04] transition-colors"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                  {isAuthenticated && (
                    <button
                      onClick={() => { logout(); setMobileOpen(false); navigate('/'); }}
                      className="w-full text-center py-3 text-sm font-medium text-red-400 border border-red-400/20 rounded-xl hover:bg-red-500/10 transition-colors"
                    >
                      Sign Out
                    </button>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Search Overlay ── */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Spacer ── */}
      <div className="h-16" />
    </>
  );
}
