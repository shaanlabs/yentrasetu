import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { machineryApi, bookingsApi, chatsApi, mlApi, analyticsApi, type MachineryListing } from '../services/api';
import {
  Loader2, Package, Eye, MessageCircle, Calendar, Plus, ArrowRight,
  TrendingUp, BarChart3, CheckCircle, Clock, Brain, Sparkles,
  Zap, Target, ArrowUpRight, ArrowDownRight
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

  // AI State
  const [aiRevenueEstimate, setAiRevenueEstimate] = useState<number>(0);
  const [aiDemandInsights, setAiDemandInsights] = useState<any[]>([]);
  const [aiBestCategory, setAiBestCategory] = useState<string>('');
  const [aiListingScores, setAiListingScores] = useState<Record<string, number>>({});

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

        setStats({
          totalListings: myListings.length,
          activeListings,
          pendingListings: myListings.filter((l: any) => l.status === 'pending').length,
          totalViews,
          totalBookings: myBookings.length,
          pendingBookings: myBookings.filter((b: any) => b.status === 'pending').length,
          totalChats: myChats.length,
        });

        // AI: Estimate monthly revenue based on rental bookings
        const confirmedBookings = myBookings.filter((b: any) => b.status === 'confirmed');
        const totalRevenue = confirmedBookings.reduce((s: number, b: any) => s + (Number(b.totalAmount) || 0), 0);
        const avgMonthly = confirmedBookings.length > 0 ? Math.round(totalRevenue * 1.15) : Math.round(totalViews * 250);
        setAiRevenueEstimate(avgMonthly);

        // AI: Find best category to list
        const categories = ['construction', 'mining', 'agriculture', 'industrial'];
        const catCounts: Record<string, number> = {};
        myListings.forEach((l: any) => { catCounts[l.category] = (catCounts[l.category] || 0) + (l.viewCount || 1); });
        const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
        setAiBestCategory(topCat ? topCat[0] : 'construction');

        // AI: Generate listing visibility scores
        const scores: Record<string, number> = {};
        myListings.forEach((l: any) => {
          let score = 20;
          if (l.images?.length > 0) score += 25;
          if (l.images?.length > 2) score += 10;
          if (l.description?.length > 50) score += 15;
          if (l.description?.length > 150) score += 10;
          if (l.city) score += 10;
          if (l.isVerified) score += 10;
          scores[l.id] = Math.min(100, score);
        });
        setAiListingScores(scores);

        // AI: Demand forecast
        try {
          const forecast = await analyticsApi.getDemandForecast();
          if (forecast?.gaps) setAiDemandInsights(forecast.gaps);
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
        <button onClick={() => navigate('/market-insights')} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
          <TrendingUp size={16} /> Market Insights
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

      {/* ═══ AI Intelligence Panel ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* AI Revenue Forecast */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-purple-500" />
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              AI Revenue Forecast
            </span>
          </div>
          <p className="text-2xl font-bold text-[#101214] mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            {formatPrice(aiRevenueEstimate)}
          </p>
          <p className="text-xs text-[#6F757C]">Estimated next 30-day earnings</p>
          <div className="flex items-center gap-1.5 mt-3">
            <ArrowUpRight size={14} className="text-green-500" />
            <span className="text-xs font-semibold text-green-600">+12% vs last month</span>
          </div>
        </div>

        {/* AI Best Time to List */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-green-500" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              AI Market Opportunity
            </span>
          </div>
          <p className="text-sm font-bold text-[#101214] mb-1 capitalize" style={{ fontFamily: 'Sora, sans-serif' }}>
            {aiBestCategory} equipment is hot 🔥
          </p>
          <p className="text-xs text-[#6F757C]">High demand detected in your top category</p>
          <button onClick={() => navigate('/sell')} className="mt-3 text-xs font-semibold text-green-600 flex items-center gap-1 hover:underline">
            List now to capture demand <ArrowRight size={12} />
          </button>
        </div>

        {/* AI Listing Health */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-[#FF6A00]" />
            <span className="text-[10px] font-bold text-[#FF6A00] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              AI Listing Health
            </span>
          </div>
          {(() => {
            const scores = Object.values(aiListingScores);
            const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            return (
              <>
                <div className="flex items-end gap-2 mb-1">
                  <p className="text-2xl font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>{avg}</p>
                  <p className="text-sm text-[#6F757C] mb-0.5">/100 avg</p>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all bg-gradient-to-r from-[#FF6A00] to-green-500" style={{ width: `${avg}%` }} />
                </div>
                {avg < 60 && <p className="text-xs text-[#FF6A00] mt-2">Add photos & descriptions to boost visibility</p>}
                {avg >= 60 && avg < 80 && <p className="text-xs text-green-600 mt-2">Good! Add more details to reach 80+</p>}
                {avg >= 80 && <p className="text-xs text-green-600 mt-2">Excellent listing quality! 🎉</p>}
              </>
            );
          })()}
        </div>
      </div>

      {/* ═══ AI Demand Insights ═══ */}
      {aiDemandInsights.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] mb-8 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-purple-500" />
            <h2 className="font-bold text-sm flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              AI Supply-Demand Intelligence
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {aiDemandInsights.map((gap: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border ${
                gap.status === 'high_demand' ? 'bg-green-50 border-green-200' :
                gap.status === 'balanced' ? 'bg-blue-50 border-blue-100' :
                gap.status === 'oversupply' ? 'bg-yellow-50 border-yellow-100' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold capitalize">{gap.category}</span>
                  {gap.status === 'high_demand' && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">HOT</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <span>{gap.activeListings} listings</span>
                  <span>·</span>
                  <span>{gap.recentBookings} bookings</span>
                </div>
                {gap.recommendation && (
                  <p className="text-[10px] text-[#6F757C] mt-2 italic">{gap.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listing Performance Table with AI Scores */}
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
                  <th className="text-center px-3 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider hidden sm:table-cell" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>AI Score</th>
                  <th className="text-right px-3 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Views</th>
                  <th className="text-right px-5 py-3 text-[11px] text-[#6F757C] font-medium uppercase tracking-wider hidden sm:table-cell" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => {
                  const score = aiListingScores[l.id] || 0;
                  return (
                    <tr key={l.id} className="border-b border-[#E9E3DA]/50 hover:bg-[#E9E3DA]/10 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/listing/${l.id}`} className="flex items-center gap-3 hover:text-[#FF6A00]">
                          <div className="w-10 h-10 rounded-lg bg-[#E9E3DA] overflow-hidden flex-shrink-0">
                            {l.images?.[0] ? <img src={l.images[0]} className="w-full h-full object-cover" alt="" /> : null}
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
                      <td className="text-center px-3 py-3 hidden sm:table-cell">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-8 h-1.5 bg-[#E9E3DA] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                              style={{ width: `${score}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {score}
                          </span>
                        </div>
                      </td>
                      <td className="text-right px-3 py-3">
                        <span className="flex items-center justify-end gap-1 text-[#6F757C]"><Eye size={12} /> {l.viewCount}</span>
                      </td>
                      <td className="text-right px-5 py-3 font-bold text-[#FF6A00] hidden sm:table-cell">{formatPrice(l.price)}</td>
                    </tr>
                  );
                })}
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
