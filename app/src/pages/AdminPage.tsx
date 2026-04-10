import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, certificationsApi, fraudApi } from '../services/api';
import { ArrowLeft, Loader2, Users, Package, Wrench, Gauge, Calendar, Star, CheckCircle, XCircle, Clock, Shield, AlertTriangle, Eye } from 'lucide-react';
import PageShell from '../components/PageShell';

type Tab = 'overview' | 'listings' | 'certifications' | 'fraud';

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
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesId, setNotesId] = useState<string | null>(null);

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

  const handleListingAction = async (id: string, action: 'approve' | 'reject') => {
    setActionId(id);
    try {
      if (action === 'approve') await adminApi.approveListing(id); else await adminApi.rejectListing(id);
      setPending(prev => prev.filter(l => l.id !== id));
      if (stats) setStats({ ...stats, pendingListings: stats.pendingListings - 1 });
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

  if (authLoading || loading) return <PageShell breadcrumb="Admin"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  if (!isAdmin) return (
    <PageShell breadcrumb="Admin">
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><XCircle size={32} className="text-red-500" /></div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Access Denied</h1>
          <p className="text-sm text-[#6F757C] mb-6">You don't have permission to view the admin dashboard. Admin role required.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5"><ArrowLeft size={16} /> Back to Home</Link>
        </div>
      </div>
    </PageShell>
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

  const tabs: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Gauge },
    { key: 'listings', label: 'Listings', icon: Package, badge: pending.length },
    { key: 'certifications', label: 'Certifications', icon: Shield, badge: pendingCerts.length },
    { key: 'fraud', label: 'Fraud Reports', icon: AlertTriangle, badge: fraudReports.length },
  ];

  const REASON_LABELS: Record<string, string> = {
    fake_listing: 'Fake Listing', misleading_photos: 'Misleading Photos', scam_pricing: 'Scam Pricing',
    stolen_equipment: 'Stolen Equipment', impersonation: 'Impersonation', spam: 'Spam', other: 'Other'
  };

  return (
    <PageShell breadcrumb="Admin" backTo="/" backLabel="Home">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem' }}>Admin Dashboard</h1>

        {/* Tabs */}
        <div className="chip-scroll mb-6 bg-white rounded-lg p-1 shadow-sm border border-[#E9E3DA]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-[#FF6A00] text-white' : 'text-[#6F757C] hover:bg-[#E9E3DA]'}`}>
              <t.icon size={15} /> {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t.key ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cards.map(c => (
              <div key={c.label} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-5">
                <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}><c.icon size={20} /></div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{c.value}</p>
                <p className="text-xs text-[#6F757C] uppercase tracking-wider mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pending Listings Tab */}
        {tab === 'listings' && (
          <>
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
                      <button onClick={() => handleListingAction(l.id, 'approve')} disabled={actionId === l.id}
                        className="text-xs px-4 py-2 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1 disabled:opacity-50"><CheckCircle size={14} /> Approve</button>
                      <button onClick={() => handleListingAction(l.id, 'reject')} disabled={actionId === l.id}
                        className="text-xs px-4 py-2 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"><XCircle size={14} /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Certifications Tab */}
        {tab === 'certifications' && (
          <>
            <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Pending Certifications</h2>
            {pendingCerts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-8 text-center">
                <Shield size={32} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm text-[#6F757C]">No certifications awaiting review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCerts.map(c => (
                  <div key={c.id} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{c.documentName}</h3>
                        <p className="text-xs text-[#6F757C] mt-0.5">
                          {c.certificationType} · by {c.applicant?.firstName} {c.applicant?.lastName} ({c.applicant?.userType})
                          {c.documentNumber && <> · #{c.documentNumber}</>}
                        </p>
                        {c.issuingAuthority && <p className="text-xs text-[#6F757C]">Authority: {c.issuingAuthority}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {c.documentImage && (
                          <a href={c.documentImage} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1">
                            <Eye size={12} /> View Doc
                          </a>
                        )}
                      </div>
                    </div>
                    {/* Notes input */}
                    {notesId === c.id && (
                      <input type="text" placeholder="Admin notes (optional)…" value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 mb-3 text-sm bg-[#E9E3DA] border border-[#D1CBC2] rounded-lg focus:outline-none" />
                    )}
                    <div className="flex gap-2">
                      {notesId !== c.id && (
                        <button onClick={() => { setNotesId(c.id); setAdminNotes(''); }}
                          className="text-xs px-3 py-1.5 bg-[#E9E3DA] text-[#6F757C] rounded border border-[#D1CBC2] hover:bg-[#D1CBC2]">Add Notes</button>
                      )}
                      <button onClick={() => handleCertAction(c.id, 'approved')} disabled={actionId === c.id}
                        className="text-xs px-4 py-2 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1 disabled:opacity-50"><CheckCircle size={14} /> Approve</button>
                      <button onClick={() => handleCertAction(c.id, 'rejected')} disabled={actionId === c.id}
                        className="text-xs px-4 py-2 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"><XCircle size={14} /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Fraud Reports Tab */}
        {tab === 'fraud' && (
          <>
            <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Open Fraud Reports</h2>
            {fraudReports.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-8 text-center">
                <AlertTriangle size={32} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm text-[#6F757C]">No open fraud reports.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fraudReports.map(r => (
                  <div key={r.id} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'investigating' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                            {r.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E9E3DA] text-[#6F757C] capitalize">{r.targetType}</span>
                        </div>
                        <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{REASON_LABELS[r.reason] || r.reason}</h3>
                        <p className="text-xs text-[#6F757C] mt-0.5">
                          Reported by {r.reporter?.firstName} {r.reporter?.lastName} · Target ID: {r.targetId?.slice(0, 8)}…
                        </p>
                      </div>
                      <p className="text-[10px] text-[#6F757C] shrink-0" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <p className="text-xs text-[#101214] bg-[#E9E3DA] rounded p-3 mb-3">{r.description}</p>
                    {/* Notes input */}
                    {notesId === r.id && (
                      <input type="text" placeholder="Admin notes…" value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 mb-3 text-sm bg-[#E9E3DA] border border-[#D1CBC2] rounded-lg focus:outline-none" />
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {notesId !== r.id && (
                        <button onClick={() => { setNotesId(r.id); setAdminNotes(''); }}
                          className="text-xs px-3 py-1.5 bg-[#E9E3DA] text-[#6F757C] rounded border border-[#D1CBC2] hover:bg-[#D1CBC2]">Add Notes</button>
                      )}
                      {r.status === 'pending' && (
                        <button onClick={() => handleFraudAction(r.id, 'investigating')} disabled={actionId === r.id}
                          className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded border border-yellow-200 hover:bg-yellow-100 flex items-center gap-1 disabled:opacity-50"><Clock size={12} /> Investigate</button>
                      )}
                      <button onClick={() => handleFraudAction(r.id, 'resolved')} disabled={actionId === r.id}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"><AlertTriangle size={12} /> Resolve (Action)</button>
                      <button onClick={() => handleFraudAction(r.id, 'dismissed')} disabled={actionId === r.id}
                        className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1 disabled:opacity-50"><XCircle size={12} /> Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
    </PageShell>
  );
}
