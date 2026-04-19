import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, ShoppingBag, Plus, CalendarDays, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PageShellProps {
  children: ReactNode;
  title?: string;
  breadcrumb?: string;
  backTo?: string;
  backLabel?: string;
  /** Hide the bottom nav on this page */
  hideBottomNav?: boolean;
  /** Extra class for the content wrapper */
  className?: string;
  /** Full-bleed content (no max-width/padding) */
  fullBleed?: boolean;
}

export default function PageShell({
  children,
  title,
  breadcrumb,
  backTo = '/',
  backLabel = 'Home',
  hideBottomNav = false,
  className = '',
  fullBleed = false,
}: PageShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      {/* ─── Sticky Header ─── */}
      <header className="page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 800,
                fontSize: '1.1rem',
                color: '#101214',
                whiteSpace: 'nowrap',
              }}
            >
              YantraSetu
            </Link>
            {breadcrumb && (
              <span className="text-[#6F757C] text-sm hidden sm:inline truncate">
                / {breadcrumb}
              </span>
            )}
          </div>
          <Link
            to={backTo}
            className="flex items-center gap-1.5 text-sm text-[#6F757C] hover:text-[#101214] transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        </div>
      </header>

      {/* ─── Page Content ─── */}
      <main className={fullBleed ? className : `max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 ${className}`}>
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
