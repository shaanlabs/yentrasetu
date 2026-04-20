import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi } from '../services/api';
import { Loader2, Calendar, CheckCircle, XCircle, Play, FileCheck, AlertTriangle, FileText } from 'lucide-react';
import PageShell from '../components/PageShell';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800', completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800', disputed: 'bg-purple-100 text-purple-800',
};

// State machine: what actions are available for each status/role
const ACTIONS: Record<string, { owner?: { label: string; status: string; icon: any; color: string }[]; renter?: { label: string; status: string; icon: any; color: string }[] }> = {
  pending: {
    owner: [
      { label: 'Confirm', status: 'confirmed', icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200' },
      { label: 'Reject', status: 'cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
    ],
    renter: [
      { label: 'Cancel', status: 'cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
    ],
  },
  confirmed: {
    owner: [
      { label: 'Mark Active', status: 'active', icon: Play, color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { label: 'Cancel', status: 'cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
    ],
    renter: [
      { label: 'Cancel', status: 'cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
    ],
  },
  active: {
    owner: [
      { label: 'Mark Completed', status: 'completed', icon: FileCheck, color: 'bg-green-50 text-green-700 border-green-200' },
    ],
    renter: [
      { label: 'Report Issue', status: 'cancelled', icon: AlertTriangle, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    ],
  },
  // No actions for completed, cancelled, disputed
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

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    bookingsApi.getMyBookings(role).then(d => setBookings(d.bookings)).catch(() => setBookings([])).finally(() => setLoading(false));
  }, [isAuthenticated, role]);

  const handleAction = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const reason = status === 'cancelled' ? prompt('Reason for cancellation (optional):') || undefined : undefined;
      await bookingsApi.updateStatus(id, status, reason);
      bookingsApi.getMyBookings(role).then(d => setBookings(d.bookings));
    } catch (err: any) {
      alert(err.message || 'Action failed');
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
        // Open invoice in a new window as formatted JSON (for demo)
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
              .info-box { background: white; padding: 16px; border-radius: 8px; border: 1px solid #E9E3DA; }
              .info-box .label { font-size: 11px; color: #6F757C; text-transform: uppercase; }
              .info-box .value { font-size: 14px; color: #101214; font-weight: 500; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; }
              th { background: #101214; color: white; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; }
              td { padding: 10px 12px; border-bottom: 1px solid #E9E3DA; font-size: 13px; }
              .total-row td { font-weight: 700; background: #FFF5EE; }
              .tax-section { background: white; padding: 16px; border-radius: 8px; border: 1px solid #E9E3DA; margin: 16px 0; }
              .notes { font-size: 12px; color: #6F757C; margin-top: 20px; }
              .notes li { margin-bottom: 4px; }
              @media print { body { background: white; } .no-print { display: none; } }
            </style></head><body>
            <div class="header">
              <div>
                <div class="logo">YantraSetu</div>
                <p style="font-size: 12px; color: #6F757C; margin: 4px 0;">${data.invoice.seller.name}</p>
                <p style="font-size: 11px; color: #6F757C;">${data.invoice.seller.address}</p>
                <p style="font-size: 11px; color: #6F757C;">GSTIN: ${data.invoice.seller.gstin}</p>
              </div>
              <div style="text-align: right;">
                <h1>TAX INVOICE</h1>
                <p style="font-size: 13px; color: #FF6A00; font-weight: 600;">${data.invoice.invoiceNumber}</p>
                <p style="font-size: 12px; color: #6F757C;">Date: ${data.invoice.invoiceDate}</p>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-box">
                <div class="label">Bill To (Renter)</div>
                <div class="value">${data.invoice.buyer.name}</div>
                <div style="font-size: 12px; color: #6F757C; margin-top: 4px;">
                  GSTIN: ${data.invoice.buyer.gstin}<br/>
                  ${data.invoice.buyer.city} ${data.invoice.buyer.state}
                </div>
              </div>
              <div class="info-box">
                <div class="label">Equipment Owner</div>
                <div class="value">${data.invoice.equipmentOwner.name}</div>
                <div style="font-size: 12px; color: #6F757C; margin-top: 4px;">
                  GSTIN: ${data.invoice.equipmentOwner.gstin}<br/>
                  ${data.invoice.equipmentOwner.city} ${data.invoice.equipmentOwner.state}
                </div>
              </div>
            </div>
            <h2>Line Items</h2>
            <table>
              <thead><tr><th>Description</th><th>SAC</th><th>Period/Qty</th><th style="text-align:right;">Amount (₹)</th></tr></thead>
              <tbody>
                ${data.invoice.items.map((item: any) => `<tr${item.isDeposit ? ' style="color:#6F757C;"' : ''}>
                  <td>${item.description}</td>
                  <td>${item.sacCode || '—'}</td>
                  <td>${item.period || item.quantity || '—'}</td>
                  <td style="text-align:right;">${Number(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>`).join('')}
              </tbody>
            </table>
            <div class="tax-section">
              <h2 style="margin-top:0;">Tax Breakdown</h2>
              <table>
                <tr><td>Taxable Value (Platform Fee)</td><td style="text-align:right;">₹${Number(data.invoice.taxableValue).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                ${data.invoice.gst.cgst ? `<tr><td>CGST @ ${data.invoice.gst.cgst.rate}%</td><td style="text-align:right;">₹${Number(data.invoice.gst.cgst.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
                ${data.invoice.gst.sgst ? `<tr><td>SGST @ ${data.invoice.gst.sgst.rate}%</td><td style="text-align:right;">₹${Number(data.invoice.gst.sgst.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
                ${data.invoice.gst.igst ? `<tr><td>IGST @ ${data.invoice.gst.igst.rate}%</td><td style="text-align:right;">₹${Number(data.invoice.gst.igst.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
                <tr class="total-row"><td><strong>Grand Total</strong></td><td style="text-align:right;"><strong>₹${Number(data.invoice.grandTotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td></tr>
              </table>
            </div>
            <div class="notes">
              <h2>Notes & Terms</h2>
              <ul>${data.invoice.notes.map((n: string) => `<li>${n}</li>`).join('')}</ul>
              ${data.invoice.terms ? `<ul>${data.invoice.terms.map((t: string) => `<li>${t}</li>`).join('')}</ul>` : ''}
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
        <div className="flex bg-white rounded-lg p-1 shadow-sm w-full sm:w-fit mb-8">
          {(['renter', 'owner'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} className={`flex-1 sm:flex-initial px-5 py-2.5 text-sm font-medium rounded-md capitalize transition-all ${role === r ? 'bg-[#101214] text-white' : 'text-[#6F757C]'}`} style={{ fontFamily: 'Sora, sans-serif' }}>As {r}</button>
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
            {bookings.map(b => {
              const actions = ACTIONS[b.status]?.[role] || [];
              return (
                <div key={b.id} className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5">
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#6F757C] mb-3">
                    <div><p className="font-medium">Rate</p><p className="text-sm text-[#101214] font-bold">{fmt(b.rentalRate)}/{b.rentalUnit}</p></div>
                    <div><p className="font-medium">Total</p><p className="text-sm text-[#FF6A00] font-bold">{fmt(b.totalAmount)}</p></div>
                    <div><p className="font-medium">Deposit</p><p className="text-sm text-[#101214]">{fmt(b.securityDeposit)}</p></div>
                  </div>
                  {/* Role-appropriate action buttons from state machine */}
                  {actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-[#E9E3DA]">
                      {actions.map(action => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.status}
                            onClick={() => handleAction(b.id, action.status)}
                            disabled={actionLoading === b.id}
                            className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-1 min-h-[36px] disabled:opacity-50 ${action.color}`}
                          >
                            {actionLoading === b.id ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                            {action.label}
                          </button>
                        );
                      })}
                      {/* GST Invoice button for confirmed/active/completed bookings */}
                      {['confirmed', 'active', 'completed'].includes(b.status) && (
                        <button
                          onClick={() => handleViewInvoice(b.id)}
                          className="text-xs px-3 py-2 rounded-lg border flex items-center gap-1 min-h-[36px] bg-[#F9F7F4] text-[#101214] border-[#E9E3DA] hover:border-[#FF6A00] transition-colors"
                        >
                          <FileText size={12} /> GST Invoice
                        </button>
                      )}
                    </div>
                  )}
                  {/* Show invoice button even when no other actions (completed bookings) */}
                  {actions.length === 0 && ['completed'].includes(b.status) && (
                    <div className="flex gap-2 pt-3 border-t border-[#E9E3DA]">
                      <button
                        onClick={() => handleViewInvoice(b.id)}
                        className="text-xs px-3 py-2 rounded-lg border flex items-center gap-1 min-h-[36px] bg-[#F9F7F4] text-[#101214] border-[#E9E3DA] hover:border-[#FF6A00] transition-colors"
                      >
                        <FileText size={12} /> View GST Invoice
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </PageShell>
  );
}
