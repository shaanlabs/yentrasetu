import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

/**
 * App Router
 *
 * Landing page at root. Auth pages for P1. 
 * Browse/listing pages will be added in P2.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },

  // ── P1: Auth pages ──────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-otp', element: <VerifyOtpPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/change-password', element: <ChangePasswordPage /> },

  // ── P2: Machinery pages (to be added) ───────────────
  // { path: '/browse',       element: <BrowsePage /> },
  // { path: '/listing/:id',  element: <ListingDetailPage /> },
  // { path: '/sell',         element: <CreateListingPage /> },
  // { path: '/my-listings',  element: <MyListingsPage /> },

  // ── Catch-all ───────────────────────────────────────
  {
    path: '*',
    element: (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: 'Inter, sans-serif',
        color: '#101214',
        background: '#E9E3DA',
      }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 700, margin: 0 }}>404</h1>
        <p style={{ color: '#6F757C' }}>Page not found.</p>
        <a href="/" style={{ color: '#FF6A00', textDecoration: 'underline' }}>Back to home</a>
      </div>
    ),
  },
]);
