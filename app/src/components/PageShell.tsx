import { type ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Plus, CalendarDays, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

interface PageShellProps {
  children: ReactNode;
  title?: string;
  breadcrumb?: string;
  backTo?: string;
  backLabel?: string;
  /** Hide the bottom nav on this page */
  hideBottomNav?: boolean;
  /** Hide the footer on this page (e.g. Chat) */
  hideFooter?: boolean;
  /** Extra class for the content wrapper */
  className?: string;
  /** Full-bleed content (no max-width/padding) */
  fullBleed?: boolean;
  /** SEO Title overrides */
  seoTitle?: string;
  /** SEO Description overrides */
  seoDescription?: string;
}

export default function PageShell({
  children,
  title,
  hideBottomNav = false,
  hideFooter = false,
  className = '',
  fullBleed = false,
  seoTitle,
  seoDescription,
}: PageShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // ── SEO Injection ──
  useEffect(() => {
    const finalTitle = seoTitle ? `${seoTitle} | YantraSetu` : (title ? `${title} | YantraSetu` : "YantraSetu — India's Heavy Equipment Marketplace");
    document.title = finalTitle;
    
    if (seoDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', seoDescription);
    }
  }, [seoTitle, seoDescription, title]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #F5EFEB 0%, #EDE8E0 50%, #E7E2D9 100%)' }}>
      {/* ─── Shared Navbar ─── */}
      <Navbar />

      {/* ─── Page Content ─── */}
      <main className={`flex-1 ${fullBleed ? className : `max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 ${className}`}`}>
        {title && (
          <h1
            className="text-2xl sm:text-[1.75rem] mb-5 sm:mb-6"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#101214' }}
          >
            {title}
          </h1>
        )}
        {children}
      </main>

      {/* ─── Footer ─── */}
      {!hideFooter && <Footer />}

      {/* ─── Mobile Bottom Nav ─── */}
      {!hideBottomNav && (
        <nav className="mobile-bottom-nav md:hidden" aria-label="Mobile navigation">
          <button
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <Home size={20} />
            <span>Home</span>
          </button>

          <button
            className={`nav-item ${location.pathname.startsWith('/browse') && (!location.search.includes('type=rent')) ? 'active' : ''}`}
            onClick={() => navigate('/browse?type=sale')}
          >
            <ShoppingBag size={20} />
            <span>Buy</span>
          </button>

          <button
            className="nav-item-post"
            onClick={() => navigate(isAuthenticated ? '/sell' : '/login')}
          >
            <div className="post-circle">
              <Plus size={24} color="white" strokeWidth={2.5} />
            </div>
          </button>

          <button
            className={`nav-item ${location.pathname.startsWith('/browse') && location.search.includes('type=rent') ? 'active' : ''}`}
            onClick={() => navigate('/browse?type=rent')}
          >
            <CalendarDays size={20} />
            <span>Rent</span>
          </button>

          <button
            className={`nav-item ${isActive('/profile') || isActive('/login') ? 'active' : ''}`}
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
          >
            <User size={20} />
            <span>{isAuthenticated ? 'Profile' : 'Sign In'}</span>
          </button>
        </nav>
      )}
    </div>
  );
}
