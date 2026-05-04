import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { machineryApi, chatsApi, bookingsApi, reviewsApi, fraudApi, mlApi, type MachineryListing } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isSaved, toggleSaved } from './SavedListingsPage';
import {
  MapPin, Calendar, Gauge, Shield, User,
  Loader2, Share2, ChevronLeft, ChevronRight,
  Flag, X, Upload, AlertTriangle, Heart, MessageCircle,
  Star, Calculator, ExternalLink, ZoomIn, Copy, Check,
  TrendingDown, TrendingUp, Sparkles, ShieldCheck, BarChart3, ArrowRight,
  ShoppingCart, CheckCircle2
} from 'lucide-react';
import PageShell from '../components/PageShell';
import QuickBookModal from '../components/QuickBookModal';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
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
  const { isAuthenticated, user } = useAuth();

  const [listing, setListing] = useState<MachineryListing | null>(null);
  const [otherListings, setOtherListings] = useState<MachineryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(false);

  // Contact / Chat state
  const [contactLoading, setContactLoading] = useState(false);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Booking state (for rental listings)
  const [showBooking, setShowBooking] = useState(false);
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [bookingForm, setBookingForm] = useState({ startDate: '', endDate: '', withOperator: false, renterNotes: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');

  // EMI Calculator state (for sale listings)
  const [showEmi, setShowEmi] = useState(false);
  const [emiDown, setEmiDown] = useState(20);
  const [emiTenure, setEmiTenure] = useState(5);
  const [emiRate, setEmiRate] = useState(10);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [sellerRating, setSellerRating] = useState<number>(0);
  const [sellerReviewCount, setSellerReviewCount] = useState<number>(0);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  // Fraud report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: '', description: '', evidenceImages: [] as string[] });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const evidenceRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // ── AI State ──────────────────────────────────────────
  const [aiPriceAnalysis, setAiPriceAnalysis] = useState<any>(null);
  const [aiTrustScore, setAiTrustScore] = useState<any>(null);
  const [aiSimilar, setAiSimilar] = useState<any[]>([]);


  useEffect(() => {
    if (!id) return;
    setLoading(true);
    machineryApi.getListing(id)
      .then((data) => {
        setListing(data.listing);
        setOtherListings(data.otherListingsFromSeller || []);
        setSaved(isSaved(id));
        // Fetch seller reviews
        if (data.listing?.owner?.id) {
          reviewsApi.getReviews({ userId: data.listing.owner.id, limit: 3 })
            .then(r => {
              setReviews(r.reviews || []);
              if (r.reviews?.length > 0) {
                const avg = r.reviews.reduce((s: number, rv: any) => s + rv.rating, 0) / r.reviews.length;
                setSellerRating(Math.round(avg * 10) / 10);
              }
              setSellerReviewCount(r.pagination?.total || r.reviews?.length || 0);
            })
            .catch(() => {});
          // Fetch AI Trust Score
          mlApi.getSellerTrust(data.listing.owner.id)
            .then(t => setAiTrustScore(t))
            .catch(() => {});
        }
        // Fetch AI Price Analysis
        mlApi.analyzeListing(id!)
          .then(a => setAiPriceAnalysis(a))
          .catch(() => {});
        // Fetch AI Similar Listings
        mlApi.getSimilar(id!, 4)
          .then(s => setAiSimilar(s.listings || []))
          .catch(() => {});
        // Track view for recommendations
        mlApi.trackView(id!).catch(() => {});
      })
      .catch((err) => setError(err.message || 'Listing not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Handlers ──────────────────────────────────────────

  const handleContactSeller = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!listing?.owner?.id) return;
    setContactLoading(true);
    try {
      await chatsApi.startOrGet(listing.owner.id, listing.listingType, listing.id);
      navigate('/chats');
    } catch (err: any) {
      alert(err.message || 'Failed to start chat');
    } finally {
      setContactLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!listing) return;
    const text = `Hi, I'm interested in your ${listing.make} ${listing.model} (${listing.listingType === 'rent' ? 'Rental' : formatPrice(listing.price)}) listed on YantraSetu. ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: `${listing?.make} ${listing?.model} on YantraSetu`,
      text: `Check out this ${listing?.make} ${listing?.model} — ${listing?.listingType === 'rent' ? 'For Rent' : formatPrice(listing?.price || 0)}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch {}
    }
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSaved = () => {
    if (!id) return;
    const nowSaved = toggleSaved(id);
    setSaved(nowSaved);
  };

  const handleBooking = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!bookingForm.startDate || !bookingForm.endDate) { setBookingMsg('Please select start and end dates.'); return; }

    // Client-side date validation
    const today = new Date().toISOString().split('T')[0];
    if (bookingForm.startDate < today) { setBookingMsg('Start date cannot be in the past.'); return; }
    if (bookingForm.endDate <= bookingForm.startDate) { setBookingMsg('End date must be after the start date.'); return; }

    setBookingLoading(true); setBookingMsg('');
    try {
      await bookingsApi.create({
        listingId: listing?.id,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
        withOperator: bookingForm.withOperator,
        renterNotes: bookingForm.renterNotes,
      });
      setBookingMsg('✅ Booking request sent! The owner will confirm shortly.');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err: any) {
      setBookingMsg(err.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!isAuthenticated || !listing?.owner?.id) return;
    setReviewSubmitting(true); setReviewMsg('');
    try {
      await reviewsApi.createReview({
        revieweeId: listing.owner.id,
        reviewType: 'user',
        entityId: listing.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      setReviewMsg('✅ Review submitted!');
      setShowReviewForm(false);
      // Refresh reviews
      const r = await reviewsApi.getReviews({ userId: listing.owner.id, limit: 3 });
      setReviews(r.reviews || []);
    } catch (err: any) {
      setReviewMsg(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Computed ───────────────────────────────────────────

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  // Booking calculator
  const bookingDays = (() => {
    if (!bookingForm.startDate || !bookingForm.endDate) return 0;
    const diff = new Date(bookingForm.endDate).getTime() - new Date(bookingForm.startDate).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  })();
  const bookingRate = listing?.rentalRateDaily || listing?.price || 0;
  const bookingTotal = bookingRate * bookingDays;
  const bookingDeposit = bookingTotal * 0.2;
  const bookingCommission = bookingTotal * 0.1;
  const bookingGrandTotal = bookingTotal + bookingDeposit + bookingCommission;

  // EMI calculator
  const emiLoanAmount = (listing?.price || 0) * (1 - emiDown / 100);
  const emiMonthlyRate = emiRate / 12 / 100;
  const emiMonths = emiTenure * 12;
  const emiMonthly = emiMonthlyRate > 0
    ? (emiLoanAmount * emiMonthlyRate * Math.pow(1 + emiMonthlyRate, emiMonths)) / (Math.pow(1 + emiMonthlyRate, emiMonths) - 1)
    : emiLoanAmount / emiMonths;

  // ── Render ─────────────────────────────────────────────

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
    // Parse structured error from backend (code: DELETED/EXPIRED/REJECTED)
    const isGone = error?.includes('removed') || error?.includes('expired') || error?.includes('no longer');
    return (
      <PageShell breadcrumb="Listing Unavailable" backTo="/browse" backLabel="Browse">
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-[#EDE8E0] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6F757C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#101214' }}>
            {isGone ? 'This Listing Is No Longer Available' : 'Listing Not Found'}
          </h1>
          <p className="text-sm text-[#6F757C]">
            {isGone
              ? 'This listing may have been sold, expired, or removed by the seller. Browse similar equipment below.'
              : 'The listing you\'re looking for doesn\'t exist or the link may be broken.'}
          </p>
          <div className="flex gap-3 mt-2">
            <Link to="/browse" className="btn-primary px-5 py-3 text-sm rounded-lg">
              Browse All Listings
            </Link>
            <Link to="/" className="btn-secondary px-5 py-3 text-sm rounded-lg">
              Back to Home
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const images = listing.images?.length ? listing.images : [];
  const isOwner = user?.id === listing.owner?.id;

  return (
    <PageShell
      breadcrumb={`${listing.make} ${listing.model}`}
      backTo="/browse"
      backLabel="Browse"
    >
      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 ${!isOwner ? 'pb-36 sm:pb-0' : ''}`}>
        {/* Left — images + details */}
        <div className="lg:col-span-3">
          {/* Image gallery */}
          <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-[#EDE8E0] mb-5">
            {images.length > 0 ? (
              <>
                <div
                  ref={galleryRef}
                  className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide sm:block cursor-zoom-in"
                  style={{ scrollbarWidth: 'none' }}
                  onClick={() => setLightboxOpen(true)}
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
                      onClick={(e) => { e.stopPropagation(); setCurrentImage((p) => (p - 1 + images.length) % images.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white transition-colors hidden sm:flex items-center justify-center"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImage((p) => (p + 1) % images.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white transition-colors hidden sm:flex items-center justify-center"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === currentImage ? 'bg-[#FF6A00] w-6' : 'bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                {/* Zoom hint */}
                <div className="absolute top-3 right-3 hidden sm:flex items-center gap-1 px-2 py-1 bg-black/40 rounded text-white text-[10px]">
                  <ZoomIn size={12} /> Click to zoom
                </div>
              </>
            ) : (
              <div className="w-full h-[280px] sm:h-[400px] flex items-center justify-center bg-[#EDE8E0]">
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
          <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 mb-5">
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
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 mb-5">
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

          {/* ── Seller Reviews Section ── */}
          <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                Seller Reviews
              </h2>
              {sellerReviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold">{sellerRating}</span>
                  <span className="text-xs text-[#6F757C]">({sellerReviewCount})</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-sm text-[#6F757C]">No reviews yet for this seller.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="border-b border-[#EDE8E0] pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} className={s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                        ))}
                      </div>
                      <span className="text-xs text-[#6F757C]">
                        {r.reviewer?.firstName} {r.reviewer?.lastName}
                      </span>
                      <span className="text-[10px] text-[#6F757C]/50">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {r.title && <p className="text-sm font-medium">{r.title}</p>}
                    {r.comment && <p className="text-xs text-[#6F757C] mt-0.5">{r.comment}</p>}
                    {r.response && (
                      <div className="mt-2 pl-3 border-l-2 border-[#FF6A00]/30">
                        <p className="text-xs text-[#6F757C]"><span className="font-medium text-[#101214]">Seller:</span> {r.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Write review button */}
            {isAuthenticated && !isOwner && (
              <div className="mt-4 pt-4 border-t border-[#EDE8E0]">
                {reviewMsg && (
                  <div className={`px-3 py-2 rounded-lg text-xs mb-3 ${reviewMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {reviewMsg}
                  </div>
                )}
                {!showReviewForm ? (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="text-sm text-[#FF6A00] hover:underline flex items-center gap-1"
                  >
                    <Star size={14} /> Write a Review
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#6F757C] mb-1">Rating</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))}>
                            <Star size={20} className={s <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      placeholder="Review title (optional)"
                      value={reviewForm.title}
                      onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] min-h-[44px]"
                    />
                    <textarea
                      rows={3}
                      placeholder="Share your experience..."
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowReviewForm(false)} className="flex-1 py-2.5 text-sm border border-[#EDE8E0] rounded-lg hover:bg-[#EDE8E0] min-h-[44px]">Cancel</button>
                      <button
                        onClick={handleReviewSubmit}
                        disabled={reviewSubmitting}
                        className="flex-1 py-2.5 text-sm bg-[#FF6A00] text-white font-semibold rounded-lg hover:bg-[#e55f00] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        {reviewSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Submit'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* ── AI Similar Listings Section ── */}
          {aiSimilar.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 mt-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-[#6F757C]" />
                <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider font-mono">
                  Similar Listings
                </h2>
              </div>
              <div className="space-y-3">
                {aiSimilar.map((sl: any) => (
                  <Link
                    key={sl.id}
                    to={`/listing/${sl.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#EDE8E0] hover:border-purple-300 transition-colors group"
                  >
                    <div className="w-14 h-14 bg-[#EDE8E0] rounded-lg flex-shrink-0 overflow-hidden">
                      {sl.images?.[0] ? (
                        <img src={sl.images[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Gauge size={20} className="m-auto mt-4 text-[#6F757C] opacity-30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-purple-600 transition-colors">{sl.make} {sl.model}</p>
                      <p className="text-sm font-bold text-[#FF6A00]">{formatPrice(sl.price)}</p>
                      {sl.similarityScore && (
                        <span className="text-[10px] text-purple-500 font-medium">{Math.round(sl.similarityScore * 10)}% match</span>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-[#6F757C] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — pricing + seller + actions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Price card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif', color: '#101214' }}>
              {listing.make} {listing.model}
            </h1>
            <div className="flex items-center gap-3 text-sm text-[#6F757C] mb-5 flex-wrap">
              {listing.year && <span className="flex items-center gap-1"><Calendar size={14} /> {listing.year}</span>}
              {listing.hoursUsed != null && <span className="flex items-center gap-1"><Gauge size={14} /> {listing.hoursUsed.toLocaleString()}h</span>}
              {listing.city && <span className="flex items-center gap-1"><MapPin size={14} /> {listing.city}</span>}
            </div>

            <div className="border-t border-[#EDE8E0] pt-5">
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

            {/* ── CTA Buttons ── */}
            {!isOwner && (
              <div className="flex flex-col gap-3 mt-6">
                <div className="flex gap-3">
                  {/* Contact Seller → Start Chat */}
                  <button
                    onClick={handleContactSeller}
                    disabled={contactLoading}
                    className="btn-primary flex-1 text-sm py-3 flex items-center justify-center gap-2"
                  >
                    {contactLoading ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                    {contactLoading ? 'Connecting...' : 'Chat with Seller'}
                  </button>
                  {/* WhatsApp */}
                  <button
                    onClick={handleWhatsApp}
                    className="p-3 bg-[#25D366] text-white rounded-lg hover:bg-[#1fb855] transition-colors"
                    title="WhatsApp"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </button>
                  {/* Save */}
                  <button
                    onClick={handleToggleSaved}
                    className={`p-3 rounded-lg transition-colors ${saved ? 'bg-red-50 text-red-500' : 'bg-[#EDE8E0] text-[#6F757C]'}`}
                    title={saved ? 'Saved' : 'Save'}
                  >
                    <Heart size={18} className={saved ? 'fill-red-500' : ''} />
                  </button>
                  {/* Share */}
                  <button onClick={handleShare} className="p-3 bg-[#EDE8E0] rounded-lg hover:bg-[#d9d3ca] transition-colors" title="Share">
                    <Share2 size={18} className="text-[#101214]" />
                  </button>
                  {/* Report */}
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

              </div>
            )}

            {/* ── AI Price Verdict ── */}
            {aiPriceAnalysis && (
              <div className="mt-5 pt-5 border-t border-[#EDE8E0]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-purple-500" />
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>AI Price Analysis</span>
                </div>
                {(() => {
                  const verdict = aiPriceAnalysis.analysis?.verdict || aiPriceAnalysis.verdict;
                  const diff = aiPriceAnalysis.analysis?.diffPercent || 0;
                  const predicted = aiPriceAnalysis.prediction?.predicted || 0;
                  const verdictConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
                    great_deal: { icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: '🔥 Great Deal' },
                    below_market: { icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-50 border-green-100', label: 'Below Market' },
                    fair_price: { icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', label: 'Fair Price' },
                    above_market: { icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100', label: 'Above Market' },
                    overpriced: { icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-50 border-red-100', label: 'Overpriced' },
                  };
                  const vc = verdictConfig[verdict] || verdictConfig.fair_price;
                  const VerdictIcon = vc.icon;
                  return (
                    <div className={`p-3.5 rounded-lg border ${vc.bg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <VerdictIcon size={16} className={vc.color} />
                          <span className={`text-sm font-bold ${vc.color}`}>{vc.label}</span>
                        </div>
                        {diff !== 0 && (
                          <span className={`text-xs font-bold ${diff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {diff > 0 ? '+' : ''}{diff}%
                          </span>
                        )}
                      </div>
                      {predicted > 0 && (
                        <p className="text-xs text-[#6F757C]">
                          AI estimates market value at <span className="font-bold text-[#101214]">{formatPrice(predicted)}</span>
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}



            {/* EMI Calculator Toggle (Sale only) */}
            {listing.listingType === 'sale' && (
              <button
                onClick={() => setShowEmi(!showEmi)}
                className="w-full mt-3 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 border-2 border-[#FF6A00] text-[#FF6A00] bg-[#FF6A00]/5 hover:bg-[#FF6A00] hover:text-white transition-all min-h-[44px]"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                <Calculator size={15} /> {showEmi ? 'Hide EMI Calculator' : 'Calculate EMI'}
              </button>
            )}
          </div>

          {/* ── EMI Calculator Panel ── */}
          {showEmi && listing.listingType === 'sale' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
              <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                EMI Calculator
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-[#6F757C] mb-1">
                    <span>Down Payment</span><span className="font-medium text-[#101214]">{emiDown}% — {formatPrice(listing.price * emiDown / 100)}</span>
                  </div>
                  <input type="range" min={10} max={50} step={5} value={emiDown} onChange={e => setEmiDown(Number(e.target.value))}
                    className="w-full h-2 bg-[#EDE8E0] rounded-lg appearance-none cursor-pointer accent-[#FF6A00]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[#6F757C] mb-1">
                    <span>Tenure</span><span className="font-medium text-[#101214]">{emiTenure} years</span>
                  </div>
                  <input type="range" min={1} max={7} step={1} value={emiTenure} onChange={e => setEmiTenure(Number(e.target.value))}
                    className="w-full h-2 bg-[#EDE8E0] rounded-lg appearance-none cursor-pointer accent-[#FF6A00]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[#6F757C] mb-1">
                    <span>Interest Rate</span><span className="font-medium text-[#101214]">{emiRate}%</span>
                  </div>
                  <input type="range" min={8} max={16} step={0.5} value={emiRate} onChange={e => setEmiRate(Number(e.target.value))}
                    className="w-full h-2 bg-[#EDE8E0] rounded-lg appearance-none cursor-pointer accent-[#FF6A00]" />
                </div>
                <div className="bg-[#FF6A00]/5 rounded-lg p-4 text-center border border-[#FF6A00]/20">
                  <p className="text-xs text-[#6F757C] mb-1">Estimated Monthly EMI</p>
                  <p className="text-2xl font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {formatPrice(Math.round(emiMonthly))}
                  </p>
                  <p className="text-[10px] text-[#6F757C] mt-1">Loan: {formatPrice(Math.round(emiLoanAmount))} · {emiMonths} months</p>
                </div>
                <button
                  onClick={() => navigate(`/loan-eligibility?amount=${listing.price}&equipment=${encodeURIComponent(listing.category || '')}`)}
                  className="w-full py-2.5 text-sm text-[#FF6A00] hover:underline flex items-center justify-center gap-1"
                >
                  <ExternalLink size={14} /> Apply for Loan
                </button>
              </div>
            </div>
          )}

          {/* ── Availability Calendar ── */}
          {listing.listingType === 'rent' && (
            <AvailabilityCalendar
              bookedDates={[]}
              onSelect={(start, end) => {
                setBookingForm(prev => ({ ...prev, startDate: start, endDate: end }));
                setShowBooking(true);
              }}
            />
          )}

          {/* ── Booking Panel ── */}
          {showBooking && listing.listingType === 'rent' && (
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 sm:p-6">
              <h2 className="font-semibold text-sm text-blue-600 mb-4 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <Calendar size={14} /> Book This Equipment
              </h2>

              {bookingMsg && (
                <div className={`px-3 py-2 rounded-lg text-xs mb-4 ${bookingMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {bookingMsg}
                </div>
              )}

              {!bookingMsg.startsWith('✅') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#6F757C] mb-1">Start Date</label>
                      <input type="date" value={bookingForm.startDate} onChange={e => setBookingForm(p => ({ ...p, startDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-blue-400 min-h-[44px]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6F757C] mb-1">End Date</label>
                      <input type="date" value={bookingForm.endDate} onChange={e => setBookingForm(p => ({ ...p, endDate: e.target.value }))}
                        min={bookingForm.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-blue-400 min-h-[44px]" />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={bookingForm.withOperator} onChange={e => setBookingForm(p => ({ ...p, withOperator: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600" />
                    <span className="text-sm text-[#101214]">Include operator</span>
                  </label>

                  <textarea
                    rows={2} placeholder="Any special requirements? (optional)"
                    value={bookingForm.renterNotes} onChange={e => setBookingForm(p => ({ ...p, renterNotes: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none"
                  />

                  {/* Cost breakdown */}
                  {bookingDays > 0 && (
                    <div className="bg-blue-50/50 rounded-lg p-4 space-y-2 text-sm border border-blue-100">
                      <div className="flex justify-between"><span className="text-[#6F757C]">Rate × {bookingDays} days</span><span className="font-medium">{formatPrice(bookingTotal)}</span></div>
                      <div className="flex justify-between"><span className="text-[#6F757C]">Security Deposit (20%)</span><span className="font-medium">{formatPrice(bookingDeposit)}</span></div>
                      <div className="flex justify-between"><span className="text-[#6F757C]">Platform Fee (10%)</span><span className="font-medium">{formatPrice(bookingCommission)}</span></div>
                      <div className="flex justify-between border-t border-blue-200 pt-2 font-bold">
                        <span>Total</span><span className="text-blue-600">{formatPrice(bookingGrandTotal)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || bookingDays === 0}
                    className="w-full py-3 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {bookingLoading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                    {bookingLoading ? 'Submitting...' : 'Confirm Booking Request'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Seller card + AI Trust Score */}
          {listing.owner && (
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
              <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Seller</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#FF6A00]/10 rounded-full flex items-center justify-center">
                  <User size={22} className="text-[#FF6A00]" />
                </div>
                <div>
                  <p className="font-bold text-sm">{listing.owner.firstName} {listing.owner.lastName}</p>
                  {listing.owner.companyName && <p className="text-xs text-[#6F757C]">{listing.owner.companyName}</p>}
                  {sellerReviewCount > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium">{sellerRating}</span>
                      <span className="text-[10px] text-[#6F757C]">({sellerReviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mb-4">
                <span className="px-2.5 py-1 bg-[#EDE8E0] text-[#6F757C] text-xs rounded capitalize" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {listing.owner.userType}
                </span>
              </div>

              {/* ── AI Trust Score ── */}
              {aiTrustScore && (
                <div className="border-t border-[#EDE8E0] pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={14} className="text-purple-500" />
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>AI Trust Score</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Circular gauge */}
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EDE8E0" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke={aiTrustScore.trustScore?.score >= 70 ? '#22c55e' : aiTrustScore.trustScore?.score >= 40 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(aiTrustScore.trustScore?.score || 0) * 0.975} 97.5`}
                          style={{ transition: 'stroke-dasharray 1s ease' }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{aiTrustScore.trustScore?.score || 0}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold capitalize ${
                        aiTrustScore.trustScore?.label === 'excellent' ? 'text-green-600' :
                        aiTrustScore.trustScore?.label === 'good' ? 'text-green-500' :
                        aiTrustScore.trustScore?.label === 'average' ? 'text-yellow-600' : 'text-red-500'
                      }`}>{aiTrustScore.trustScore?.label || 'N/A'}</p>
                      {aiTrustScore.sentimentSummary && (
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] text-green-600">{aiTrustScore.sentimentSummary.positive} 👍</span>
                          <span className="text-[10px] text-[#6F757C]">{aiTrustScore.sentimentSummary.neutral} —</span>
                          <span className="text-[10px] text-red-500">{aiTrustScore.sentimentSummary.negative} 👎</span>
                        </div>
                      )}
                      <p className="text-[10px] text-[#6F757C] mt-0.5">{aiTrustScore.reviewCount || 0} reviews analyzed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other listings from seller */}
          {otherListings.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
              <h2 className="font-semibold text-sm text-[#6F757C] mb-4 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                More from this seller
              </h2>
              <div className="space-y-3">
                {otherListings.map((ol) => (
                  <Link
                    key={ol.id}
                    to={`/listing/${ol.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#EDE8E0] hover:border-[#FF6A00] transition-colors"
                  >
                    <div className="w-14 h-14 bg-[#EDE8E0] rounded-lg flex-shrink-0 overflow-hidden">
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
      {!isOwner && (
        <div className="sticky-cta-bar sm:hidden">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>
              {listing.listingType === 'rent'
                ? (listing.rentalRateDaily ? `${formatPrice(listing.rentalRateDaily)}/day`
                  : listing.rentalRateMonthly ? `${formatPrice(listing.rentalRateMonthly)}/mo`
                  : formatPrice(listing.price))
                : formatPrice(listing.price)}
            </p>
            <p className="text-[11px] text-[#6F757C] truncate">{listing.make} {listing.model}</p>
          </div>
          {listing.listingType === 'rent' ? (
            <button
              onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } setShowBooking(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="py-3 px-5 bg-blue-600 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Calendar size={15} /> Book
            </button>
          ) : null}
          <button onClick={handleContactSeller} disabled={contactLoading} className="btn-primary text-sm py-3 px-4">
            {contactLoading ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            Chat
          </button>
          <button onClick={handleWhatsApp} className="p-3 bg-[#25D366] text-white rounded-lg flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
          <button onClick={handleToggleSaved} className={`p-3 rounded-lg flex-shrink-0 ${saved ? 'bg-red-50 text-red-500' : 'bg-[#EDE8E0]'}`}>
            <Heart size={16} className={saved ? 'fill-red-500' : ''} />
          </button>
        </div>
      )}

      {/* ─── Image Lightbox ─── */}
      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10">
            <X size={28} />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {currentImage + 1} / {images.length}
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImage((p) => (p - 1 + images.length) % images.length); }}
                className="absolute left-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImage((p) => (p + 1) % images.length); }}
                className="absolute right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          <img
            src={images[currentImage]}
            alt={`${listing.make} ${listing.model}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ─── Share Modal ─── */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-sm p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>Share this listing</h2>
            <div className="space-y-3">
              <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#EDE8E0] hover:border-[#FF6A00] transition-colors text-sm min-h-[48px]">
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-[#6F757C]" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={() => { handleWhatsApp(); setShowShareModal(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#EDE8E0] hover:border-[#25D366] transition-colors text-sm min-h-[48px]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share via WhatsApp
              </button>
              <button
                onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${listing.make} ${listing.model} on YantraSetu`)}&url=${encodeURIComponent(window.location.href)}`, '_blank'); setShowShareModal(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#EDE8E0] hover:border-blue-400 transition-colors text-sm min-h-[48px]"
              >
                <ExternalLink size={18} className="text-blue-500" /> Share on Twitter
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-4 py-2.5 text-sm text-[#6F757C] hover:text-[#101214]">Cancel</button>
          </div>
        </div>
      )}

      {/* ─── Fraud Report Modal ─── */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg p-5 sm:p-6 relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 p-2 hover:bg-[#EDE8E0] rounded-lg">
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
                    className="w-full px-3 py-3 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 min-h-[44px]"
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
                    className="w-full px-3 py-3 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Evidence (optional)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {reportForm.evidenceImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg border border-[#EDE8E0] overflow-hidden">
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
                  <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-3 text-sm border border-[#EDE8E0] rounded-lg hover:bg-[#EDE8E0] transition-colors min-h-[44px]">
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
      {/* ── Quick Book Modal ── */}
      {showQuickBook && listing && listing.listingType === 'rent' && (
        <QuickBookModal
          listing={listing}
          onClose={() => setShowQuickBook(false)}
          aiPredictedPrice={aiPriceAnalysis?.prediction?.predicted}
        />
      )}
    </PageShell>
  );
}
