import { useEffect, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Search, Menu, X, Plus, User, LogIn, ArrowRight, Truck as TruckIcon, Clock, Wrench,
  Home, ShoppingBag, CalendarDays, Bell, Heart, LayoutDashboard
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { apiClient, notificationsApi } from './services/api';
import { useUtmTracker } from './hooks/useUtmTracker';
import { useSEO } from './hooks/useSEO';
import SearchOverlay from './components/SearchOverlay';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // UTM campaign tracking (captures utm_source etc. from URL)
  useUtmTracker();

  // Homepage SEO meta tags
  useSEO({
    title: "India's Heavy Equipment Marketplace",
    description: 'Buy, sell, and rent verified excavators, cranes, loaders, and trucks on India\'s largest heavy equipment marketplace.',
  });

  // Poll unread notification count
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCount = () => notificationsApi.getUnreadCount().then(d => setUnreadCount(d.count)).catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  
  // Section refs
  const heroRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const valuePropsRef = useRef<HTMLDivElement>(null);
  const testimonialRef = useRef<HTMLDivElement>(null);
  const safetyRef = useRef<HTMLDivElement>(null);
  const financingRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Navigation scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if mobile
  const isMobile = useCallback(() => window.innerWidth <= 768, []);

  // Hero entrance animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({ delay: 0.1 });
      
      heroTl
        .fromTo('.hero-image', 
          { x: '-40vw', opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
        )
        .fromTo('.hero-content', 
          { x: '6vw', opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 
          '-=0.35'
        )
        .fromTo('.hero-headline-word', 
          { y: 20, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out' }, 
          '-=0.3'
        )
        .fromTo('.hero-cta', 
          { scale: 0.95, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out' }, 
          '-=0.15'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Responsive Animations via gsap.matchMedia
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(max-width: 768px)", () => {
      // Mobile: simple fade-in-on-scroll for all sections
      const mobileFadeSelectors = [
        '.hero-image', '.hero-content',
        '.cat-tile-top-left', '.cat-tile-top-right', '.cat-tile-bottom-center', '.cat-text-tile',
        '.hiw-image', '.hiw-heading', '.hiw-card',
        '.featured-panel',
        '.vp-image', '.vp-card',
        '.safety-image', '.safety-heading', '.safety-item',
        '.fin-image', '.fin-panel', '.fin-content',
        '.testimonial-content', '.network-heading', '.stat-item',
        '.footer-left', '.footer-right',
      ];

      mobileFadeSelectors.forEach((sel) => {
        gsap.fromTo(sel,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.5, stagger: 0.08,
            scrollTrigger: {
              trigger: sel,
              start: 'top 92%',
              toggleActions: 'play none none none',
            }
          }
        );
      });
    });

    mm.add("(min-width: 769px)", () => {
      // Desktop: pinned scrub animations with faster exits
      
      // Hero scroll animation
      const heroScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.4,
        }
      });

      heroScrollTl
        .fromTo('.hero-headline-word', 
          { x: 0, opacity: 1 }, 
          { x: '12vw', opacity: 0, ease: 'power2.in' }, 
          0.85
        )
        .fromTo('.hero-cta', 
          { y: 0, opacity: 1 }, 
          { y: '6vh', opacity: 0, ease: 'power2.in' }, 
          0.85
        )
        .fromTo('.hero-image', 
          { x: 0, scale: 1, opacity: 1 }, 
          { x: '-12vw', scale: 1.02, opacity: 0.4, ease: 'power2.in' }, 
          0.85
        );

      // Category Mosaic scroll animation
      const categoryScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: categoryRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.4,
        }
      });

      categoryScrollTl
        .fromTo('.cat-tile-top-left', 
          { x: '-35vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.cat-tile-top-right', 
          { x: '35vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.cat-tile-bottom-center', 
          { y: '30vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' }, 
          0.05
        )
        .fromTo('.cat-text-tile', 
          { y: '-8vh', opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.03, ease: 'none' }, 
          0.05
        )
        .to('.cat-tile-top-left', 
          { y: '-10vh', opacity: 0, ease: 'power2.in' }, 
          0.85
        )
        .to('.cat-tile-top-right', 
          { y: '-10vh', opacity: 0, ease: 'power2.in' }, 
          0.85
        )
        .to('.cat-tile-bottom-center', 
          { y: '10vh', opacity: 0, ease: 'power2.in' }, 
          0.85
        )
        .to('.cat-text-tile', 
          { y: '10vh', opacity: 0, stagger: 0.02, ease: 'power2.in' }, 
          0.85
        );

      // How It Works scroll animation
      const howItWorksScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.4,
        }
      });

      howItWorksScrollTl
        .fromTo('.hiw-image', 
          { x: '-40vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.hiw-heading', 
          { x: '8vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0.05
        )
        .fromTo('.hiw-card', 
          { x: '15vw', opacity: 0 }, 
          { x: 0, opacity: 1, stagger: 0.04, ease: 'none' }, 
          0.1
        )
        .to('.hiw-card', 
          { x: '-6vw', opacity: 0, stagger: 0.02, ease: 'power2.in' }, 
          0.85
        )
        .to('.hiw-image', 
          { scale: 1.03, opacity: 0.4, ease: 'power2.in' }, 
          0.85
        );

      // Featured Listings scroll animation
      const featuredScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: featuredRef.current,
          start: 'top top',
          end: '+=110%', // Small buffer for exit
          pin: true,
          scrub: 0.4,
        }
      });

      featuredScrollTl
        .fromTo('.featured-panel', 
          { y: '60vh', opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.05, ease: 'none' }, 
          0
        )
        .fromTo('.featured-badge', 
          { scale: 0.9, opacity: 0 }, 
          { scale: 1, opacity: 1, stagger: 0.05, ease: 'none' }, 
          0.2
        )
        .to('.featured-panel-left', 
          { x: '-6vw', opacity: 0, ease: 'power2.in' }, 
          0.85
        )
        .to('.featured-panel-center', 
          { y: '-5vh', opacity: 0, ease: 'power2.in' }, 
          0.85
        )
        .to('.featured-panel-right', 
          { x: '6vw', opacity: 0, ease: 'power2.in' }, 
          0.85
        );

      // Value Props scroll animation
      const valuePropsScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: valuePropsRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.4,
        }
      });

      valuePropsScrollTl
        .fromTo('.vp-image', 
          { x: '-40vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.vp-card', 
          { x: '15vw', opacity: 0 }, 
          { x: 0, opacity: 1, stagger: 0.04, ease: 'none' }, 
          0.1
        )
        .to('.vp-card', 
          { y: '-6vh', opacity: 0, stagger: 0.02, ease: 'power2.in' }, 
          0.85
        )
        .to('.vp-image', 
          { opacity: 0.4, ease: 'power2.in' }, 
          0.85
        );

      // Safety scroll animation
      const safetyScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: safetyRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.4,
        }
      });

      safetyScrollTl
        .fromTo('.safety-image', 
          { x: '-40vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.safety-heading', 
          { x: '8vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0.05
        )
        .fromTo('.safety-item', 
          { x: '12vw', opacity: 0 }, 
          { x: 0, opacity: 1, stagger: 0.03, ease: 'none' }, 
          0.1
        )
        .to('.safety-item', 
          { x: '-5vw', opacity: 0, stagger: 0.02, ease: 'power2.in' }, 
          0.85
        )
        .to('.safety-image', 
          { scale: 1.03, opacity: 0.4, ease: 'power2.in' }, 
          0.85
        );

      // Financing scroll animation
      const financingScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: financingRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.4,
        }
      });

      financingScrollTl
        .fromTo('.fin-image', 
          { x: '-40vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.fin-panel', 
          { x: '15vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0.05
        )
        .fromTo('.fin-content', 
          { y: '12vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' }, 
          0.1
        )
        .fromTo('.fin-cta', 
          { scale: 0.95, opacity: 0 }, 
          { scale: 1, opacity: 1, ease: 'none' }, 
          0.2
        )
        .to('.fin-content', 
          { y: '-6vh', opacity: 0, ease: 'power2.in' }, 
          0.85
        )
        .to('.fin-panel', 
          { opacity: 0.5, ease: 'power2.in' }, 
          0.85
        );

      // Staggered reveal for non-pinned sections
      gsap.fromTo('.testimonial-content',
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6,
          scrollTrigger: {
            trigger: testimonialRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );

      gsap.fromTo('.network-heading, .stat-item',
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.05,
          scrollTrigger: {
            trigger: networkRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );

      gsap.fromTo('.footer-left, .footer-right',
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, stagger: 0.1,
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 95%',
            toggleActions: 'play none none none',
          }
        }
      );
    });

    return () => {
      mm.revert();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [heroRef, categoryRef, howItWorksRef, featuredRef, valuePropsRef, testimonialRef, safetyRef, financingRef, networkRef, footerRef]);

  // Global snap for pinned sections — desktop only
  useEffect(() => {
    if (isMobile()) return;

    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(r => value >= r.start - 0.02 && value <= r.end + 0.02);
            if (!inPinned) return value;

            const target = pinnedRanges.reduce((closest, r) =>
              Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
            return target;
          },
          duration: { min: 0.12, max: 0.25 },
          delay: 0,
          ease: 'power2.out',
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* Grain overlay */}
      <div className="grain-overlay" />
      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Navigation */}
      <nav className={`nav-fixed ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">YantraSetu</div>
        
        <div className="nav-links hidden md:flex">
          <a onClick={() => navigate('/browse?type=sale')} style={{ cursor: 'pointer' }}>Buy</a>
          <a onClick={() => navigate('/browse?type=rent')} style={{ cursor: 'pointer' }}>Rent</a>
          <a onClick={() => navigate(isAuthenticated ? '/sell' : '/login')} style={{ cursor: 'pointer' }}>Sell</a>
          <a onClick={() => navigate('/parts')} style={{ cursor: 'pointer' }}>Parts</a>
          <a onClick={() => navigate('/operators')} style={{ cursor: 'pointer' }}>Services</a>
          <a onClick={() => navigate('/subscriptions')} style={{ cursor: 'pointer' }}>Plans</a>
        </div>

        <div className="nav-actions">
          <button className="p-2 hover:text-[#FF6A00] transition-colors" onClick={() => setSearchOpen(true)}>
            <Search size={20} />
          </button>
          {/* Notification bell */}
          {isAuthenticated && (
            <button
              className="p-2 hover:text-[#FF6A00] transition-colors hidden sm:block relative"
              onClick={() => navigate('/notifications')}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF6A00] text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          {/* Saved listings */}
          {isAuthenticated && (
            <button
              className="p-2 hover:text-[#FF6A00] transition-colors hidden sm:block"
              onClick={() => navigate('/saved')}
              title="Saved Listings"
            >
              <Heart size={20} />
            </button>
          )}
          <button 
            className="p-2 hover:text-[#FF6A00] transition-colors hidden sm:block"
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
            title={isAuthenticated ? `${user?.firstName}'s profile` : 'Sign in'}
          >
            {isAuthenticated ? <User size={20} /> : <LogIn size={20} />}
          </button>
          <button 
            className="btn-primary btn-small hidden sm:flex items-center gap-2"
            onClick={() => navigate(isAuthenticated ? '/sell' : '/login')}
          >
            <Plus size={16} />
            Post a Listing
          </button>
          <button 
            className="p-2 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu — rendered via Portal to avoid GSAP DOM conflicts */}
      {createPortal(
        <div 
          className={`fixed inset-0 bg-[#E9E3DA] z-[9999] pt-24 px-6 md:hidden mobile-menu-overlay ${
            mobileMenuOpen ? 'mobile-menu-open' : 'mobile-menu-closed'
          }`}
          style={{ 
            opacity: mobileMenuOpen ? 1 : 0, 
            pointerEvents: mobileMenuOpen ? 'auto' : 'none',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          }}
        >
          <button 
            className="absolute top-6 right-6 p-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
          <div className="flex flex-col gap-6">
            <a className="text-2xl font-bold" style={{ cursor: 'pointer', fontFamily: 'Sora, sans-serif' }} onClick={() => { setMobileMenuOpen(false); navigate('/browse?type=sale'); }}>Buy</a>
            <a className="text-2xl font-bold" style={{ cursor: 'pointer', fontFamily: 'Sora, sans-serif' }} onClick={() => { setMobileMenuOpen(false); navigate('/browse?type=rent'); }}>Rent</a>
            <a className="text-2xl font-bold" style={{ cursor: 'pointer', fontFamily: 'Sora, sans-serif' }} onClick={() => { setMobileMenuOpen(false); navigate(isAuthenticated ? '/sell' : '/login'); }}>Sell</a>
            <a className="text-2xl font-bold" style={{ cursor: 'pointer', fontFamily: 'Sora, sans-serif' }} onClick={() => { setMobileMenuOpen(false); navigate('/parts'); }}>Parts</a>
            <a className="text-2xl font-bold" style={{ cursor: 'pointer', fontFamily: 'Sora, sans-serif' }} onClick={() => { setMobileMenuOpen(false); navigate('/operators'); }}>Services</a>
            <a className="text-2xl font-bold" style={{ cursor: 'pointer', fontFamily: 'Sora, sans-serif' }} onClick={() => { setMobileMenuOpen(false); navigate('/subscriptions'); }}>Plans</a>
            <button 
              className="btn-primary flex items-center justify-center gap-2 mt-4"
              onClick={() => { setMobileMenuOpen(false); navigate(isAuthenticated ? '/sell' : '/login'); }}
            >
              <Plus size={18} />
              Post a Listing
            </button>
            {isAuthenticated && (
              <>
                <button
                  className="btn-secondary flex items-center justify-center gap-2"
                  onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                >
                  <LayoutDashboard size={18} /> Dashboard
                </button>
                <button
                  className="btn-secondary flex items-center justify-center gap-2"
                  onClick={() => { setMobileMenuOpen(false); navigate('/notifications'); }}
                >
                  <Bell size={18} /> Notifications {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  className="btn-secondary flex items-center justify-center gap-2"
                  onClick={() => { setMobileMenuOpen(false); navigate('/saved'); }}
                >
                  <Heart size={18} /> Saved Listings
                </button>
              </>
            )}
            <button
              className="btn-secondary flex items-center justify-center gap-2"
              onClick={() => { setMobileMenuOpen(false); navigate(isAuthenticated ? '/profile' : '/login'); }}
            >
              <User size={18} />
              {isAuthenticated ? 'My Profile' : 'Sign In'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Section 1: Hero */}
      <section ref={heroRef} className="pinned-section z-10">
        <div className="hero-image absolute left-0 top-0 w-full md:w-[52vw] h-full">
          <img 
            src="/images/hero_excavator.jpg" 
            alt="Heavy machinery" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06]" />
        </div>
        
        <div className="hero-content absolute right-0 top-0 w-full md:w-[48vw] h-full bg-[#E9E3DA] flex flex-col justify-center px-8 md:px-[4vw]">
          <div className="max-w-[500px]">
            <h1 className="hero-headline mb-6">
              <span className="hero-headline-word block">India's Heavy</span>
              <span className="hero-headline-word block">Equipment</span>
              <span className="hero-headline-word block">Marketplace.</span>
            </h1>
            
            <p className="text-[#6F757C] text-base md:text-lg mb-8 leading-relaxed">
              Buy, sell, and rent verified excavators, cranes, loaders, and trucks—inspected, documented, and ready to work.
            </p>

            <div className="flex flex-col gap-4 mb-10">
              <button className="hero-cta btn-primary flex items-center justify-center gap-2" onClick={() => navigate('/browse?type=sale')}>
                Browse Machines for Sale
                <ArrowRight size={18} />
              </button>
              <button className="hero-cta btn-secondary" onClick={() => navigate('/browse?type=rent')}>
                Rent Equipment by the Month
              </button>
            </div>

            <p className="mono text-[#6F757C] mb-4">
              INSPECTED LISTINGS • NATIONWIDE DELIVERY
            </p>

            <button onClick={() => { const el = document.getElementById('categories'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="link-arrow">
              Explore categories
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Category Mosaic */}
      <section ref={categoryRef} id="categories" className="pinned-section z-20 bg-[#E9E3DA]">
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-3 grid-rows-2">
          {/* Top Left - Excavators */}
          <div className="cat-tile-top-left relative h-[50vh] md:h-auto">
            <img 
              src="/images/category_excavators.jpg" 
              alt="Excavators" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06]" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="font-bold text-lg">Excavators</p>
            </div>
          </div>

          {/* Top Center - Text */}
          <div className="cat-text-tile bg-[#E9E3DA] p-6 md:p-8 flex flex-col justify-center h-[40vh] md:h-auto border-2 border-[rgba(16,18,20,0.08)]">
            <h2 className="section-heading mb-4">Shop by Category</h2>
            <p className="text-[#6F757C] mb-6 text-sm md:text-base">
              From earthmoving to lifting to transport—find machines that match your scope and site.
            </p>
            <a href="/browse" onClick={(e) => { e.preventDefault(); navigate('/browse'); }} className="link-arrow text-sm">
              See all categories
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Top Right - Dumpers */}
          <div className="cat-tile-top-right relative h-[50vh] md:h-auto">
            <img 
              src="/images/category_dumpers.jpg" 
              alt="Dumpers" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06]" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="font-bold text-lg">Dumpers</p>
            </div>
          </div>

          {/* Bottom Left - Rentals Text */}
          <div className="cat-text-tile bg-[#101214] text-white p-6 md:p-8 flex flex-col justify-center h-[40vh] md:h-auto">
            <h3 className="text-xl md:text-2xl font-bold mb-3">Rentals</h3>
            <p className="text-gray-400 mb-4 text-sm md:text-base">
              Short-term or long-term. Flexible rates with operator options.
            </p>
            <a href="/browse?type=rent" onClick={(e) => { e.preventDefault(); navigate('/browse?type=rent'); }} className="link-arrow text-white text-sm">
              View rental fleet
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Bottom Center - Cranes */}
          <div className="cat-tile-bottom-center relative h-[50vh] md:h-auto">
            <img 
              src="/images/category_cranes.jpg" 
              alt="Cranes" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06]" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="font-bold text-lg">Cranes</p>
            </div>
          </div>

          {/* Bottom Right - Sell Text */}
          <div className="cat-text-tile bg-[#E9E3DA] p-6 md:p-8 flex flex-col justify-center h-[40vh] md:h-auto border-2 border-[rgba(16,18,20,0.08)]">
            <h3 className="text-xl md:text-2xl font-bold mb-3">Sell Your Machine</h3>
            <p className="text-[#6F757C] mb-4 text-sm md:text-base">
              List in minutes. Get offers from contractors and dealers.
            </p>
            <a href="/sell" onClick={(e) => { e.preventDefault(); navigate(isAuthenticated ? '/sell' : '/login'); }} className="link-arrow text-sm">
              Start a listing
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section ref={howItWorksRef} className="pinned-section z-30 bg-[#E9E3DA]">
        <div className="hiw-image absolute left-0 top-0 w-full md:w-[50vw] h-full">
          <img 
            src="/images/howitworks_operator.jpg" 
            alt="Operator" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06]" />
        </div>

        <div className="absolute right-0 top-0 w-full md:w-[50vw] h-full bg-[#E9E3DA] flex flex-col justify-center px-8 md:px-[4vw]">
          <div className="max-w-[480px]">
            <h2 className="hiw-heading section-heading mb-8">How YantraSetu Works</h2>

            <div className="space-y-4">
              <div className="hiw-card value-card">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Search & Compare</h3>
                    <p className="text-[#6F757C] text-sm">Filter by make, hours, location, and budget.</p>
                  </div>
                </div>
              </div>

              <div className="hiw-card value-card">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Inspect & Verify</h3>
                    <p className="text-[#6F757C] text-sm">Every listing includes photos, documents, and an inspection report.</p>
                  </div>
                </div>
              </div>

              <div className="hiw-card value-card">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Close & Deliver</h3>
                    <p className="text-[#6F757C] text-sm">Negotiate directly. We handle paperwork and delivery coordination.</p>
                  </div>
                </div>
              </div>
            </div>

            <a href="/sample-report" onClick={(e) => { e.preventDefault(); navigate('/sample-report'); }} className="link-arrow mt-6 inline-flex">
              See a sample report
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Section 4: Featured Listings */}
      <section ref={featuredRef} id="buy" className="pinned-section z-40 bg-[#E9E3DA]">
        <div className="absolute inset-0 flex flex-col md:flex-row">
          {/* Panel A */}
          <div className="featured-panel featured-panel-left relative w-full md:w-[34vw] h-[33vh] md:h-full">
            <img 
              src="/images/featured_tata_hitachi.jpg" 
              alt="Tata Hitachi EX200" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="font-bold text-xl md:text-2xl">Tata Hitachi EX200</p>
            </div>
            <div className="featured-badge absolute bottom-6 right-6 price-badge">
              ₹42,00,000
            </div>
          </div>

          {/* Panel B */}
          <div className="featured-panel featured-panel-center relative w-full md:w-[32vw] h-[33vh] md:h-full">
            <img 
              src="/images/featured_ace_crane.jpg" 
              alt="ACE 14XW Tower Crane" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-6 right-6">
              <button onClick={() => navigate('/browse?sortBy=viewCount')} className="text-white text-sm font-medium flex items-center gap-2 hover:text-[#FF6A00] transition-colors">
                View all featured
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="absolute bottom-6 left-6 text-white">
              <p className="font-bold text-xl md:text-2xl">ACE 14XW Tower Crane</p>
            </div>
            <div className="featured-badge absolute bottom-6 right-6 price-badge">
              ₹28,50,000
            </div>
          </div>

          {/* Panel C */}
          <div className="featured-panel featured-panel-right relative w-full md:w-[34vw] h-[33vh] md:h-full">
            <img 
              src="/images/featured_hyundai.jpg" 
              alt="Hyundai R140" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="font-bold text-xl md:text-2xl">Hyundai R140</p>
            </div>
            <div className="featured-badge absolute bottom-6 right-6 price-badge">
              ₹38,00,000
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Value Props */}
      <section ref={valuePropsRef} className="pinned-section z-50 bg-[#E9E3DA]">
        <div className="vp-image absolute left-0 top-0 w-full md:w-[50vw] h-full">
          <img 
            src="/images/valueprops_machine.jpg" 
            alt="Machine detail" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06]" />
        </div>

        <div className="absolute right-0 top-0 w-full md:w-[50vw] h-full bg-[#E9E3DA] flex flex-col justify-center px-8 md:px-[4vw]">
          <div className="max-w-[480px]">
            <h2 className="section-heading mb-8">Built for Contractors. Backed by Inspection.</h2>

            <div className="space-y-4">
              <div className="vp-card value-card">
                <div className="flex items-start gap-4">
                  <TruckIcon className="text-[#FF6A00] shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Nationwide Delivery</h3>
                    <p className="text-[#6F757C] text-sm">Safe transport from any hub directly to your project site.</p>
                  </div>
                </div>
              </div>

              <div className="vp-card value-card">
                <div className="flex items-start gap-4">
                  <Clock className="text-[#FF6A00] shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Flexible Rentals</h3>
                    <p className="text-[#6F757C] text-sm">Daily, monthly, or long-term with operator options.</p>
                  </div>
                </div>
              </div>

              <div className="vp-card value-card">
                <div className="flex items-start gap-4">
                  <Wrench className="text-[#FF6A00] shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Service & Parts</h3>
                    <p className="text-[#6F757C] text-sm">Maintenance packages and genuine parts support.</p>
                  </div>
                </div>
              </div>
            </div>

            <a href="/contact-specialist" onClick={(e) => { e.preventDefault(); navigate('/contact-specialist'); }} className="link-arrow mt-6 inline-flex">
              Talk to a specialist
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Section 6: Testimonial */}
      <section ref={testimonialRef} className="relative z-[60] bg-[#E9E3DA] py-20 md:py-32">
        <div className="testimonial-content max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <span className="quote-mark absolute -top-8 -left-4">"</span>
              <blockquote className="text-xl md:text-2xl font-medium leading-relaxed mb-6 relative z-10">
                I needed three excavators on short notice. YantraSetu had inspected options with reports I could share with my PM. Closed in 48 hours.
              </blockquote>
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-bold">Arjun Mehta</p>
                  <p className="text-[#6F757C] text-sm">Site Manager — Bengaluru</p>
                </div>
              </div>
              <p className="text-[#6F757C] mt-6 text-sm">
                Contractors across India use YantraSetu to keep projects on schedule.
              </p>
            </div>
            <div className="relative h-[400px] md:h-[500px]">
              <img 
                src="/images/testimonial_portrait.jpg" 
                alt="Arjun Mehta" 
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06] rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Safety + Inspection */}
      <section ref={safetyRef} className="pinned-section z-[70] bg-[#E9E3DA]">
        <div className="safety-image absolute left-0 top-0 w-full md:w-[50vw] h-full">
          <img 
            src="/images/safety_quarry.jpg" 
            alt="Quarry safety" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06]" />
        </div>

        <div className="absolute right-0 top-0 w-full md:w-[50vw] h-full bg-[#E9E3DA] flex flex-col justify-center px-8 md:px-[4vw]">
          <div className="max-w-[480px]">
            <h2 className="safety-heading section-heading mb-8">Every Machine is Documented.</h2>

            <div className="space-y-4">
              <div className="safety-item flex items-start gap-4">
                <div className="w-3 h-3 bg-[#FF6A00] mt-2 shrink-0" />
                <p className="text-base md:text-lg">Physical inspection by a certified assessor</p>
              </div>
              <div className="safety-item flex items-start gap-4">
                <div className="w-3 h-3 bg-[#FF6A00] mt-2 shrink-0" />
                <p className="text-base md:text-lg">Engine, hydraulics, undercarriage, and cab checks</p>
              </div>
              <div className="safety-item flex items-start gap-4">
                <div className="w-3 h-3 bg-[#FF6A00] mt-2 shrink-0" />
                <p className="text-base md:text-lg">Ownership documents verified</p>
              </div>
              <div className="safety-item flex items-start gap-4">
                <div className="w-3 h-3 bg-[#FF6A00] mt-2 shrink-0" />
                <p className="text-base md:text-lg">History report where available</p>
              </div>
            </div>

            <a href="/inspection-standards" onClick={(e) => { e.preventDefault(); navigate('/inspection-standards'); }} className="link-arrow mt-8 inline-flex">
              Read our inspection standards
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Section 8: Financing CTA */}
      <section ref={financingRef} className="pinned-section z-[80]">
        <div className="fin-image absolute left-0 top-0 w-full md:w-[50vw] h-full">
          <img 
            src="/images/financing_machine.jpg" 
            alt="Machine financing" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#FF6A00] opacity-[0.06]" />
        </div>

        <div className="fin-panel absolute right-0 top-0 w-full md:w-[50vw] h-full bg-[#101214] flex flex-col justify-center px-8 md:px-[4vw]">
          <div className="fin-content max-w-[480px]">
            <h2 className="section-heading text-white mb-6">Get Financing in 24 Hours.</h2>
            <p className="text-gray-400 text-base md:text-lg mb-8">
              Partnered with India's leading equipment financiers. Competitive rates, minimal paperwork, fast approval.
            </p>

            <button className="fin-cta btn-primary mb-6" onClick={() => navigate('/loan-eligibility')}>
              Check Loan Eligibility
            </button>

            <button onClick={() => navigate('/loan-eligibility')} className="link-arrow text-white block">
              Download requirements checklist
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Section 9: Location + Service Network */}
      <section ref={networkRef} className="relative z-[90] bg-[#E9E3DA] py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="network-heading section-heading mb-12">Nationwide Network. Local Support.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="stat-item">
              <p className="stat-number mb-2">18+</p>
              <p className="font-bold text-lg mb-1">States</p>
              <p className="text-[#6F757C] text-sm">Active listings and delivery.</p>
            </div>
            <div className="stat-item">
              <p className="stat-number mb-2">40+</p>
              <p className="font-bold text-lg mb-1">Inspection Hubs</p>
              <p className="text-[#6F757C] text-sm">Verified assessments near you.</p>
            </div>
            <div className="stat-item">
              <p className="stat-number mb-2">24/7</p>
              <p className="font-bold text-lg mb-1">On-Call Support</p>
              <p className="text-[#6F757C] text-sm">Talk to a real person, fast.</p>
            </div>
          </div>

          <button onClick={() => { const el = document.getElementById('coverage'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="link-arrow">
            See coverage map
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Section 10: Coverage Map */}
      <section id="coverage" className="relative z-[90] bg-white py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="section-heading mb-6">Our Growing Footprint.</h2>
            <p className="text-[#6F757C] text-lg mb-8 leading-relaxed max-w-xl">
              From the mines of Jharkhand to the infrastructure projects of Mumbai, YantraSetu is bridging the gap. Our network of verified inspection hubs and delivery partners ensures you're never too far from your next machine.
            </p>
            <div className="space-y-6">
              {[
                { region: 'West', hubs: 'Mumbai, Pune, Ahmedabad, Nagpur', coverage: '95%' },
                { region: 'South', hubs: 'Bengaluru, Chennai, Hyderabad, Kochi', coverage: '88%' },
                { region: 'North', hubs: 'Delhi NCR, Lucknow, Jaipur, Chandigarh', coverage: '92%' },
                { region: 'East', hubs: 'Kolkata, Jamshedpur, Bhubaneswar, Guwahati', coverage: '75%' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-[#E9E3DA] pb-4 group hover:border-[#FF6A00] transition-colors cursor-default">
                  <div>
                    <h4 className="font-bold text-lg mb-1">{item.region} Hubs</h4>
                    <p className="text-sm text-[#6F757C]">{item.hubs}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[#FF6A00] font-bold text-xl">{item.coverage}</p>
                    <p className="text-[10px] text-[#6F757C] uppercase tracking-wider">Operational</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="relative aspect-square w-full bg-[#E9E3DA] rounded-2xl overflow-hidden border border-[#101214]/5 flex items-center justify-center p-8">
              {/* Map Placeholder Graphic */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FF6A00_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <img 
                  src="/images/coverage_map.png" 
                  alt="YantraSetu Coverage Map" 
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 11: Footer */}
      <footer ref={footerRef} className="footer relative z-[100] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Left Column */}
            <div className="footer-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">YantraSetu</h2>
              <p className="text-gray-400 mb-8">India's heavy equipment marketplace.</p>

              <p className="text-sm text-gray-400 mb-4">Get weekly inventory drops and rental deals.</p>
              <div className="flex flex-col sm:flex-row">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="footer-input"
                  value={newsletterEmail}
                  onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterMsg(''); }}
                />
                <button className="btn-primary rounded-l-none" onClick={async () => {
                  if (!newsletterEmail) return;
                  try {
                    await apiClient.post('/newsletter/subscribe', { email: newsletterEmail });
                    setNewsletterMsg('✓ Subscribed!');
                    setNewsletterEmail('');
                  } catch { setNewsletterMsg('Failed. Try again.'); }
                }}>Subscribe</button>
              </div>
              {newsletterMsg && <p className={`text-xs mt-2 ${newsletterMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{newsletterMsg}</p>}
            </div>

            {/* Right Column */}
            <div className="footer-right grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold mb-4">Buy</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/browse?type=sale" onClick={(e) => { e.preventDefault(); navigate('/browse?type=sale'); }} className="hover:text-white transition-colors">Browse Sales</a></li>
                  <li><a href="/browse?sortBy=viewCount" onClick={(e) => { e.preventDefault(); navigate('/browse?sortBy=viewCount'); }} className="hover:text-white transition-colors">Featured</a></li>
                  <li><a href="/parts" onClick={(e) => { e.preventDefault(); navigate('/parts'); }} className="hover:text-white transition-colors">Spare Parts</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Rent</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/browse?type=rent" onClick={(e) => { e.preventDefault(); navigate('/browse?type=rent'); }} className="hover:text-white transition-colors">Rental Fleet</a></li>
                  <li><a href="/bookings" onClick={(e) => { e.preventDefault(); navigate(isAuthenticated ? '/bookings' : '/login'); }} className="hover:text-white transition-colors">My Bookings</a></li>
                  <li><a href="/operators" onClick={(e) => { e.preventDefault(); navigate('/operators'); }} className="hover:text-white transition-colors">Hire Operators</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Services</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/sell" onClick={(e) => { e.preventDefault(); navigate(isAuthenticated ? '/sell' : '/login'); }} className="hover:text-white transition-colors">List a Machine</a></li>
                  <li><a href="/loan-eligibility" onClick={(e) => { e.preventDefault(); navigate('/loan-eligibility'); }} className="hover:text-white transition-colors">Loan Eligibility</a></li>
                  <li><a href="/mechanics" onClick={(e) => { e.preventDefault(); navigate('/mechanics'); }} className="hover:text-white transition-colors">Find Mechanics</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }} className="hover:text-white transition-colors">About & Contact</a></li>
                  <li><a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="hover:text-white transition-colors">Terms & Privacy</a></li>
                  <li><a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} className="hover:text-white transition-colors">Dealer Program</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2026 YantraSetu. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="/terms#privacy" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms#terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav md:hidden" aria-label="Mobile navigation">
        <button className="nav-item active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Home size={20} />
          <span>Home</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/browse?type=sale')}>
          <ShoppingBag size={20} />
          <span>Buy</span>
        </button>
        <button className="nav-item-post" onClick={() => navigate(isAuthenticated ? '/sell' : '/login')}>
          <div className="post-circle">
            <Plus size={24} color="white" strokeWidth={2.5} />
          </div>
        </button>
        <button className="nav-item" onClick={() => navigate('/browse?type=rent')}>
          <CalendarDays size={20} />
          <span>Rent</span>
        </button>
        <button className="nav-item" onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}>
          <User size={20} />
          <span>{isAuthenticated ? 'Profile' : 'Sign In'}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
