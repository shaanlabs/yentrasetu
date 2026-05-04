import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { machineryApi, bookingsApi, chatsApi, analyticsApi, type MachineryListing } from '../services/api';
import {
  Loader2, Package, Eye, MessageCircle, Calendar, Plus, ArrowRight,
  TrendingUp, BarChart3, AlertCircle, HardHat, Wrench, Cog, Truck, ShoppingBag
} from 'lucide-react';
import PageShell from '../components/PageShell';

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalViews: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalChats: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [listings, setListings] = useState<MachineryListing[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [demandGaps, setDemandGaps] = useState<any[]>([]);
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

        const totalViews = myListings.reduce((sum: number, l: any) => sum + (l.viewCount || 0), 0);
        const activeListings = myListings.filter((l: any) => l.status === 'approved').length;
        const confirmedBookings = myBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed');
        const totalRevenue = confirmedBookings.reduce((s: number, b: any) => s + (Number(b.totalAmount) || 0), 0);

        setStats({
          totalListings: myListings.length,
          activeListings,
          pendingListings: myListings.filter((l: any) => l.status === 'pending').length,
          totalViews,
          totalBookings: myBookings.length,
          pendingBookings: myBookings.filter((b: any) => b.status === 'pending').length,
          confirmedBookings: confirmedBookings.length,
          totalRevenue,
          totalChats: myChats.length,
        });

        // Fetch real demand data from API
        try {
          const forecast = await analyticsApi.getDemandForecast();
          if (forecast?.gaps) setDemandGaps(forecast.gaps);
        } catch {}

      } catch {}
      setLoading(false);
    };

    load();
  }, [isAuthenticated]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  if (authLoading || loading) {
    return (
      <PageShell breadcrumb="Dashboard">
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 size={28} className="animate-spin text-[#FF6A00]" />
          <p className="text-sm text-[#6F757C]">Loading dashboard...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell breadcrumb="Dashboard" backTo="/" backLabel="Home" title={`Welcome, ${user?.firstName || 'Seller'}`}>
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <button onClick={() => navigate('/sell')} className="btn-primary text-sm py-2.5 px-4 flex items-center gap-2">
          <Plus size={16} /> New Listing
        </button>
        <button onClick={() => navigate('/bookings')} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
          <Calendar size={16} /> Bookings {stats?.pendingBookings ? `(${stats.pendingBookings})` : ''}
        </button>
        <button onClick={() => navigate('/chats')} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
          <MessageCircle size={16} /> Messages
        </button>
        <button onClick={() => navigate('/market-insights')} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
          <TrendingUp size={16} /> Market Insights
        </button>
        <button onClick={() => navigate('/services')} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
          <Wrench size={16} /> All Services
        </button>
      </div>

      {/* Getting Started — shown when user has no listings */}
      {stats && stats.totalListings === 0 && stats.totalBookings === 0 && (
        <div className="bg-white rounded-xl border border-[#EDE8E0] p-6 mb-10">
          <h2 className="font-bold text-base mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Welcome to YantraSetu!</h2>
          <p className="text-sm text-[#6F757C] mb-5">Here's how to get started on the platform:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={() => navigate('/browse')} className="flex items-start gap-3 p-4 bg-[#F9F7F4] rounded-xl border border-[#EDE8E0] hover:border-[#FF6A00] transition-all text-left group">
              <div className="w-10 h-10 bg-[#FF6A00] rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#101214] group-hover:text-[#FF6A00]">Browse Equipment</p>
                <p className="text-xs text-[#6F757C] mt-0.5">Buy or rent verified machinery from our marketplace</p>
              </div>
            </button>
            <button onClick={() => navigate('/sell')} className="flex items-start gap-3 p-4 bg-[#F9F7F4] rounded-xl border border-[#EDE8E0] hover:border-[#FF6A00] transition-all text-left group">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#101214] group-hover:text-blue-600">List Your Machine</p>
                <p className="text-xs text-[#6F757C] mt-0.5">Sell or rent out your idle equipment</p>
              </div>
            </button>
            <button onClick={() => navigate('/services')} className="flex items-start gap-3 p-4 bg-[#F9F7F4] rounded-xl border border-[#EDE8E0] hover:border-[#FF6A00] transition-all text-left group">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wrench size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#101214] group-hover:text-green-600">Explore Services</p>
                <p className="text-xs text-[#6F757C] mt-0.5">Hire operators, find mechanics, get financing</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid — clean, no gradients, data-first */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Active Listings', value: stats?.activeListings || 0, sub: `${stats?.pendingListings || 0} pending`, icon: Package, accent: false },
          { label: 'Total Views', value: stats?.totalViews || 0, sub: `across ${stats?.totalListings || 0} listings`, icon: Eye, accent: false },
          { label: 'Bookings', value: stats?.totalBookings || 0, sub: `${stats?.confirmedBookings || 0} confirmed`, icon: Calendar, accent: false },
          { label: 'Revenue Earned', value: formatPrice(stats?.totalRevenue || 0), sub: `${stats?.confirmedBookings || 0} completed`, icon: TrendingUp, accent: true },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-5 border ${s.accent ? 'bg-[#101214] text-white border-[#101214]' : 'bg-white border-[#EDE8E0]'}`}>
            <div className="flex items-center justify-between mb-3">
              <s.icon size={18} className={s.accent ? 'text-[#FF6A00]' : 'text-[#6F757C]'} />
            </div>
            <p className={`text-2xl font-bold font-heading ${s.accent ? 'text-white' : 'text-[#101214]'}`}>
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </p>
            <p className={`text-xs mt-1 ${s.accent ? 'text-white/60' : 'text-[#6F757C]'}`}>{s.label}</p>
            <p className={`text-[11px] mt-0.5 ${s.accent ? 'text-white/40' : 'text-[#6F757C]/60'}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Pending Actions Alert */}
      {(stats?.pendingBookings || 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-8">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#101214]">
              {stats?.pendingBookings} booking{(stats?.pendingBookings || 0) > 1 ? 's' : ''} awaiting your response
            </p>
            <p className="text-xs text-[#6F757C]">Quick responses improve your booking conversion rate.</p>
          </div>
          <button onClick={() => navigate('/bookings')} className="text-xs font-semibold text-amber-700 hover:underline shrink-0">
            Review now
          </button>
        </div>
      )}

      {/* Supply-Demand Intelligence — REAL data from API */}
      {demandGaps.length > 0 && (
        <div className="bg-white rounded-xl border border-[#EDE8E0] mb-8">
          <div className="flex items-center justify-between p-5 border-b border-[#EDE8E0]">
            <h2 className="font-bold text-sm font-heading flex items-center gap-2">
              <BarChart3 size={16} className="text-[#6F757C]" /> Supply & Demand
            </h2>
            <span className="text-[10px] text-[#6F757C] font-mono uppercase">Live market data</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#EDE8E0]">
            {demandGaps.map((gap: any, i: number) => (
              <div key={i} className="bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold capitalize">{gap.category}</span>
                  {gap.status === 'high_demand' && (
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded font-mono">HIGH</span>
                  )}
                  {gap.status === 'oversupply' && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono">EXCESS</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6F757C]">
                  <span>{gap.activeListings} listed</span>
                  <span className="w-px h-3 bg-[#EDE8E0]" />
                  <span>{gap.recentBookings} booked</span>
                </div>
                {gap.recommendation && (
                  <p className="text-[10px] text-[#6F757C] mt-2 leading-relaxed">{gap.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listing Performance Table */}
      <div className="bg-white rounded-xl border border-[#EDE8E0] mb-8">
        <div className="flex items-center justify-between p-5 border-b border-[#EDE8E0]">
          <h2 className="font-bold text-sm font-heading flex items-center gap-2">
            <Package size={16} className="text-[#6F757C]" /> Your Listings
          </h2>
          <Link to="/my-listings" className="text-xs text-[#FF6A00] hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {listings.length === 0 ? (
          <div className="p-10 text-center">
            <Package size={32} className="mx-auto text-[#6F757C] opacity-30 mb-3" />
            <p className="text-sm text-[#6F757C] mb-4">You haven't listed any equipment yet.</p>
            <Link to="/sell" className="text-sm text-[#FF6A00] font-semibold hover:underline">
              Create your first listing →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDE8E0]">
                  <th className="text-left px-5 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider font-mono">Listing</th>
                  <th className="text-center px-3 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider font-mono hidden sm:table-cell">Status</th>
                  <th className="text-right px-3 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider font-mono">Views</th>
                  <th className="text-right px-5 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider font-mono hidden sm:table-cell">Price</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id} className="border-b border-[#EDE8E0]/50 hover:bg-[#F9F7F4] transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/listing/${l.id}`} className="flex items-center gap-3 hover:text-[#FF6A00]">
                        <div className="w-10 h-10 rounded-lg bg-[#EDE8E0] overflow-hidden flex-shrink-0">
                          {l.images?.[0] ? <img src={l.images[0]} className="w-full h-full object-cover" alt="" /> : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{l.make} {l.model}</p>
                          <p className="text-[11px] text-[#6F757C]">{l.listingType === 'rent' ? 'Rental' : 'Sale'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-center px-3 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded font-mono ${
                        l.status === 'approved' ? 'bg-green-50 text-green-700'
                        : l.status === 'pending' ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                      }`}>
                        {l.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right px-3 py-3">
                      <span className="flex items-center justify-end gap-1 text-[#6F757C]"><Eye size={12} /> {l.viewCount}</span>
                    </td>
                    <td className="text-right px-5 py-3 font-bold text-[#101214] hidden sm:table-cell">{formatPrice(l.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="bg-white rounded-xl border border-[#EDE8E0]">
          <div className="flex items-center justify-between p-5 border-b border-[#EDE8E0]">
            <h2 className="font-bold text-sm font-heading flex items-center gap-2">
              <Calendar size={16} className="text-[#6F757C]" /> Recent Bookings
            </h2>
            <Link to="/bookings" className="text-xs text-[#FF6A00] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[#EDE8E0]/50">
            {recentBookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{b.listing?.make} {b.listing?.model}</p>
                  <p className="text-xs text-[#6F757C]">{b.renter?.firstName} {b.renter?.lastName} · {b.duration} days</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#101214]">{formatPrice(b.totalAmount)}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${
                    b.status === 'confirmed' ? 'bg-green-50 text-green-700'
                    : b.status === 'pending' ? 'bg-amber-50 text-amber-700'
                    : b.status === 'completed' ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-50 text-gray-600'
                  }`}>
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
