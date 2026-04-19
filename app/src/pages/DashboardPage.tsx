import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { machineryApi, bookingsApi, chatsApi, type MachineryListing } from '../services/api';
import {
  Loader2, Package, Eye, MessageCircle, Calendar, Plus, ArrowRight,
  TrendingUp, BarChart3, CheckCircle, Clock
} from 'lucide-react';
import PageShell from '../components/PageShell';

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalViews: number;
  totalBookings: number;
  pendingBookings: number;
  totalChats: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [listings, setListings] = useState<MachineryListing[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      try {
        const [listingsData, bookingsData, chatsData] = await Promise.allSettled([
          machineryApi.getMyListings(1, 100),
          bookingsApi.getMyBookings('owner'),
          chatsApi.getMyChats(),
        ]);

        const myListings = listingsData.status === 'fulfilled' ? listingsData.value.listings : [];
        const myBookings = bookingsData.status === 'fulfilled' ? bookingsData.value.bookings : [];
        const myChats = chatsData.status === 'fulfilled' ? chatsData.value.chats : [];

        setListings(myListings.slice(0, 10));
        setRecentBookings(myBookings.slice(0, 5));

        setStats({
          totalListings: myListings.length,
          activeListings: myListings.filter((l: any) => l.status === 'approved').length,
          pendingListings: myListings.filter((l: any) => l.status === 'pending').length,
          totalViews: myListings.reduce((sum: number, l: any) => sum + (l.viewCount || 0), 0),
          totalBookings: myBookings.length,
          pendingBookings: myBookings.filter((b: any) => b.status === 'pending').length,
          totalChats: myChats.length,
        });
      } catch {}
      setLoading(false);
    };

    load();
  }, [isAuthenticated]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  if (authLoading || loading) {
    return (
      <PageShell breadcrumb="Dashboard"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>
    );
  }

  const statCards = [
    { label: 'Total Listings', value: stats?.totalListings || 0, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active', value: stats?.activeListings || 0, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Pending', value: stats?.pendingListings || 0, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Total Views', value: stats?.totalViews || 0, icon: Eye, color: 'bg-purple-50 text-purple-600' },
    { label: 'Bookings', value: stats?.totalBookings || 0, icon: Calendar, color: 'bg-orange-50 text-orange-600' },
    { label: 'Conversations', value: stats?.totalChats || 0, icon: MessageCircle, color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <PageShell breadcrumb="Dashboard" backTo="/" backLabel="Home" title={`Welcome, ${user?.firstName || 'Seller'}`}>
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button onClick={() => navigate('/sell')} className="btn-primary text-sm py-2.5 px-4 flex items-center gap-2">
          <Plus size={16} /> New Listing
        </button>
        <button onClick={() => navigate('/bookings')} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
          <Calendar size={16} /> Bookings {stats?.pendingBookings ? `(${stats.pendingBookings})` : ''}
        </button>
        <button onClick={() => navigate('/chats')} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
          <MessageCircle size={16} /> Messages
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{s.value.toLocaleString()}</p>
            <p className="text-[11px] text-[#6F757C] mt-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Listing Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] mb-8">
        <div className="flex items-center justify-between p-5 border-b border-[#E9E3DA]">
          <h2 className="font-bold text-sm flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            <BarChart3 size={16} className="text-[#FF6A00]" /> Listing Performance
          </h2>
          <Link to="/my-listings" className="text-xs text-[#FF6A00] hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {listings.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6F757C]">
            No listings yet. <Link to="/sell" className="text-[#FF6A00] hover:underline">Create your first listing</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E9E3DA]">
                  <th className="text-left px-5 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Listing</th>
                  <th className="text-center px-3 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider hidden sm:table-cell" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Status</th>
                  <th className="text-right px-3 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Views</th>
                  <th className="text-right px-5 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider hidden sm:table-cell" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id} className="border-b border-[#E9E3DA]/50 hover:bg-[#E9E3DA]/10 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/listing/${l.id}`} className="flex items-center gap-3 hover:text-[#FF6A00]">
                        <div className="w-10 h-10 rounded-lg bg-[#E9E3DA] overflow-hidden flex-shrink-0">
                          {l.images?.[0] ? <img src={l.images[0]} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{l.make} {l.model}</p>
                          <p className="text-[11px] text-[#6F757C]">{l.listingType === 'rent' ? 'Rent' : 'Sale'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-center px-3 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        l.status === 'approved' ? 'bg-green-100 text-green-700'
                        : l.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        {l.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right px-3 py-3">
                      <span className="flex items-center justify-end gap-1 text-[#6F757C]"><Eye size={12} /> {l.viewCount}</span>
                    </td>
                    <td className="text-right px-5 py-3 font-bold text-[#FF6A00] hidden sm:table-cell">{formatPrice(l.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA]">
          <div className="flex items-center justify-between p-5 border-b border-[#E9E3DA]">
            <h2 className="font-bold text-sm flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              <TrendingUp size={16} className="text-[#FF6A00]" /> Recent Bookings
            </h2>
            <Link to="/bookings" className="text-xs text-[#FF6A00] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[#E9E3DA]/50">
            {recentBookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{b.listing?.make} {b.listing?.model}</p>
                  <p className="text-xs text-[#6F757C]">{b.renter?.firstName} {b.renter?.lastName} · {b.duration} days</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#FF6A00]">{formatPrice(b.totalAmount)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700'
                    : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                  }`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {b.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
