import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { machineryApi, fraudApi, type MachineryListing } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, MapPin, Calendar, Gauge, Shield, User,
  Phone, Loader2, Share2, ChevronLeft, ChevronRight, IndianRupee,
  Flag, X, Upload, AlertTriangle
} from 'lucide-react';
import PageShell from '../components/PageShell';

const FRAUD_REASONS = [
  { value: 'fake_listing', label: 'Fake Listing' },
  { value: 'misleading_photos', label: 'Misleading Photos' },
  { value: 'scam_pricing', label: 'Scam Pricing' },
  { value: 'stolen_equipment', label: 'Stolen Equipment' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [listing, setListing] = useState<MachineryListing | null>(null);
  const [otherListings, setOtherListings] = useState<MachineryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);

  // Fraud report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: '', description: '', evidenceImages: [] as string[] });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const evidenceRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    machineryApi.getListing(id)
      .then((data) => {
        setListing(data.listing);
        setOtherListings(data.otherListingsFromSeller || []);
      })
      .catch((err) => setError(err.message || 'Listing not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <PageShell breadcrumb="Loading..." backTo="/browse" backLabel="Browse">
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#FF6A00]" />
        </div>
      </PageShell>
    );
  }

  if (error || !listing) {
    return (
      <PageShell breadcrumb="Not Found" backTo="/browse" backLabel="Browse">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem' }}>
            {error || 'Listing not found'}
          </h1>
          <Link to="/browse" className="text-[#FF6A00] hover:underline text-sm">
            ← Back to browse
          </Link>
        </div>
      </PageShell>
    );
  }

  const images = listing.images?.length ? listing.images : [];

  return (
    <PageShell
      breadcrumb={`${listing.make} ${listing.model}`}
      backTo="/browse"
      backLabel="Browse"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left — images + details */}
        <div className="lg:col-span-3">
          {/* Image gallery with CSS scroll-snap for mobile swipe */}
          <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-[#E9E3DA] mb-5">
            {images.length > 0 ? (
              <>
                {/* Mobile: horizontal scroll gallery */}
                <div
                  ref={galleryRef}
                  className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide sm:block"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${listing.make} ${listing.model} - Image ${i + 1}`}
                      className={`w-full h-[280px] sm:h-[400px] object-cover snap-center flex-shrink-0 ${
                        i === currentImage ? 'sm:block' : 'sm:hidden'
                      }`}
                    />
                  ))}
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage((p) => (p - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white transition-colors hidden sm:flex items-center justify-center"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentImage((p) => (p + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white transition-colors hidden sm:flex items-center justify-center"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === currentImage ? 'bg-[#FF6A00] w-6' : 'bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-[280px] sm:h-[400px] flex items-center justify-center bg-[#E9E3DA]">
                <Gauge size={64} className="text-[#6F757C] opacity-20" />
              </div>
            )}
            {/* Badges overlay */}
            <div className="absolute top-3 left-3 flex gap-2">
              <span
                className={`px-3 py-1.5 text-xs font-bold rounded ${
                  listing.listingType === 'rent' ? 'bg-blue-600 text-white' : 'bg-[#FF6A00] text-white'
                }`}
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {listing.listingType === 'rent' ? 'FOR RENT' : 'FOR SALE'}
              </span>
              {listing.isVerified && (
                <span
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded flex items-center gap-1"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  <Shield size={12} /> VERIFIED
                </span>
              )}
            </div>
          </div>

          {/* Machine Details */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6 mb-5">
            <h2
              className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Machine Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 sm:gap-x-6">
              {[
                ['Category', listing.category],
                ['Sub-Category', listing.subCategory],
                ['Make', listing.make],
                ['Model', listing.model],
                ['Year', listing.year],
                ['Condition', listing.condition],
                ['Hours Used', listing.hoursUsed ? `${listing.hoursUsed.toLocaleString()} hrs` : '—'],
                ['Location', [listing.city, listing.state].filter(Boolean).join(', ') || '—'],
                ['Views', listing.viewCount],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-[11px] text-[#6F757C] mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {label}
                  </p>
                  <p className="text-sm font-medium capitalize">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6">
              <h2
                className="font-semibold text-sm text-[#6F757C] mb-3 uppercase tracking-wider"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                Description
              </h2>
              <p className="text-sm text-[#101214] leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}
        </div>

        {/* Right — pricing + seller */}
        <div className="lg:col-span-2 space-y-5">
          {/* Price card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif', color: '#101214' }}>
              {listing.make} {listing.model}
            </h1>
            <div className="flex items-center gap-3 text-sm text-[#6F757C] mb-5 flex-wrap">
              {listing.year && <span className="flex items-center gap-1"><Calendar size={14} /> {listing.year}</span>}
              {listing.hoursUsed != null && <span className="flex items-center gap-1"><Gauge size={14} /> {listing.hoursUsed.toLocaleString()}h</span>}
              {listing.city && <span className="flex items-center gap-1"><MapPin size={14} /> {listing.city}</span>}
            </div>

            <div className="border-t border-[#E9E3DA] pt-5">
              {listing.listingType === 'rent' ? (
                <div className="space-y-2">
                  {listing.rentalRateDaily && <div className="flex justify-between text-sm"><span className="text-[#6F757C]">Daily</span><span className="font-bold">{formatPrice(listing.rentalRateDaily)}</span></div>}
                  {listing.rentalRateWeekly && <div className="flex justify-between text-sm"><span className="text-[#6F757C]">Weekly</span><span className="font-bold">{formatPrice(listing.rentalRateWeekly)}</span></div>}
                  {listing.rentalRateMonthly && <div className="flex justify-between text-sm"><span className="text-[#6F757C]">Monthly</span><span className="font-bold">{formatPrice(listing.rentalRateMonthly)}</span></div>}
                  {!listing.rentalRateDaily && !listing.rentalRateWeekly && !listing.rentalRateMonthly && (
                    <p className="text-2xl font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(listing.price)}</p>
                  )}
                </div>
              ) : (
                <p className="text-2xl font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(listing.price)}</p>
              )}
            </div>

            {/* Desktop CTA buttons */}
            <div className="hidden sm:flex gap-3 mt-6">
              <button className="btn-primary flex-1 text-sm py-3">
                <Phone size={16} /> Contact Seller
              </button>
              <button className="p-3 bg-[#E9E3DA] rounded-lg hover:bg-[#d9d3ca] transition-colors" title="Share">
                <Share2 size={18} className="text-[#101214]" />
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => { setShowReportModal(true); setReportMsg(''); }}
                  className="p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  title="Report this listing"
                >
                  <Flag size={18} className="text-red-500" />
                </button>
              )}
            </div>

            {listing.listingType === 'sale' && (
              <button
                onClick={() => navigate(`/loan-eligibility?amount=${listing.price}&equipment=${encodeURIComponent(listing.category || '')}`)}
                className="w-full mt-3 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 border-2 border-[#FF6A00] text-[#FF6A00] bg-[#FF6A00]/5 hover:bg-[#FF6A00] hover:text-white transition-all min-h-[44px]"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                <IndianRupee size={15} />
                Check Loan Eligibility
              </button>
            )}
          </div>

          {/* Seller card */}
          {listing.owner && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6">
              <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Seller</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#FF6A00]/10 rounded-full flex items-center justify-center">
                  <User size={22} className="text-[#FF6A00]" />
                </div>
                <div>
                  <p className="font-bold text-sm">{listing.owner.firstName} {listing.owner.lastName}</p>
                  {listing.owner.companyName && <p className="text-xs text-[#6F757C]">{listing.owner.companyName}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-[#E9E3DA] text-[#6F757C] text-xs rounded capitalize" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {listing.owner.userType}
                </span>
              </div>
            </div>
          )}

          {/* Other listings from seller */}
          {otherListings.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6">
              <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                More from this seller
              </h2>
              <div className="space-y-3">
                {otherListings.map((ol) => (
                  <Link
                    key={ol.id}
                    to={`/listing/${ol.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#E9E3DA] hover:border-[#FF6A00] transition-colors"
                  >
                    <div className="w-14 h-14 bg-[#E9E3DA] rounded-lg flex-shrink-0 overflow-hidden">
                      {ol.images?.[0] ? (
                        <img src={ol.images[0]} className="w-full h-full object-cover" />
                      ) : (
                        <Gauge size={20} className="m-auto mt-4 text-[#6F757C] opacity-30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ol.make} {ol.model}</p>
                      <p className="text-sm font-bold text-[#FF6A00]">{formatPrice(ol.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile Sticky CTA Bar ─── */}
      <div className="sticky-cta-bar sm:hidden">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {formatPrice(listing.price)}
          </p>
          <p className="text-[11px] text-[#6F757C] truncate">{listing.make} {listing.model}</p>
        </div>
        <button className="btn-primary text-sm py-3 px-5">
          <Phone size={16} /> Contact
        </button>
        <button className="p-3 bg-[#E9E3DA] rounded-lg" title="Share">
          <Share2 size={16} />
        </button>
      </div>

      {/* Fraud Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg p-5 sm:p-6 relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 p-2 hover:bg-[#E9E3DA] rounded-lg">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle size={20} className="text-red-500" />
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Report this Listing</h2>
            </div>

            {reportMsg && (
              <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${reportMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {reportMsg}
              </div>
            )}

            {!reportMsg.startsWith('✅') && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!reportForm.reason || !reportForm.description) { setReportMsg('Please select a reason and add a description.'); return; }
                setReportSubmitting(true); setReportMsg('');
                try {
                  await fraudApi.submit({ targetType: 'listing', targetId: listing.id, ...reportForm });
                  setReportMsg('✅ Report submitted. Our team will investigate.');
                  setReportForm({ reason: '', description: '', evidenceImages: [] });
                } catch (err: any) { setReportMsg(err.message || 'Failed to submit report.'); }
                finally { setReportSubmitting(false); }
              }}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Reason *</label>
                  <select
                    value={reportForm.reason}
                    onChange={e => setReportForm(p => ({ ...p, reason: e.target.value }))}
                    className="w-full px-3 py-3 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 min-h-[44px]"
                  >
                    <option value="">Select reason…</option>
                    {FRAUD_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Description *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the issue in detail…"
                    value={reportForm.description}
                    onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-3 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Evidence (optional)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {reportForm.evidenceImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg border border-[#E9E3DA] overflow-hidden">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReportForm(p => ({ ...p, evidenceImages: p.evidenceImages.filter((_, j) => j !== i) }))}
                          className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-bl-lg"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {reportForm.evidenceImages.length < 3 && (
                    <button
                      type="button"
                      onClick={() => evidenceRef.current?.click()}
                      className="text-xs px-3 py-2.5 border border-dashed border-[#D1CBC2] rounded-lg flex items-center gap-1 text-[#6F757C] hover:border-red-400 hover:text-red-500 transition-colors min-h-[44px]"
                    >
                      <Upload size={12} /> Add screenshot
                    </button>
                  )}
                  <input ref={evidenceRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || file.size > 3 * 1024 * 1024) return;
                    const reader = new FileReader();
                    reader.onload = () => setReportForm(p => ({ ...p, evidenceImages: [...p.evidenceImages, reader.result as string] }));
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-3 text-sm border border-[#E9E3DA] rounded-lg hover:bg-[#E9E3DA] transition-colors min-h-[44px]">
                    Cancel
                  </button>
                  <button type="submit" disabled={reportSubmitting} className="flex-1 py-3 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
                    {reportSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><Flag size={14} /> Submit Report</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
