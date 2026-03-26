import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi } from '../services/api';
import { ArrowLeft, Loader2, Calendar, CheckCircle, XCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800', completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800', disputed: 'bg-purple-100 text-purple-800',
};

export default function BookingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'renter' | 'owner'>('renter');

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    bookingsApi.getMyBookings(role).then(d => setBookings(d.bookings)).catch(() => setBookings([])).finally(() => setLoading(false));
  }, [isAuthenticated, role]);

  const handleAction = async (id: string, status: string) => {
    try { await bookingsApi.updateStatus(id, status); bookingsApi.getMyBookings(role).then(d => setBookings(d.bookings)); } catch {}
  };

  const fmt = (p: number) => `₹${Number(p).toLocaleString('en-IN')}`;

  if (authLoading) return <div className="min-h-screen bg-[#E9E3DA] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>;

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      <div className="bg-white/80 backdrop-blur-md border-b border-[#E9E3DA] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214' }}>YantraSetu</Link>
            <span className="text-[#6F757C] text-sm">/ Bookings</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-[#6F757C] hover:text-[#101214]"><ArrowLeft size={16} /> Home</Link>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>My Bookings</h1>
        <div className="flex bg-white rounded-md p-1 shadow-sm w-fit mb-8">
          {(['renter', 'owner'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} className={`px-4 py-2 text-sm font-medium rounded capitalize ${role === r ? 'bg-[#101214] text-white' : 'text-[#6F757C]'}`} style={{ fontFamily: 'Sora, sans-serif' }}>As {r}</button>
          ))}
        </div>
        {loading ? <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
        : bookings.length === 0 ? (
          <div className="text-center py-32">
            <Calendar size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>No bookings yet</h2>
            <p className="text-sm text-[#6F757C] mt-2">{role === 'renter' ? 'Browse rental listings to get started.' : 'Your rental listings haven\'t been booked yet.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{b.listing?.make} {b.listing?.model}</h3>
                    <div className="flex items-center gap-3 text-xs text-[#6F757C] mt-1">
                      <span className="flex items-center gap-1"><Calendar size={11} />{b.startDate} → {b.endDate}</span>
                      <span>{b.duration} days</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded ${STATUS_COLORS[b.status]}`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{b.status.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-[#6F757C] mb-3">
                  <div><p className="font-medium">Rate</p><p className="text-sm text-[#101214] font-bold">{fmt(b.rentalRate)}/{b.rentalUnit}</p></div>
                  <div><p className="font-medium">Total</p><p className="text-sm text-[#FF6A00] font-bold">{fmt(b.totalAmount)}</p></div>
                  <div><p className="font-medium">Deposit</p><p className="text-sm text-[#101214]">{fmt(b.securityDeposit)}</p></div>
                </div>
                {b.status === 'pending' && role === 'owner' && (
                  <div className="flex gap-2 pt-3 border-t border-[#E9E3DA]">
                    <button onClick={() => handleAction(b.id, 'confirmed')} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded border border-green-200 flex items-center gap-1"><CheckCircle size={12} /> Confirm</button>
                    <button onClick={() => handleAction(b.id, 'cancelled')} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded border border-red-200 flex items-center gap-1"><XCircle size={12} /> Reject</button>
                  </div>
                )}
                {b.status === 'pending' && role === 'renter' && (
                  <div className="flex gap-2 pt-3 border-t border-[#E9E3DA]">
                    <button onClick={() => handleAction(b.id, 'cancelled')} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded border border-red-200 flex items-center gap-1"><XCircle size={12} /> Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
