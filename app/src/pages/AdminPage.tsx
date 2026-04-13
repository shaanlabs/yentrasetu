import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, certificationsApi, fraudApi } from '../services/api';
import {
  ArrowLeft, Loader2, Users, Package, Wrench, Gauge, Calendar, Star, CheckCircle, XCircle, Clock,
  Shield, AlertTriangle, Eye, TrendingUp, TrendingDown, Activity, BarChart3, Search,
  Ban, UserCheck, Settings, ChevronLeft, ChevronRight, RefreshCw, Filter, Award,
  Zap, MapPin, DollarSign, FileText, Globe, Bell, Lock, Unlock, ChevronDown
} from 'lucide-react';
import PageShell from '../components/PageShell';

type Tab = 'overview' | 'users' | 'listings' | 'analytics' | 'certifications' | 'fraud' | 'activity';

// ─── Mini SVG Chart Components ─────────────────────────
function MiniBarChart({ data, height = 60, color = '#FF6A00' }: { data: number[]; height?: number; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const barW = Math.max(4, Math.min(12, 200 / data.length));
  const gap = 2;
  const w = data.length * (barW + gap);
  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const h = (v / max) * (height - 4);
        return <rect key={i} x={i * (barW + gap)} y={height - h - 2} width={barW} height={h} rx={2} fill={color} opacity={0.8 + (i / data.length) * 0.2} />;
      })}
    </svg>
  );
}

function MiniDonutChart({ data, size = 100 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  let cumAngle = -90;
  return (
    <svg width={size} height={size}>
      {data.map((d, i) => {
        const angle = (d.value / total) * 360;
        const startAngle = cumAngle;
        cumAngle += angle;
        const endAngle = cumAngle;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const largeArc = angle > 180 ? 1 : 0;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={d.color} opacity={0.85} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#1a1d21" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="Sora, sans-serif">{total}</text>
    </svg>
  );
}

// ─── Animated Counter ──────────────────────────────────
function AnimatedNum({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const duration = 600;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString('en-IN')}</>;
}

// ─── Category colors ───────────────────────────────────
const CAT_COLORS = ['#FF6A00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];
const ROLE_LABELS: Record<string, string> = { individual: 'Individual', contractor: 'Contractor', company: 'Company', dealer: 'Dealer', operator: 'Operator', mechanic: 'Mechanic', admin: 'Admin', super_admin: 'Super Admin' };
const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-500/20 text-green-400', pending: 'bg-yellow-500/20 text-yellow-400',
  rejected: 'bg-red-500/20 text-red-400', sold: 'bg-blue-500/20 text-blue-400', rented: 'bg-purple-500/20 text-purple-400',
};
const SEVERITY_BADGE: Record<string, string> = { info: 'bg-blue-500/20 text-blue-400', warning: 'bg-yellow-500/20 text-yellow-400', critical: 'bg-red-500/20 text-red-400' };
const ACTION_LABELS: Record<string, string> = {
  login: '🔑 Login', login_failed: '❌ Failed Login', register: '📝 Registration', password_changed: '🔒 Password Changed',
  listing_created: '📦 Listing Created', listing_approved: '✅ Listing Approved', listing_rejected: '❌ Listing Rejected', listing_featured: '⭐ Listing Featured',
  user_banned: '🚫 User Banned', user_unbanned: '✅ User Unbanned', user_role_changed: '🔄 Role Changed', user_verified: '✅ User Verified', user_deactivated: '⏸️ User Deactivated',
  booking_created: '📅 Booking Created', booking_confirmed: '✅ Booking Confirmed', booking_cancelled: '❌ Booking Cancelled',
  fraud_reported: '🚨 Fraud Reported', fraud_resolved: '✅ Fraud Resolved', fraud_dismissed: '🗑️ Fraud Dismissed',
  spam_detected: '⚠️ Spam Detected', spam_blocked: '🛑 Spam Blocked',
};
const REASON_LABELS: Record<string, string> = {
  fake_listing: 'Fake Listing', misleading_photos: 'Misleading Photos', scam_pricing: 'Scam Pricing',
  stolen_equipment: 'Stolen Equipment', impersonation: 'Impersonation', spam: 'Spam', other: 'Other'
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const isAdmin = user?.userType === 'admin' || user?.userType === 'super_admin';

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [pendingCerts, setPendingCerts] = useState<any[]>([]);
  const [fraudReports, setFraudReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersPagination, setUsersPagination] = useState<any>(null);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [listingsPagination, setListingsPagination] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityPagination, setActivityPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesId, setNotesId] = useState<string | null>(null);

  // Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('');
  const [listingSearch, setListingSearch] = useState('');
  const [banReason, setBanReason] = useState('');
  const [roleChangeId, setRoleChangeId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getPendingListings(),
      certificationsApi.getPending().catch(() => ({ certifications: [] })),
      fraudApi.getPending().catch(() => ({ reports: [] })),
    ])
      .then(([d, p, c, f]) => {
        setStats(d.stats);
        setPending(p.listings);
        setPendingCerts(c.certifications);
        setFraudReports(f.reports);
      })
      .catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Load users tab
  const loadUsers = useCallback(async (page = 1) => {
    try {
      const data = await adminApi.getUsers({ page, search: userSearch, role: userRoleFilter, status: userStatusFilter });
      setAllUsers(data.users);
      setUsersPagination(data.pagination);
    } catch {}
  }, [userSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, loadUsers]);

  // Load listings tab
  const loadListings = useCallback(async (page = 1) => {
    try {
      const data = await adminApi.getAllListings({ page, status: listingStatusFilter, search: listingSearch });
      setAllListings(data.listings);
      setListingsPagination(data.pagination);
    } catch {}
  }, [listingStatusFilter, listingSearch]);

  useEffect(() => { if (tab === 'listings') loadListings(); }, [tab, loadListings]);

  // Load activity tab
  const loadActivity = useCallback(async (page = 1) => {
    try {
      const data = await adminApi.getActivityLog({ page, limit: 30 });
      setActivityLogs(data.logs);
      setActivityPagination(data.pagination);
    } catch {}
  }, []);

  useEffect(() => { if (tab === 'activity') loadActivity(); }, [tab, loadActivity]);

  // ─── Action Handlers ─────────────────────────────────
  const handleListingAction = async (id: string, action: 'approve' | 'reject') => {
    setActionId(id);
    try {
      if (action === 'approve') await adminApi.approveListing(id); else await adminApi.rejectListing(id);
      setPending(prev => prev.filter(l => l.id !== id));
      if (stats) setStats({ ...stats, pendingListings: stats.pendingListings - 1 });
    } catch {} finally { setActionId(null); }
  };

  const handleFeature = async (id: string) => {
    setActionId(id);
    try {
      await adminApi.toggleFeatured(id);
      setAllListings(prev => prev.map(l => l.id === id ? { ...l, isFeatured: !l.isFeatured } : l));
    } catch {} finally { setActionId(null); }
  };

  const handleBanUser = async (id: string, ban: boolean) => {
    setActionId(id);
    try {
      await adminApi.banUser(id, ban, ban ? banReason : undefined);
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, isBanned: ban } : u));
      setBanReason('');
    } catch {} finally { setActionId(null); }
  };

  const handleVerifyUser = async (id: string) => {
    setActionId(id);
    try {
      await adminApi.verifyUser(id);
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, isVerified: !u.isVerified } : u));
    } catch {} finally { setActionId(null); }
  };

  const handleRoleChange = async (id: string) => {
    if (!selectedRole) return;
    setActionId(id);
    try {
      await adminApi.changeUserRole(id, selectedRole);
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, userType: selectedRole } : u));
      setRoleChangeId(null);
      setSelectedRole('');
    } catch {} finally { setActionId(null); }
  };

  const handleCertAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionId(id);
    try {
      await certificationsApi.review(id, status, notesId === id ? adminNotes : '');
      setPendingCerts(prev => prev.filter(c => c.id !== id));
      setAdminNotes(''); setNotesId(null);
    } catch {} finally { setActionId(null); }
  };

  const handleFraudAction = async (id: string, status: 'investigating' | 'resolved' | 'dismissed') => {
    setActionId(id);
    try {
      await fraudApi.review(id, status, notesId === id ? adminNotes : '', status === 'resolved' ? 'Action taken' : undefined);
      if (status === 'dismissed' || status === 'resolved') {
        setFraudReports(prev => prev.filter(r => r.id !== id));
      } else {
        setFraudReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      }
      setAdminNotes(''); setNotesId(null);
    } catch {} finally { setActionId(null); }
  };

  // ─── Loading / Auth States ───────────────────────────
  if (authLoading || loading) return <PageShell breadcrumb="Admin"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  if (!isAdmin) return (
    <PageShell breadcrumb="Admin">
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><XCircle size={32} className="text-red-500" /></div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Access Denied</h1>
          <p className="text-sm text-[#6F757C] mb-6">Admin role required.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5"><ArrowLeft size={16} /> Back to Home</Link>
        </div>
      </div>
    </PageShell>
  );

  // ─── Sidebar Tabs ────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users, badge: stats?.users },
    { key: 'listings', label: 'Listings', icon: Package, badge: stats?.pendingListings },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'certifications', label: 'Certs', icon: Shield, badge: pendingCerts.length },
    { key: 'fraud', label: 'Fraud', icon: AlertTriangle, badge: fraudReports.length },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  return (
    <PageShell breadcrumb="Admin" backTo="/" backLabel="Home" hideBottomNav>
      <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* ─── Sidebar ─── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #1a1d21 0%, #101214 100%)' }}>
          <div className="p-5 border-b border-white/10">
            <h2 className="text-white text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              <Shield size={16} className="text-[#FF6A00]" /> Admin Panel
            </h2>
            <p className="text-[10px] text-gray-500 mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{user?.firstName} · {user?.userType}</p>
          </div>
          <nav className="flex-1 py-2">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-all ${tab === t.key ? 'bg-[#FF6A00]/20 text-[#FF6A00] border-r-2 border-[#FF6A00]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                style={{ fontFamily: 'Inter, sans-serif' }}>
                <t.icon size={16} />
                <span className="flex-1 text-left">{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tab === t.key ? 'bg-[#FF6A00]/30 text-[#FF6A00]' : 'bg-white/10 text-gray-400'}`}>{t.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ─── Mobile Tab Bar ─── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1a1d21] border-t border-white/10 flex overflow-x-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${tab === t.key ? 'text-[#FF6A00]' : 'text-gray-500'}`}>
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-0">
          <h1 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: 'Sora, sans-serif' }}>
            {tabs.find(t => t.key === tab)?.label || 'Admin'}
            <button onClick={() => { setLoading(true); window.location.reload(); }} className="ml-auto p-2 rounded-lg hover:bg-[#E9E3DA] transition-colors" title="Refresh">
              <RefreshCw size={16} className="text-[#6F757C]" />
            </button>
          </h1>

          {/* ━━━ OVERVIEW TAB ━━━ */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.users, icon: Users, color: '#3B82F6', trend: stats.growth?.newUsers7d, trendLabel: '7d' },
                  { label: 'Listings', value: stats.listings, icon: Package, color: '#FF6A00', trend: stats.growth?.newListings7d, trendLabel: '7d' },
                  { label: 'Bookings', value: stats.bookings, icon: Calendar, color: '#10B981', trend: stats.growth?.newBookings7d, trendLabel: '7d' },
                  { label: 'Revenue', value: stats.revenue, icon: DollarSign, color: '#F59E0B', isCurrency: true },
                  { label: 'Parts', value: stats.parts, icon: Wrench, color: '#8B5CF6' },
                  { label: 'Operators', value: stats.operators, icon: Users, color: '#EC4899' },
                  { label: 'Mechanics', value: stats.mechanics, icon: Settings, color: '#6366F1' },
                  { label: 'Reviews', value: stats.reviews, icon: Star, color: '#F97316' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.color + '15' }}>
                        <c.icon size={20} style={{ color: c.color }} />
                      </div>
                      {c.trend !== undefined && c.trend > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          <TrendingUp size={10} />+{c.trend} {c.trendLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {(c as any).isCurrency ? formatPrice(c.value || 0) : <AnimatedNum value={c.value || 0} />}
                    </p>
                    <p className="text-[11px] text-[#6F757C] mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.label.toUpperCase()}</p>
                  </div>
                ))}
              </div>

              {/* Alert Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setTab('listings')}>
                  <Clock size={24} className="text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-800" style={{ fontFamily: 'Sora, sans-serif' }}>{stats.pendingListings}</p>
                    <p className="text-xs text-yellow-600">Pending Approvals</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setTab('certifications')}>
                  <Shield size={24} className="text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-800" style={{ fontFamily: 'Sora, sans-serif' }}>{stats.pendingCerts}</p>
                    <p className="text-xs text-blue-600">Pending Certs</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setTab('fraud')}>
                  <AlertTriangle size={24} className="text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-800" style={{ fontFamily: 'Sora, sans-serif' }}>{stats.openFraud}</p>
                    <p className="text-xs text-red-600">Open Fraud Reports</p>
                  </div>
                </div>
              </div>

              {/* Mini Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Registrations chart */}
                {stats.registrationsPerDay?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                      <TrendingUp size={14} className="text-[#FF6A00]" /> New Users (30d)
                    </h3>
                    <MiniBarChart data={stats.registrationsPerDay.map((d: any) => Number(d.count))} height={50} />
                    <p className="text-[10px] text-[#6F757C] mt-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {stats.registrationsPerDay.length} days · Total: {stats.registrationsPerDay.reduce((s: number, d: any) => s + Number(d.count), 0)}
                    </p>
                  </div>
                )}
                {/* Listings by category */}
                {stats.listingsByCategory?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                      <BarChart3 size={14} className="text-[#FF6A00]" /> Listings by Category
                    </h3>
                    <div className="flex items-center gap-4">
                      <MiniDonutChart data={stats.listingsByCategory.slice(0, 6).map((c: any, i: number) => ({ label: c.category, value: Number(c.count), color: CAT_COLORS[i] }))} size={80} />
                      <div className="flex-1 space-y-1">
                        {stats.listingsByCategory.slice(0, 5).map((c: any, i: number) => (
                          <div key={c.category} className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CAT_COLORS[i] }} />
                            <span className="truncate text-[#6F757C] capitalize">{c.category}</span>
                            <span className="ml-auto font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Users by Role + Top Cities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {stats.usersByRole?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                      <Users size={14} className="text-[#FF6A00]" /> Users by Role
                    </h3>
                    <div className="space-y-2">
                      {stats.usersByRole.map((r: any, i: number) => {
                        const pct = Math.round((Number(r.count) / stats.users) * 100);
                        return (
                          <div key={r.userType} className="flex items-center gap-3">
                            <span className="text-xs text-[#6F757C] w-20 capitalize truncate">{ROLE_LABELS[r.userType] || r.userType}</span>
                            <div className="flex-1 h-2 bg-[#E9E3DA] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: CAT_COLORS[i] }} />
                            </div>
                            <span className="text-xs font-bold w-8 text-right" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{r.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {stats.topCities?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                      <MapPin size={14} className="text-[#FF6A00]" /> Top Cities
                    </h3>
                    <div className="space-y-2">
                      {stats.topCities.slice(0, 6).map((c: any, i: number) => (
                        <div key={c.city} className="flex items-center gap-3">
                          <span className="text-xs text-[#6F757C] w-24 truncate">{c.city}</span>
                          <div className="flex-1 h-2 bg-[#E9E3DA] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.round((Number(c.count) / Number(stats.topCities[0].count)) * 100)}%`, background: CAT_COLORS[i] }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ━━━ USERS TAB ━━━ */}
          {tab === 'users' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" placeholder="Search name, phone, email..." value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadUsers()}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00]" />
                </div>
                <select value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); }}
                  className="px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm text-[#6F757C] focus:outline-none focus:border-[#FF6A00]">
                  <option value="">All Roles</option>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={userStatusFilter} onChange={e => { setUserStatusFilter(e.target.value); }}
                  className="px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm text-[#6F757C] focus:outline-none focus:border-[#FF6A00]">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                  <option value="inactive">Inactive</option>
                  <option value="verified">Verified</option>
                </select>
                <button onClick={() => loadUsers()} className="px-4 py-2.5 bg-[#FF6A00] text-white rounded-lg text-sm font-medium flex items-center gap-1.5">
                  <Filter size={14} /> Filter
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E9E3DA] bg-[#f9f7f4]">
                        <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6F757C] uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>User</th>
                        <th className="text-left px-3 py-3 text-[11px] font-medium text-[#6F757C] uppercase hidden sm:table-cell" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Role</th>
                        <th className="text-center px-3 py-3 text-[11px] font-medium text-[#6F757C] uppercase hidden md:table-cell" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Status</th>
                        <th className="text-right px-4 py-3 text-[11px] font-medium text-[#6F757C] uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map(u => (
                        <tr key={u.id} className="border-b border-[#E9E3DA]/50 hover:bg-[#f9f7f4] transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                            <p className="text-[11px] text-[#6F757C]">{u.phone} {u.email && `· ${u.email}`}</p>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            {roleChangeId === u.id ? (
                              <div className="flex items-center gap-1">
                                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="text-xs px-2 py-1 border rounded">
                                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'super_admin').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                                <button onClick={() => handleRoleChange(u.id)} disabled={actionId === u.id} className="text-[10px] px-2 py-1 bg-[#FF6A00] text-white rounded">Go</button>
                                <button onClick={() => setRoleChangeId(null)} className="text-[10px] px-2 py-1 bg-gray-200 rounded">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => { setRoleChangeId(u.id); setSelectedRole(u.userType); }}
                                className="px-2 py-1 text-[10px] font-bold rounded bg-[#E9E3DA] text-[#6F757C] hover:bg-[#d1cbc2] capitalize" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                                {ROLE_LABELS[u.userType] || u.userType}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {u.isVerified && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-700 rounded">VERIFIED</span>}
                              {u.isBanned && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded">BANNED</span>}
                              {!u.isActive && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-600 rounded">INACTIVE</span>}
                              {!u.isVerified && !u.isBanned && u.isActive && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-600 rounded">ACTIVE</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleVerifyUser(u.id)} disabled={actionId === u.id}
                                className={`p-1.5 rounded-lg transition-colors ${u.isVerified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                                title={u.isVerified ? 'Unverify' : 'Verify'}>
                                <UserCheck size={14} />
                              </button>
                              <button onClick={() => handleBanUser(u.id, !u.isBanned)} disabled={actionId === u.id || u.userType === 'super_admin'}
                                className={`p-1.5 rounded-lg transition-colors ${u.isBanned ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                                title={u.isBanned ? 'Unban' : 'Ban'}>
                                {u.isBanned ? <Unlock size={14} /> : <Ban size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {usersPagination && usersPagination.pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#E9E3DA] bg-[#f9f7f4]">
                    <span className="text-xs text-[#6F757C]">{usersPagination.total} users</span>
                    <div className="flex items-center gap-2">
                      <button disabled={usersPagination.page <= 1} onClick={() => loadUsers(usersPagination.page - 1)} className="p-1.5 rounded border border-[#E9E3DA] disabled:opacity-40"><ChevronLeft size={14} /></button>
                      <span className="text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{usersPagination.page}/{usersPagination.pages}</span>
                      <button disabled={usersPagination.page >= usersPagination.pages} onClick={() => loadUsers(usersPagination.page + 1)} className="p-1.5 rounded border border-[#E9E3DA] disabled:opacity-40"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ━━━ LISTINGS TAB ━━━ */}
          {tab === 'listings' && (
            <div className="space-y-4">
              {/* Pending Queue */}
              {pending.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-2">
                  <h3 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2"><Clock size={14} /> {pending.length} Pending Approval</h3>
                  <div className="space-y-2">
                    {pending.map(l => (
                      <div key={l.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{l.make} {l.model}</p>
                          <p className="text-[11px] text-[#6F757C]">by {l.owner?.firstName} {l.owner?.lastName} · ₹{Number(l.price).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleListingAction(l.id, 'approve')} disabled={actionId === l.id}
                            className="text-[11px] px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"><CheckCircle size={12} className="inline mr-1" />Approve</button>
                          <button onClick={() => handleListingAction(l.id, 'reject')} disabled={actionId === l.id}
                            className="text-[11px] px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-medium disabled:opacity-50"><XCircle size={12} className="inline mr-1" />Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" placeholder="Search make, model..." value={listingSearch}
                    onChange={e => setListingSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadListings()}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00]" />
                </div>
                <select value={listingStatusFilter} onChange={e => setListingStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm text-[#6F757C] focus:outline-none focus:border-[#FF6A00]">
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="sold">Sold</option>
                </select>
                <button onClick={() => loadListings()} className="px-4 py-2.5 bg-[#FF6A00] text-white rounded-lg text-sm font-medium flex items-center gap-1.5"><Filter size={14} /> Filter</button>
              </div>

              {/* Listings Table */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E9E3DA] bg-[#f9f7f4]">
                        <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6F757C] uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Listing</th>
                        <th className="text-center px-3 py-3 text-[11px] font-medium text-[#6F757C] uppercase hidden sm:table-cell" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Status</th>
                        <th className="text-right px-3 py-3 text-[11px] font-medium text-[#6F757C] uppercase hidden sm:table-cell" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Price</th>
                        <th className="text-right px-4 py-3 text-[11px] font-medium text-[#6F757C] uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allListings.map(l => (
                        <tr key={l.id} className="border-b border-[#E9E3DA]/50 hover:bg-[#f9f7f4] transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm">{l.make} {l.model}</p>
                            <p className="text-[11px] text-[#6F757C]">{l.owner?.firstName} {l.owner?.lastName} · {l.category}</p>
                          </td>
                          <td className="px-3 py-3 text-center hidden sm:table-cell">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${STATUS_BADGE[l.status] || 'bg-gray-100 text-gray-600'}`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                              {l.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right hidden sm:table-cell font-bold text-[#FF6A00]">{formatPrice(l.price)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {l.status === 'pending' && (
                                <>
                                  <button onClick={() => handleListingAction(l.id, 'approve')} disabled={actionId === l.id} className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded font-medium">✓</button>
                                  <button onClick={() => handleListingAction(l.id, 'reject')} disabled={actionId === l.id} className="text-[10px] px-2 py-1 bg-red-100 text-red-700 rounded font-medium">✕</button>
                                </>
                              )}
                              <button onClick={() => handleFeature(l.id)} disabled={actionId === l.id}
                                className={`p-1.5 rounded-lg transition-colors ${l.isFeatured ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'}`}
                                title={l.isFeatured ? 'Unfeature' : 'Feature'}>
                                <Star size={14} className={l.isFeatured ? 'fill-yellow-500' : ''} />
                              </button>
                              <Link to={`/listing/${l.id}`} className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Eye size={14} /></Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {listingsPagination && listingsPagination.pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#E9E3DA] bg-[#f9f7f4]">
                    <span className="text-xs text-[#6F757C]">{listingsPagination.total} listings</span>
                    <div className="flex items-center gap-2">
                      <button disabled={listingsPagination.page <= 1} onClick={() => loadListings(listingsPagination.page - 1)} className="p-1.5 rounded border border-[#E9E3DA] disabled:opacity-40"><ChevronLeft size={14} /></button>
                      <span className="text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{listingsPagination.page}/{listingsPagination.pages}</span>
                      <button disabled={listingsPagination.page >= listingsPagination.pages} onClick={() => loadListings(listingsPagination.page + 1)} className="p-1.5 rounded border border-[#E9E3DA] disabled:opacity-40"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ━━━ ANALYTICS TAB ━━━ */}
          {tab === 'analytics' && stats && (
            <div className="space-y-6">
              {/* Big registration chart */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-6">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  <TrendingUp size={16} className="text-[#FF6A00]" /> User Registrations — Last 30 Days
                </h3>
                {stats.registrationsPerDay?.length > 0 ? (
                  <div>
                    <MiniBarChart data={stats.registrationsPerDay.map((d: any) => Number(d.count))} height={100} color="#FF6A00" />
                    <div className="flex justify-between mt-2 text-[10px] text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      <span>{stats.registrationsPerDay[0]?.date}</span>
                      <span>{stats.registrationsPerDay[stats.registrationsPerDay.length - 1]?.date}</span>
                    </div>
                  </div>
                ) : <p className="text-sm text-[#6F757C]">No registration data available.</p>}
              </div>

              {/* Category & City breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-6">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                    <Package size={16} className="text-[#FF6A00]" /> Listings by Category
                  </h3>
                  <div className="flex items-center gap-6">
                    {stats.listingsByCategory?.length > 0 && (
                      <MiniDonutChart data={stats.listingsByCategory.slice(0, 8).map((c: any, i: number) => ({ label: c.category, value: Number(c.count), color: CAT_COLORS[i] }))} size={120} />
                    )}
                    <div className="flex-1 space-y-2">
                      {stats.listingsByCategory?.slice(0, 8).map((c: any, i: number) => (
                        <div key={c.category} className="flex items-center gap-2 text-xs">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: CAT_COLORS[i] }} />
                          <span className="truncate text-[#6F757C] capitalize flex-1">{c.category}</span>
                          <span className="font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-6">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                    <Globe size={16} className="text-[#FF6A00]" /> Top Cities
                  </h3>
                  <div className="space-y-3">
                    {stats.topCities?.slice(0, 8).map((c: any, i: number) => {
                      const maxCount = Number(stats.topCities[0]?.count || 1);
                      return (
                        <div key={c.city}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-[#6F757C]">{c.city}</span>
                            <span className="font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.count}</span>
                          </div>
                          <div className="h-2 bg-[#E9E3DA] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(Number(c.count) / maxCount) * 100}%`, background: CAT_COLORS[i] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Revenue & Platform Health */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#FF6A00] to-[#FF8C38] rounded-xl p-6 text-white">
                  <DollarSign size={24} className="mb-3 opacity-80" />
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(stats.revenue || 0)}</p>
                  <p className="text-xs opacity-80 mt-1">Total Booking Revenue</p>
                </div>
                <div className="bg-gradient-to-br from-[#3B82F6] to-[#6366F1] rounded-xl p-6 text-white">
                  <Award size={24} className="mb-3 opacity-80" />
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{stats.activeSubscriptions || 0}</p>
                  <p className="text-xs opacity-80 mt-1">Active Subscriptions</p>
                </div>
                <div className="bg-gradient-to-br from-[#10B981] to-[#14B8A6] rounded-xl p-6 text-white">
                  <Activity size={24} className="mb-3 opacity-80" />
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{stats.todayActivity || 0}</p>
                  <p className="text-xs opacity-80 mt-1">Actions Today</p>
                </div>
              </div>
            </div>
          )}

          {/* ━━━ CERTIFICATIONS TAB ━━━ */}
          {tab === 'certifications' && (
            <>
              <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Pending Certifications</h2>
              {pendingCerts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-8 text-center">
                  <Shield size={32} className="mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-[#6F757C]">No certifications awaiting review.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCerts.map(c => (
                    <div key={c.id} className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{c.documentName}</h3>
                          <p className="text-xs text-[#6F757C] mt-0.5">
                            {c.certificationType} · by {c.applicant?.firstName} {c.applicant?.lastName} ({c.applicant?.userType})
                            {c.documentNumber && <> · #{c.documentNumber}</>}
                          </p>
                          {c.issuingAuthority && <p className="text-xs text-[#6F757C]">Authority: {c.issuingAuthority}</p>}
                        </div>
                        {c.documentImage && (
                          <a href={c.documentImage} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center gap-1">
                            <Eye size={12} /> View Doc
                          </a>
                        )}
                      </div>
                      {notesId === c.id && (
                        <input type="text" placeholder="Admin notes (optional)…" value={adminNotes}
                          onChange={e => setAdminNotes(e.target.value)}
                          className="w-full px-3 py-2 mb-3 text-sm bg-[#E9E3DA] border border-[#D1CBC2] rounded-lg focus:outline-none" />
                      )}
                      <div className="flex gap-2">
                        {notesId !== c.id && <button onClick={() => { setNotesId(c.id); setAdminNotes(''); }} className="text-xs px-3 py-1.5 bg-[#E9E3DA] text-[#6F757C] rounded-lg">Add Notes</button>}
                        <button onClick={() => handleCertAction(c.id, 'approved')} disabled={actionId === c.id}
                          className="text-xs px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"><CheckCircle size={12} className="inline mr-1" /> Approve</button>
                        <button onClick={() => handleCertAction(c.id, 'rejected')} disabled={actionId === c.id}
                          className="text-xs px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium disabled:opacity-50"><XCircle size={12} className="inline mr-1" /> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ━━━ FRAUD TAB ━━━ */}
          {tab === 'fraud' && (
            <>
              <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Open Fraud Reports</h2>
              {fraudReports.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-8 text-center">
                  <AlertTriangle size={32} className="mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-[#6F757C]">No open fraud reports. 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fraudReports.map(r => (
                    <div key={r.id} className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'investigating' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>{r.status}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E9E3DA] text-[#6F757C] capitalize">{r.targetType}</span>
                          </div>
                          <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{REASON_LABELS[r.reason] || r.reason}</h3>
                          <p className="text-xs text-[#6F757C] mt-0.5">Reported by {r.reporter?.firstName} {r.reporter?.lastName} · ID: {r.targetId?.slice(0, 8)}…</p>
                        </div>
                        <p className="text-[10px] text-[#6F757C] shrink-0" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <p className="text-xs text-[#101214] bg-[#f5f3ef] rounded-lg p-3 mb-3">{r.description}</p>
                      {notesId === r.id && (
                        <input type="text" placeholder="Admin notes…" value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                          className="w-full px-3 py-2 mb-3 text-sm bg-[#E9E3DA] border border-[#D1CBC2] rounded-lg focus:outline-none" />
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {notesId !== r.id && <button onClick={() => { setNotesId(r.id); setAdminNotes(''); }} className="text-xs px-3 py-1.5 bg-[#E9E3DA] text-[#6F757C] rounded-lg">Notes</button>}
                        {r.status === 'pending' && (
                          <button onClick={() => handleFraudAction(r.id, 'investigating')} disabled={actionId === r.id}
                            className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg font-medium disabled:opacity-50"><Clock size={12} className="inline mr-1" /> Investigate</button>
                        )}
                        <button onClick={() => handleFraudAction(r.id, 'resolved')} disabled={actionId === r.id}
                          className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-medium disabled:opacity-50"><AlertTriangle size={12} className="inline mr-1" /> Resolve</button>
                        <button onClick={() => handleFraudAction(r.id, 'dismissed')} disabled={actionId === r.id}
                          className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium disabled:opacity-50"><XCircle size={12} className="inline mr-1" /> Dismiss</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ━━━ ACTIVITY LOG TAB ━━━ */}
          {tab === 'activity' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] overflow-hidden">
                {activityLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <Activity size={32} className="mx-auto text-[#6F757C] mb-2 opacity-40" />
                    <p className="text-sm text-[#6F757C]">No activity logs yet. They will appear as users interact with the platform.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E9E3DA]/50">
                    {activityLogs.map(log => (
                      <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-[#f9f7f4] transition-colors">
                        <span className={`mt-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded ${SEVERITY_BADGE[log.severity] || 'bg-blue-500/20 text-blue-400'}`}>{log.severity?.toUpperCase()}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ACTION_LABELS[log.action] || log.action}</p>
                          {log.user && <p className="text-[11px] text-[#6F757C]">{log.user.firstName} {log.user.lastName} ({log.user.userType})</p>}
                          {log.targetType && <p className="text-[10px] text-[#6F757C]">{log.targetType}: {log.targetId?.slice(0, 8)}…</p>}
                        </div>
                        <span className="text-[10px] text-[#6F757C] shrink-0" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                          {new Date(log.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {activityPagination && activityPagination.pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#E9E3DA] bg-[#f9f7f4]">
                    <span className="text-xs text-[#6F757C]">{activityPagination.total} entries</span>
                    <div className="flex items-center gap-2">
                      <button disabled={activityPagination.page <= 1} onClick={() => loadActivity(activityPagination.page - 1)} className="p-1.5 rounded border border-[#E9E3DA] disabled:opacity-40"><ChevronLeft size={14} /></button>
                      <span className="text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{activityPagination.page}/{activityPagination.pages}</span>
                      <button disabled={activityPagination.page >= activityPagination.pages} onClick={() => loadActivity(activityPagination.page + 1)} className="p-1.5 rounded border border-[#E9E3DA] disabled:opacity-40"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
