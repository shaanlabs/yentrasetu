import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Search, 
  User, 
  Plus, 
  ArrowRight, 
  Menu,
  X,
  Shield,
  Clock,
  Wrench
} from 'lucide-react';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // Hero entrance animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance animation
      const heroTl = gsap.timeline({ delay: 0.2 });
      
      heroTl
        .fromTo('.hero-image', 
          { x: '-60vw', opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
        )
        .fromTo('.hero-content', 
          { x: '8vw', opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }, 
          '-=0.5'
        )
        .fromTo('.hero-headline-word', 
          { y: 30, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, 
          '-=0.4'
        )
        .fromTo('.hero-cta', 
          { scale: 0.95, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, 
          '-=0.2'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Pinned sections scroll animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero scroll animation
      const heroScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            gsap.set('.hero-image, .hero-content, .hero-headline-word, .hero-cta', { 
              opacity: 1, x: 0, y: 0, scale: 1 
            });
          }
        }
      });

      heroScrollTl
        .fromTo('.hero-headline-word', 
          { x: 0, opacity: 1 }, 
          { x: '18vw', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .fromTo('.hero-cta', 
          { y: 0, opacity: 1 }, 
          { y: '10vh', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .fromTo('.hero-image', 
          { x: 0, scale: 1, opacity: 1 }, 
          { x: '-18vw', scale: 1.04, opacity: 0.35, ease: 'power2.in' }, 
          0.7
        );

      // Category Mosaic scroll animation
      const categoryScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: categoryRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      });

      categoryScrollTl
        .fromTo('.cat-tile-top-left', 
          { x: '-50vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.cat-tile-top-right', 
          { x: '50vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.cat-tile-bottom-center', 
          { y: '40vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' }, 
          0.05
        )
        .fromTo('.cat-text-tile', 
          { y: '-12vh', opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.03, ease: 'none' }, 
          0.05
        )
        .to('.cat-tile-top-left', 
          { y: '-18vh', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .to('.cat-tile-top-right', 
          { y: '-18vh', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .to('.cat-tile-bottom-center', 
          { y: '18vh', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .to('.cat-text-tile', 
          { y: '18vh', opacity: 0, stagger: 0.02, ease: 'power2.in' }, 
          0.7
        );

      // How It Works scroll animation
      const howItWorksScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: 'top top',
          end: '+=125%',
          pin: true,
          scrub: 0.6,
        }
      });

      howItWorksScrollTl
        .fromTo('.hiw-image', 
          { x: '-60vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.hiw-heading', 
          { x: '10vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0.05
        )
        .fromTo('.hiw-card', 
          { x: '20vw', opacity: 0 }, 
          { x: 0, opacity: 1, stagger: 0.04, ease: 'none' }, 
          0.1
        )
        .to('.hiw-card', 
          { x: '-10vw', opacity: 0, stagger: 0.02, ease: 'power2.in' }, 
          0.7
        )
        .to('.hiw-image', 
          { scale: 1.05, opacity: 0.35, ease: 'power2.in' }, 
          0.7
        );

      // Featured Listings scroll animation
      const featuredScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: featuredRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      });

      featuredScrollTl
        .fromTo('.featured-panel', 
          { y: '100vh', opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.05, ease: 'none' }, 
          0
        )
        .fromTo('.featured-badge', 
          { scale: 0.85, opacity: 0 }, 
          { scale: 1, opacity: 1, stagger: 0.05, ease: 'none' }, 
          0.2
        )
        .to('.featured-panel-left', 
          { x: '-10vw', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .to('.featured-panel-center', 
          { y: '-8vh', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .to('.featured-panel-right', 
          { x: '10vw', opacity: 0, ease: 'power2.in' }, 
          0.7
        );

      // Value Props scroll animation
      const valuePropsScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: valuePropsRef.current,
          start: 'top top',
          end: '+=125%',
          pin: true,
          scrub: 0.6,
        }
      });

      valuePropsScrollTl
        .fromTo('.vp-image', 
          { x: '-60vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.vp-card', 
          { x: '20vw', opacity: 0 }, 
          { x: 0, opacity: 1, stagger: 0.04, ease: 'none' }, 
          0.1
        )
        .to('.vp-card', 
          { y: '-10vh', opacity: 0, stagger: 0.02, ease: 'power2.in' }, 
          0.7
        )
        .to('.vp-image', 
          { opacity: 0.35, ease: 'power2.in' }, 
          0.7
        );

      // Safety scroll animation
      const safetyScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: safetyRef.current,
          start: 'top top',
          end: '+=125%',
          pin: true,
          scrub: 0.6,
        }
      });

      safetyScrollTl
        .fromTo('.safety-image', 
          { x: '-60vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.safety-heading', 
          { x: '10vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0.05
        )
        .fromTo('.safety-item', 
          { x: '16vw', opacity: 0 }, 
          { x: 0, opacity: 1, stagger: 0.03, ease: 'none' }, 
          0.1
        )
        .to('.safety-item', 
          { x: '-8vw', opacity: 0, stagger: 0.02, ease: 'power2.in' }, 
          0.7
        )
        .to('.safety-image', 
          { scale: 1.05, opacity: 0.35, ease: 'power2.in' }, 
          0.7
        );

      // Financing scroll animation
      const financingScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: financingRef.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.6,
        }
      });

      financingScrollTl
        .fromTo('.fin-image', 
          { x: '-60vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0
        )
        .fromTo('.fin-panel', 
          { x: '20vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' }, 
          0.05
        )
        .fromTo('.fin-content', 
          { y: '18vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' }, 
          0.1
        )
        .fromTo('.fin-cta', 
          { scale: 0.92, opacity: 0 }, 
          { scale: 1, opacity: 1, ease: 'none' }, 
          0.2
        )
        .to('.fin-content', 
          { y: '-10vh', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .to('.fin-panel', 
          { opacity: 0.4, ease: 'power2.in' }, 
          0.7
        );

      // Flowing sections animations
      gsap.fromTo('.testimonial-content',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: testimonialRef.current,
            start: 'top 75%',
            end: 'top 45%',
            scrub: true,
          }
        }
      );

      gsap.fromTo('.network-heading',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: networkRef.current,
            start: 'top 75%',
            end: 'top 55%',
            scrub: true,
          }
        }
      );

      gsap.fromTo('.stat-item',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: networkRef.current,
            start: 'top 65%',
            end: 'top 45%',
            scrub: true,
          }
        }
      );

      gsap.fromTo('.footer-left',
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 80%',
            end: 'top 60%',
            scrub: true,
          }
        }
      );

      gsap.fromTo('.footer-right',
        { x: 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 80%',
            end: 'top 60%',
            scrub: true,
          }
        }
      );

    });

    return () => ctx.revert();
  }, []);

  // Global snap for pinned sections
  useEffect(() => {
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
          duration: { min: 0.15, max: 0.35 },
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

      {/* Navigation */}
      <nav className={`nav-fixed ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">YantraSetu</div>
        
        <div className="nav-links hidden md:flex">
          <a href="#buy">Buy</a>
          <a href="#rent">Rent</a>
          <a href="#sell">Sell</a>
          <a href="#services">Services</a>
        </div>

        <div className="nav-actions">
          <button className="p-2 hover:text-[#FF6A00] transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 hover:text-[#FF6A00] transition-colors hidden sm:block">
            <User size={20} />
          </button>
          <button className="btn-primary btn-small hidden sm:flex items-center gap-2">
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#E9E3DA] z-[999] pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6">
            <a href="#buy" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>Buy</a>
            <a href="#rent" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>Rent</a>
            <a href="#sell" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>Sell</a>
            <a href="#services" className="text-2xl font-bold" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <button className="btn-primary flex items-center justify-center gap-2 mt-4">
              <Plus size={18} />
              Post a Listing
            </button>
          </div>
        </div>
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
              <button className="hero-cta btn-primary flex items-center justify-center gap-2">
                Browse Machines for Sale
                <ArrowRight size={18} />
              </button>
              <button className="hero-cta btn-secondary">
                Rent Equipment by the Month
              </button>
            </div>

            <p className="mono text-[#6F757C] mb-4">
              INSPECTED LISTINGS • NATIONWIDE DELIVERY
            </p>

            <a href="#categories" className="link-arrow">
              Explore categories
              <ArrowRight size={16} />
            </a>
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
            <a href="#all-categories" className="link-arrow text-sm">
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
            <a href="#rentals" className="link-arrow text-white text-sm">
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
            <a href="#sell" className="link-arrow text-sm">
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

            <a href="#sample-report" className="link-arrow mt-6 inline-flex">
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
              <a href="#featured" className="text-white text-sm font-medium flex items-center gap-2 hover:text-[#FF6A00] transition-colors">
                View all featured
                <ArrowRight size={14} />
              </a>
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
                  <Shield className="text-[#FF6A00] shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Verified Listings</h3>
                    <p className="text-[#6F757C] text-sm">Photos, documents, and inspection reports on every machine.</p>
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

            <a href="#specialist" className="link-arrow mt-6 inline-flex">
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

            <a href="#standards" className="link-arrow mt-8 inline-flex">
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

            <button className="fin-cta btn-primary mb-6">
              Check Loan Eligibility
            </button>

            <a href="#checklist" className="link-arrow text-white block">
              Download requirements checklist
              <ArrowRight size={16} />
            </a>
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

          <a href="#coverage" className="link-arrow">
            See coverage map
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Section 10: Footer */}
      <footer ref={footerRef} className="footer relative z-[100] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Left Column */}
            <div className="footer-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">YantraSetu</h2>
              <p className="text-gray-400 mb-8">India's heavy equipment marketplace.</p>

              <p className="text-sm text-gray-400 mb-4">Get weekly inventory drops and rental deals.</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="footer-input"
                />
                <button className="btn-primary rounded-l-none">Subscribe</button>
              </div>
            </div>

            {/* Right Column */}
            <div className="footer-right grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold mb-4">Buy</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Browse</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Featured</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Compare</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Rent</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Short-term</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Long-term</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">With Operator</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Sell</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">List a Machine</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Valuation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Dealer Program</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Inspection Standards</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Financing</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2026 YantraSetu. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
