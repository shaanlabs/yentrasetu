import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi } from '../services/api';
import {
  Loader2, Calendar, CheckCircle, XCircle, Play, FileCheck,
  AlertTriangle, FileText, X, MapPin, Clock, Phone, Eye,
  Filter, ArrowRight
} from 'lucide-react';
import PageShell from '../components/PageShell';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800', completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800', disputed: 'bg-purple-100 text-purple-800',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-400', confirmed: 'bg-blue-400',
  active: 'bg-green-400 animate-pulse', completed: 'bg-gray-400',
  cancelled: 'bg-red-400', disputed: 'bg-purple-400',
};

// State machine: what actions are available for each status/role
const ACTIONS: Record<string, { owner?: { label: string; status: string; icon: any; color: string }[]; renter?: { label: string; status: string; icon: any; color: string }[] }> = {
  pending: {
    owner: [
      { label: 'Confirm', status: 'confirmed', icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200' },
      { label: 'Reject', status: 'cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
    ],
    renter: [
      { label: 'Cancel Booking', status: 'cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
    ],
  },
  confirmed: {
    owner: [
      { label: 'Mark Active', status: 'active', icon: Play, color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { label: 'Cancel', status: 'cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
    ],
    renter: [
      { label: 'Cancel Booking', status: 'cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
    ],
  },
  active: {
    owner: [
      { label: 'Mark Completed', status: 'completed', icon: FileCheck, color: 'bg-green-50 text-green-700 border-green-200' },
    ],
    renter: [
      { label: 'Report Issue', status: 'disputed', icon: AlertTriangle, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    ],
  },
  completed: {},
  cancelled: {},
  disputed: {},
};

export default function BookingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'renter' | 'owner'>('renter');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Cancel modal state
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    bookingsApi.getMyBookings(role).then(d => setBookings(d.bookings)).catch(() => setBookings([])).finally(() => setLoading(false));
  }, [isAuthenticated, role]);

  const filteredBookings = statusFilter
    ? bookings.filter(b => b.status === statusFilter)
    : bookings;

  const statusCounts = bookings.reduce((acc: Record<string, number>, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const handleAction = async (id: string, status: string) => {
    // If cancelling, show the cancel modal instead
    if (status === 'cancelled') {
      setCancelModalId(id);
      setCancelReason('');
      return;
    }

    setActionLoading(id);
    try {
      await bookingsApi.updateStatus(id, status);
      bookingsApi.getMyBookings(role).then(d => setBookings(d.bookings));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalId) return;
    setActionLoading(cancelModalId);
    try {
      await bookingsApi.updateStatus(cancelModalId, 'cancelled', cancelReason || undefined);
      setCancelModalId(null);
      setCancelReason('');
      bookingsApi.getMyBookings(role).then(d => setBookings(d.bookings));
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewInvoice = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/invoices/booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ys_token')}` },
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`
            <html><head><title>GST Invoice - ${data.invoice.invoiceNumber}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #F9F7F4; }
              .header { display: flex; justify-content: space-between; border-bottom: 3px solid #FF6A00; padding-bottom: 20px; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: 700; color: #FF6A00; }
              h1 { font-size: 18px; color: #101214; margin: 0; }
              h2 { font-size: 14px; color: #6F757C; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 10px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .info-box { background: white; padding: 16px; border-radius: 8px; border: 1px solid #EDE8E0; }
              .info-box .label { font-size: 11px; color: #6F757C; text-transform: uppercase; }
              .info-box .value { font-size: 14px; color: #101214; font-weight: 500; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; }
              th { background: #101214; color: white; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; }
              td { padding: 10px 12px; border-bottom: 1px solid #EDE8E0; font-size: 13px; }
              .total-row td { font-weight: 700; background: #FFF5EE; }
              .tax-section { background: white; padding: 16px; border-radius: 8px; border: 1px solid #EDE8E0; margin: 16px 0; }
              @media print { body { background: white; } .no-print { display: none; } }
            </style></head><body>
            <div class="header">
              <div><div class="logo">YantraSetu</div>
              <p style="font-size: 12px; color: #6F757C; margin: 4px 0;">${data.invoice.seller?.name || ''}</p></div>
              <div style="text-align: right;">
              <h1>TAX INVOICE</h1>
              <p style="font-size: 13px; color: #FF6A00; font-weight: 600;">${data.invoice.invoiceNumber}</p>
              <p style="font-size: 12px; color: #6F757C;">Date: ${data.invoice.invoiceDate}</p></div>
            </div>
            <div class="no-print" style="margin-top: 24px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 24px; background: #FF6A00; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">Print / Download PDF</button>
            </div>
            </body></html>
          `);
        }
      }
    } catch {
      alert('Failed to generate invoice');
    }
  };

  const fmt = (p: number) => `₹${Number(p).toLocaleString('en-IN')}`;

  if (authLoading) return <PageShell breadcrumb="Bookings"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  return (
    <PageShell breadcrumb="Bookings" backTo="/" backLabel="Home" title="My Bookings">
      {/* Role toggle + Status filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Role toggle */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          {(['renter', 'owner'] as const).map(r => (
            <button key={r} onClick={() => { setRole(r); setStatusFilter(''); }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-sm font-medium rounded-md capitalize transition-all ${role === r ? 'bg-[#101214] text-white' : 'text-[#6F757C]'}`}
              style={{ fontFamily: 'Sora, sans-serif' }}>
              As {r}
            </button>
          ))}
        </div>

        {/* Status filter chips */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <Filter size={14} className="text-[#6F757C]" />
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!statusFilter ? 'bg-[#FF6A00] text-white' : 'bg-white text-[#6F757C] border border-[#EDE8E0]'}`}>
            All ({bookings.length})
          </button>
          {Object.entries(statusCounts).map(([status, count]) => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === status ? 'bg-[#FF6A00] text-white' : 'bg-white text-[#6F757C] border border-[#EDE8E0] hover:border-[#FF6A00]'}`}>
              {status} ({count})
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
      : filteredBookings.length === 0 ? (
        <div className="text-center py-24">
          <Calendar size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
            {statusFilter ? `No ${statusFilter} bookings` : 'No bookings yet'}
          </h2>
          <p className="text-sm text-[#6F757C] mt-2 mb-6">
            {role === 'renter' ? 'Browse rental listings to get started.' : 'Your rental listings haven\'t been booked yet.'}
          </p>
          {role === 'renter' && (
            <Link to="/browse?type=rent" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6A00] text-white font-semibold rounded-xl text-sm hover:bg-[#e55f00]">
              Browse Equipment <ArrowRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(b => {
            const actions = ACTIONS[b.status]?.[role] || [];
            return (
              <div key={b.id} className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] overflow-hidden hover:shadow-md transition-shadow">
                {/* Status bar */}
                <div className={`px-5 py-2 flex items-center justify-between ${
                  b.status === 'active' ? 'bg-green-50 border-b border-green-200' :
                  b.status === 'pending' ? 'bg-yellow-50 border-b border-yellow-200' :
                  b.status === 'cancelled' ? 'bg-red-50 border-b border-red-100' :
                  'bg-[#F9F7F4] border-b border-[#EDE8E0]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[b.status] || 'bg-gray-400'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[b.status]?.split(' ')[1] || 'text-gray-600'}`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {b.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Booked {new Date(b.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="p-5">
                  {/* Machine info + link */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link to={`/listing/${b.listingId || b.listing?.id}`} className="font-bold text-sm hover:text-[#FF6A00] transition-colors flex items-center gap-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {b.listing?.make} {b.listing?.model} <Eye size={12} className="text-[#6F757C]" />
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-[#6F757C] mt-1.5">
                        <span className="flex items-center gap-1"><Calendar size={11} />{b.startDate} → {b.endDate}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{b.duration} days</span>
                        {b.listing?.city && <span className="flex items-center gap-1"><MapPin size={11} />{b.listing.city}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 bg-[#F9F7F4] rounded-lg">
                      <p className="text-[10px] text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>RATE</p>
                      <p className="text-sm font-bold text-[#101214]">{fmt(b.rentalRate)}<span className="text-xs font-normal text-[#6F757C]">/{b.rentalUnit}</span></p>
                    </div>
                    <div className="p-3 bg-[#FF6A00]/5 rounded-lg border border-[#FF6A00]/10">
                      <p className="text-[10px] text-[#FF6A00]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>TOTAL</p>
                      <p className="text-sm font-bold text-[#FF6A00]">{fmt(b.totalAmount)}</p>
                    </div>
                    <div className="p-3 bg-[#F9F7F4] rounded-lg">
                      <p className="text-[10px] text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>DEPOSIT</p>
                      <p className="text-sm font-bold text-[#101214]">{fmt(b.securityDeposit)}</p>
                    </div>
                  </div>

                  {/* Counterparty info */}
                  <div className="flex items-center gap-3 p-3 bg-[#F9F7F4] rounded-lg mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] text-xs font-bold">
                      {role === 'renter' ? (b.listing?.owner?.firstName?.[0] || 'O') : (b.renter?.firstName?.[0] || 'R')}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium">
                        {role === 'renter' ? `Owner: ${b.listing?.owner?.firstName || ''} ${b.listing?.owner?.lastName || ''}` : `Renter: ${b.renter?.firstName || ''} ${b.renter?.lastName || ''}`}
                      </p>
                      <p className="text-[10px] text-[#6F757C]">
                        {role === 'renter' ? b.listing?.owner?.phone : b.renter?.phone}
                      </p>
                    </div>
                    {b.status !== 'cancelled' && (
                      <a href={`tel:${role === 'renter' ? b.listing?.owner?.phone : b.renter?.phone}`}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                        <Phone size={14} />
                      </a>
                    )}
                  </div>

                  {/* Renter/owner notes */}
                  {b.renterNotes && (
                    <div className="px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 mb-3 border border-blue-100">
                      <strong>Notes:</strong> {b.renterNotes}
                    </div>
                  )}
                  {b.cancellationReason && (
                    <div className="px-3 py-2 bg-red-50 rounded-lg text-xs text-red-700 mb-3 border border-red-100">
                      <strong>Cancellation reason:</strong> {b.cancellationReason}
                    </div>
                  )}

                  {/* Action buttons */}
                  {(actions.length > 0 || ['confirmed', 'active', 'completed'].includes(b.status)) && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-[#EDE8E0]">
                      {actions.map(action => {
                        const Icon = action.icon;
                        return (
                          <button key={action.status}
                            onClick={() => handleAction(b.id, action.status)}
                            disabled={actionLoading === b.id}
                            className={`text-xs px-4 py-2.5 rounded-lg border flex items-center gap-1.5 min-h-[36px] disabled:opacity-50 font-medium ${action.color}`}>
                            {actionLoading === b.id ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                            {action.label}
                          </button>
                        );
                      })}
                      {['confirmed', 'active', 'completed'].includes(b.status) && (
                        <button onClick={() => handleViewInvoice(b.id)}
                          className="text-xs px-4 py-2.5 rounded-lg border flex items-center gap-1.5 min-h-[36px] bg-[#F9F7F4] text-[#101214] border-[#EDE8E0] hover:border-[#FF6A00] transition-colors font-medium">
                          <FileText size={12} /> GST Invoice
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCancelModalId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#EDE8E0] flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ fontFamily: 'Sora, sans-serif' }}>Cancel Booking</h3>
              <button onClick={() => setCancelModalId(null)} className="p-2 hover:bg-[#EDE8E0] rounded-full"><X size={16} /></button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-bold mb-1">Are you sure?</p>
                  <p>Cancelling this booking cannot be undone. The deposit may be forfeited depending on timing.</p>
                </div>
              </div>
              <label className="block text-[11px] font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                Reason for cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Project delayed, found cheaper option, etc."
                rows={3}
                className="w-full px-3 py-2.5 border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setCancelModalId(null)} className="flex-1 py-3 text-sm font-medium border border-[#EDE8E0] rounded-xl hover:bg-[#EDE8E0]/30">
                  Keep Booking
                </button>
                <button onClick={handleConfirmCancel} disabled={actionLoading === cancelModalId}
                  className="flex-1 py-3 text-sm font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading === cancelModalId ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
