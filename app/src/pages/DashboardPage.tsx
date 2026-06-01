import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { machineryApi, bookingsApi, chatsApi, analyticsApi, type MachineryListing } from '../services/api';
import {
  Loader2, Package, Eye, MessageCircle, Calendar, Plus, ArrowRight,
  TrendingUp, BarChart3, AlertCircle, Wrench, ShoppingBag
} from 'lucide-react';
import PageShell from '../components/PageShell';

// Shadcn UI
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  
  useEffect(() => { 
    if (!authLoading && !isAuthenticated) navigate('/login'); 
  }, [authLoading, isAuthenticated, navigate]);

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
          <p className="text-sm text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>Loading dashboard...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell breadcrumb="Dashboard" backTo="/" backLabel="Home" title={`Welcome, ${user?.firstName || 'Seller'}`}>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Button onClick={() => navigate('/sell')} className="bg-[#FF6A00] hover:bg-[#e55f00] text-white">
          <Plus className="mr-2 h-4 w-4" /> New Listing
        </Button>
        <Button onClick={() => navigate('/bookings')} variant="outline" className="border-[#EDE8E0] bg-white">
          <Calendar className="mr-2 h-4 w-4" /> Bookings {stats?.pendingBookings ? `(${stats.pendingBookings})` : ''}
        </Button>
        <Button onClick={() => navigate('/chats')} variant="outline" className="border-[#EDE8E0] bg-white">
          <MessageCircle className="mr-2 h-4 w-4" /> Messages
        </Button>
        <Button onClick={() => navigate('/market-insights')} variant="outline" className="border-[#EDE8E0] bg-white">
          <TrendingUp className="mr-2 h-4 w-4" /> Market Insights
        </Button>
        <Button onClick={() => navigate('/services')} variant="outline" className="border-[#EDE8E0] bg-white">
          <Wrench className="mr-2 h-4 w-4" /> All Services
        </Button>
      </div>

      {/* Pending Actions Alert */}
      {(stats?.pendingBookings || 0) > 0 && (
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800" style={{ fontFamily: 'Sora, sans-serif' }}>Action Required</AlertTitle>
          <AlertDescription className="text-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            <span>
              You have {stats?.pendingBookings} booking{(stats?.pendingBookings || 0) > 1 ? 's' : ''} awaiting your response. 
              Quick responses improve your booking conversion rate.
            </span>
            <Button size="sm" variant="outline" onClick={() => navigate('/bookings')} className="border-amber-300 bg-white text-amber-700 hover:bg-amber-100 shrink-0">
              Review now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Getting Started — shown when user has no listings */}
      {stats && stats.totalListings === 0 && stats.totalBookings === 0 && (
        <Card className="mb-10 border-[#EDE8E0] shadow-sm">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Sora, sans-serif' }}>Welcome to YantraSetu!</CardTitle>
            <CardDescription style={{ fontFamily: 'DM Sans, sans-serif' }}>Here's how to get started on the platform:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.button whileHover={{ y: -4 }} onClick={() => navigate('/browse')} className="flex items-start gap-3 p-4 bg-[#F5EFEB] rounded-xl border border-[#EDE8E0] hover:border-[#FF6A00] transition-colors text-left group">
                <div className="w-10 h-10 bg-[#FF6A00] rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#101214] group-hover:text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>Browse Equipment</p>
                  <p className="text-xs text-[#6F757C] mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Buy or rent verified machinery from our marketplace</p>
                </div>
              </motion.button>
              
              <motion.button whileHover={{ y: -4 }} onClick={() => navigate('/sell')} className="flex items-start gap-3 p-4 bg-[#F5EFEB] rounded-xl border border-[#EDE8E0] hover:border-blue-500 transition-colors text-left group">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#101214] group-hover:text-blue-600" style={{ fontFamily: 'Sora, sans-serif' }}>List Your Machine</p>
                  <p className="text-xs text-[#6F757C] mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Sell or rent out your idle equipment</p>
                </div>
              </motion.button>
              
              <motion.button whileHover={{ y: -4 }} onClick={() => navigate('/services')} className="flex items-start gap-3 p-4 bg-[#F5EFEB] rounded-xl border border-[#EDE8E0] hover:border-green-500 transition-colors text-left group">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wrench size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#101214] group-hover:text-green-600" style={{ fontFamily: 'Sora, sans-serif' }}>Explore Services</p>
                  <p className="text-xs text-[#6F757C] mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Hire operators, find mechanics, get financing</p>
                </div>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid — clean, no gradients, data-first */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10"
      >
        {[
          { label: 'Active Listings', value: stats?.activeListings || 0, sub: `${stats?.pendingListings || 0} pending`, icon: Package, accent: false },
          { label: 'Total Views', value: stats?.totalViews || 0, sub: `across ${stats?.totalListings || 0} listings`, icon: Eye, accent: false },
          { label: 'Bookings', value: stats?.totalBookings || 0, sub: `${stats?.confirmedBookings || 0} confirmed`, icon: Calendar, accent: false },
          { label: 'Revenue Earned', value: formatPrice(stats?.totalRevenue || 0), sub: `${stats?.confirmedBookings || 0} completed`, icon: TrendingUp, accent: true },
        ].map((s) => (
          <motion.div key={s.label} variants={itemVariants}>
            <Card className={`h-full border-none shadow-sm ${s.accent ? 'bg-[#101214] text-white' : 'bg-white border-[#EDE8E0] border'}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon size={18} className={s.accent ? 'text-[#FF6A00]' : 'text-[#6F757C]'} />
                </div>
                <p className={`text-2xl font-bold ${s.accent ? 'text-white' : 'text-[#101214]'}`} style={{ fontFamily: 'Sora, sans-serif' }}>
                  {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                </p>
                <p className={`text-xs mt-1 font-semibold tracking-wide uppercase ${s.accent ? 'text-white/60' : 'text-[#6F757C]'}`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {s.label}
                </p>
                <p className={`text-[11px] mt-1 ${s.accent ? 'text-white/40' : 'text-[#6F757C]/70'}`} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {s.sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Supply-Demand Intelligence — REAL data from API */}
      {demandGaps.length > 0 && (
        <Card className="mb-10 border-[#EDE8E0] shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#EDE8E0] bg-white py-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              <BarChart3 size={16} className="text-[#6F757C]" /> Supply & Demand
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-[#6F757C] border-[#EDE8E0]">
              Live market data
            </Badge>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#EDE8E0]">
            {demandGaps.map((gap: any, i: number) => (
              <div key={i} className="bg-white p-5 hover:bg-[#F9F7F4] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold capitalize" style={{ fontFamily: 'Sora, sans-serif' }}>{gap.category}</span>
                  {gap.status === 'high_demand' && (
                    <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] uppercase font-mono px-1.5 py-0">HIGH</Badge>
                  )}
                  {gap.status === 'oversupply' && (
                    <Badge variant="default" className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] uppercase font-mono px-1.5 py-0">EXCESS</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6F757C] font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <span>{gap.activeListings} listed</span>
                  <span className="w-px h-3 bg-[#EDE8E0]" />
                  <span>{gap.recentBookings} booked</span>
                </div>
                {gap.recommendation && (
                  <p className="text-[11px] text-[#6F757C] mt-3 leading-relaxed" style={{ fontFamily: 'DM Sans, sans-serif' }}>{gap.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Listing Performance Table */}
      <Card className="mb-10 border-[#EDE8E0] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#EDE8E0] py-4 px-5">
          <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            <Package size={16} className="text-[#6F757C]" /> Your Listings
          </CardTitle>
          <Link to="/my-listings" className="text-xs font-semibold text-[#FF6A00] hover:underline flex items-center gap-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            View all <ArrowRight size={12} />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {listings.length === 0 ? (
            <div className="p-10 text-center">
              <Package size={32} className="mx-auto text-[#6F757C] opacity-30 mb-3" />
              <p className="text-sm text-[#6F757C] mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>You haven't listed any equipment yet.</p>
              <Button onClick={() => navigate('/sell')} variant="link" className="text-[#FF6A00]">
                Create your first listing <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#EDE8E0] hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-[#6F757C]">Listing</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-[#6F757C] text-center hidden sm:table-cell">Status</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-[#6F757C] text-right">Views</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-[#6F757C] text-right hidden sm:table-cell">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map(l => (
                  <TableRow key={l.id} className="border-[#EDE8E0]/50 hover:bg-[#F9F7F4]">
                    <TableCell>
                      <Link to={`/listing/${l.id}`} className="flex items-center gap-3 hover:text-[#FF6A00] transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-[#EDE8E0] overflow-hidden flex-shrink-0">
                          {l.images?.[0] ? <img src={l.images[0]} className="w-full h-full object-cover" alt="" /> : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ fontFamily: 'Sora, sans-serif' }}>{l.make} {l.model}</p>
                          <p className="text-xs text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{l.listingType === 'rent' ? 'Rental' : 'Sale'}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="outline" className={`font-mono text-[10px] uppercase border-transparent ${
                        l.status === 'approved' ? 'bg-green-50 text-green-700'
                        : l.status === 'pending' ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                      }`}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[#6F757C]">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        {l.viewCount} <Eye size={12} /> 
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#101214] hidden sm:table-cell" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {formatPrice(l.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <Card className="mb-10 border-[#EDE8E0] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#EDE8E0] py-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              <Calendar size={16} className="text-[#6F757C]" /> Recent Bookings
            </CardTitle>
            <Link to="/bookings" className="text-xs font-semibold text-[#FF6A00] hover:underline flex items-center gap-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#EDE8E0]/50">
              {recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9F7F4] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {b.listing?.make} {b.listing?.model}
                    </p>
                    <p className="text-xs text-[#6F757C] mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {b.renter?.firstName} {b.renter?.lastName} · {b.duration} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#101214] mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {formatPrice(b.totalAmount)}
                    </p>
                    <Badge variant="outline" className={`font-mono text-[9px] uppercase border-transparent ${
                      b.status === 'confirmed' ? 'bg-green-50 text-green-700'
                      : b.status === 'pending' ? 'bg-amber-50 text-amber-700'
                      : b.status === 'completed' ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-600'
                    }`}>
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
