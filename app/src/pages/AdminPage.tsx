import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import { ArrowLeft, Loader2, Users, Package, Wrench, Gauge, Calendar, Star, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const isAdmin = user?.userType === 'admin' || user?.userType === 'super_admin';

  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([adminApi.getDashboard(), adminApi.getPendingListings()])
      .then(([d, p]) => { setStats(d.stats); setPending(p.listings); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionId(id);
    try {
      if (action === 'approve') await adminApi.approveListing(id); else await adminApi.rejectListing(id);
      setPending(prev => prev.filter(l => l.id !== id));
      if (stats) setStats({ ...stats, pendingListings: stats.pendingListings - 1 });
    } catch {} finally { setActionId(null); }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-[#E9E3DA] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>;

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#E9E3DA] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-10 text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-red-500" />
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Access Denied</h1>
        <p className="text-sm text-[#6F757C] mb-6">You don't have permission to view the admin dashboard. Admin role required.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5"><ArrowLeft size={16} /> Back to Home</Link>
      </div>
    </div>
  );

  const cards = stats ? [
    { label: 'Users', value: stats.users, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Listings', value: stats.listings, icon: Gauge, color: 'bg-orange-50 text-[#FF6A00]' },
    { label: 'Parts', value: stats.parts, icon: Package, color: 'bg-green-50 text-green-600' },
    { label: 'Operators', value: stats.operators, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Mechanics', value: stats.mechanics, icon: Wrench, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Bookings', value: stats.bookings, icon: Calendar, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Reviews', value: stats.reviews, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Pending', value: stats.pendingListings, icon: Clock, color: 'bg-red-50 text-red-600' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      <div className="bg-white/80 backdrop-blur-md border-b border-[#E9E3DA] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214' }}>YantraSetu</Link>
            <span className="text-[#6F757C] text-sm">/ Admin</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-[#6F757C] hover:text-[#101214]"><ArrowLeft size={16} /> Home</Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem' }}>Admin Dashboard</h1>
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-5">
              <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}><c.icon size={20} /></div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{c.value}</p>
              <p className="text-xs text-[#6F757C] uppercase tracking-wider mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.label}</p>
            </div>
          ))}
        </div>
        {/* Pending approvals */}
        <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Pending Approvals</h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-8 text-center">
            <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
            <p className="text-sm text-[#6F757C]">All caught up! No pending listings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(l => (
              <div key={l.id} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{l.make} {l.model}</h3>
                  <p className="text-xs text-[#6F757C] mt-0.5">by {l.owner?.firstName} {l.owner?.lastName} · ₹{Number(l.price).toLocaleString('en-IN')} · {l.category}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(l.id, 'approve')} disabled={actionId === l.id}
                    className="text-xs px-4 py-2 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1 disabled:opacity-50"><CheckCircle size={14} /> Approve</button>
                  <button onClick={() => handleAction(l.id, 'reject')} disabled={actionId === l.id}
                    className="text-xs px-4 py-2 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"><XCircle size={14} /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
