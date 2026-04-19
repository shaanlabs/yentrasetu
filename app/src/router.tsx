import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// ─── Lazy-loaded pages (code-split into separate chunks) ───────
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const CreateListingPage = lazy(() => import('./pages/CreateListingPage'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage'));
const PartsPage = lazy(() => import('./pages/PartsPage'));
const OperatorsPage = lazy(() => import('./pages/OperatorsPage'));
const MechanicsPage = lazy(() => import('./pages/MechanicsPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const ChatsPage = lazy(() => import('./pages/ChatsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LoanEligibilityPage = lazy(() => import('./pages/LoanEligibilityPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CertificationsPage = lazy(() => import('./pages/CertificationsPage'));
const SampleReportPage = lazy(() => import('./pages/SampleReportPage'));
const InspectionStandardsPage = lazy(() => import('./pages/InspectionStandardsPage'));
const ContactSpecialistPage = lazy(() => import('./pages/ContactSpecialistPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SavedListingsPage = lazy(() => import('./pages/SavedListingsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MarketInsightsPage = lazy(() => import('./pages/MarketInsightsPage'));

// ─── Loading fallback ──────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#E9E3DA',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid #E9E3DA',
        borderTopColor: '#FF6A00',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Wrap a lazy component with Suspense */
function SL({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  { path: '/', element: <App /> },

  // Auth
  { path: '/login', element: <SL><LoginPage /></SL> },
  { path: '/register', element: <SL><RegisterPage /></SL> },
  { path: '/verify-otp', element: <SL><VerifyOtpPage /></SL> },
  { path: '/profile', element: <SL><ProfilePage /></SL> },
  { path: '/change-password', element: <SL><ChangePasswordPage /></SL> },

  // Machinery
  { path: '/browse', element: <SL><BrowsePage /></SL> },
  { path: '/listing/:id', element: <SL><ListingDetailPage /></SL> },
  { path: '/sell', element: <SL><CreateListingPage /></SL> },
  { path: '/my-listings', element: <SL><MyListingsPage /></SL> },

  // Marketplace services
  { path: '/parts', element: <SL><PartsPage /></SL> },
  { path: '/operators', element: <SL><OperatorsPage /></SL> },
  { path: '/mechanics', element: <SL><MechanicsPage /></SL> },
  { path: '/bookings', element: <SL><BookingsPage /></SL> },
  { path: '/chats', element: <SL><ChatsPage /></SL> },
  { path: '/admin', element: <SL><AdminPage /></SL> },
  { path: '/loan-eligibility', element: <SL><LoanEligibilityPage /></SL> },

  // Phase 2
  { path: '/certifications', element: <SL><CertificationsPage /></SL> },
  { path: '/subscriptions', element: <SL><SubscriptionPage /></SL> },

  // User features
  { path: '/notifications', element: <SL><NotificationsPage /></SL> },
  { path: '/saved', element: <SL><SavedListingsPage /></SL> },
  { path: '/dashboard', element: <SL><DashboardPage /></SL> },
  { path: '/market-insights', element: <SL><MarketInsightsPage /></SL> },

  // Info pages
  { path: '/about', element: <SL><AboutPage /></SL> },
  { path: '/terms', element: <SL><TermsPage /></SL> },
  { path: '/sample-report', element: <SL><SampleReportPage /></SL> },
  { path: '/inspection-standards', element: <SL><InspectionStandardsPage /></SL> },
  { path: '/contact-specialist', element: <SL><ContactSpecialistPage /></SL> },

  // 404
  {
    path: '*',
    element: (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', fontFamily: 'Inter, sans-serif', color: '#101214', background: '#E9E3DA' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 700, margin: 0 }}>404</h1>
        <p style={{ color: '#6F757C' }}>Page not found.</p>
        <a href="/" style={{ color: '#FF6A00', textDecoration: 'underline' }}>Back to home</a>
      </div>
    ),
  },
]);
