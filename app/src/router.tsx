import { createBrowserRouter } from 'react-router-dom';
import App from './App';

/**
 * App Router
 * 
 * Currently serves the landing page at root.
 * New pages (Browse, Login, Register, Listing Detail, etc.)
 * will be added here as they are built in P1/P2.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  // ── P1: Auth pages (to be added) ────────────────────
  // { path: '/login',    element: <LoginPage /> },
  // { path: '/register', element: <RegisterPage /> },
  // { path: '/profile',  element: <ProfilePage /> },

  // ── P2: Machinery pages (to be added) ───────────────
  // { path: '/browse',       element: <BrowsePage /> },
  // { path: '/listing/:id',  element: <ListingDetailPage /> },
  // { path: '/sell',         element: <CreateListingPage /> },
  // { path: '/my-listings',  element: <MyListingsPage /> },

  // ── P3: Search ──────────────────────────────────────
  // { path: '/search',  element: <SearchPage /> },

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
