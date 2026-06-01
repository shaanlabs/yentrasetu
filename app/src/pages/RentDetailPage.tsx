import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { machineryApi, chatsApi, bookingsApi, reviewsApi, fraudApi, mlApi, type MachineryListing } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isSaved, toggleSaved } from './SavedListingsPage';
import {
  MapPin, Calendar, Gauge, Shield, User,
  Loader2, Share2, ChevronLeft, ChevronRight,
  Flag, X, Upload, AlertTriangle, Heart, MessageCircle,
  Star, Calculator, ExternalLink, ZoomIn, Copy, Check,
  TrendingDown, TrendingUp, Sparkles, ShieldCheck, BarChart3, ArrowRight,
  Activity, Wifi, Cpu
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { useSEO } from '../hooks/useSEO';
import QuickBookModal from '../components/QuickBookModal';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

// Shadcn UI
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';

const FRAUD_REASONS = [
  { value: 'fake_listing', label: 'Fake Listing' },
  { value: 'misleading_photos', label: 'Misleading Photos' },
  { value: 'scam_pricing', label: 'Scam Pricing' },
  { value: 'stolen_equipment', label: 'Stolen Equipment' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

export default function RentDetailPage() {
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

  // Enquiry state (for sale listings)
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: user?.firstName || '', phone: '', city: user?.city || '', notes: '' });
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showIotModal, setShowIotModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Booking state (for rental listings)
  const [showBooking, setShowBooking] = useState(false);
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [bookingForm, setBookingForm] = useState({ startDate: '', endDate: '', withOperator: false, renterNotes: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');

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

  // ── SEO & JSON-LD Schema ──────────────────────────────
  const actualId = id && id.length > 36 ? id.slice(-36) : id;
  const seoSchema = listing ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${listing.make} ${listing.model}`,
    "image": listing.images?.[0] || '',
    "description": listing.description || `${listing.year ? listing.year + ' ' : ''}${listing.make} ${listing.model} ${listing.category} available for ${listing.listingType === 'rent' ? 'rent' : 'sale'} in ${listing.city || 'India'}.`,
    "sku": actualId,
    "brand": {
      "@type": "Brand",
      "name": listing.make
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": listing.price,
      "itemCondition": "https://schema.org/UsedCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": listing.owner?.firstName ? `${listing.owner.firstName} ${listing.owner.lastName}` : 'YantraSetu Verified Seller'
      }
    }
  } : undefined;

  useSEO({
    title: listing ? `${listing.year ? listing.year + ' ' : ''}${listing.make} ${listing.model}` : 'Loading...',
    description: listing?.description?.substring(0, 160) || `Buy, sell, or rent ${listing?.make} ${listing?.model} on YantraSetu.`,
    ogImage: listing?.images?.[0],
    schema: seoSchema
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    machineryApi.getListing(actualId)
      .then((data) => {
        setListing(data.listing);
        setOtherListings(data.otherListingsFromSeller || []);
        setSaved(isSaved(actualId));
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
        mlApi.analyzeListing(actualId!)
          .then(a => setAiPriceAnalysis(a))
          .catch(() => {});
        // Fetch AI Similar Listings
        mlApi.getSimilar(actualId!, 4)
          .then(s => setAiSimilar(s.listings || []))
          .catch(() => {});
        // Track view for recommendations
        mlApi.trackView(actualId!).catch(() => {});
      })
      .catch((err) => setError(err.message || 'Listing not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Handlers ──────────────────────────────────────────

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: `/rent/${id}` } });
      return;
    }
    setContactLoading(true);
    try {
      const data = await chatsApi.startOrGet(listing!.owner!.id as string, listing!.listingType || 'rent', listing!.id);
      navigate(`/chats?id=${data.chat.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start chat.');
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

  const handleToggleSaved = () => {
    if (!actualId) return;
    const nowSaved = toggleSaved(actualId);
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
            <AlertTriangle size={32} className="text-[#6F757C]" />
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
            <Button onClick={() => navigate('/browse')} className="bg-[#101214] text-white hover:bg-[#202428]">
              Browse All Listings
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="border-[#EDE8E0]">
              Back to Home
            </Button>
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
      seoTitle={`Rent ${listing.make} ${listing.model} - ${listing.city || 'India'} | YantraSetu`}
      seoDescription={`Rent ${listing.make} ${listing.model} starting from ${formatPrice(listing.rentalRateMonthly || listing.rentalRateDaily || 0)} in ${listing.city || 'India'}. Verified equipment on YantraSetu.`}
    >
      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 ${!isOwner ? 'pb-44 sm:pb-0' : ''}`}>
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
                      className={`w-full h-[300px] sm:h-[450px] object-cover snap-center flex-shrink-0 ${
                        i === currentImage ? 'sm:block' : 'sm:hidden'
                      }`}
                    />
                  ))}
                </div>
                {images.length > 1 && (
                  <>
                    <Button
                      variant="outline" size="icon"
                      onClick={(e) => { e.stopPropagation(); setCurrentImage((p) => (p - 1 + images.length) % images.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white hidden sm:flex h-10 w-10 rounded-full border-none shadow-md"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      onClick={(e) => { e.stopPropagation(); setCurrentImage((p) => (p + 1) % images.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white hidden sm:flex h-10 w-10 rounded-full border-none shadow-md"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
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
                <div className="absolute top-3 right-3 hidden sm:flex items-center gap-1 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-md text-white text-[11px] font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <ZoomIn size={12} /> Click to zoom
                </div>
              </>
            ) : (
              <div className="w-full h-[300px] sm:h-[450px] flex items-center justify-center bg-[#F5EFEB]">
                <Gauge size={64} className="text-[#6F757C] opacity-20" />
              </div>
            )}
            
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-blue-600 hover:bg-blue-700 font-mono tracking-wider">
                FOR RENT
              </Badge>
              {listing.isVerified && (
                <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-700 font-mono tracking-wider flex items-center gap-1 border-none">
                  <Shield size={12} /> VERIFIED
                </Badge>
              )}
            </div>
          </div>

          {/* Machine Details */}
          <Card className="mb-5 border-[#EDE8E0] shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm text-[#6F757C] uppercase tracking-wider font-mono font-bold">
                Machine Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4 sm:gap-x-6">
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
                    <p className="text-[11px] text-[#6F757C] mb-1 font-semibold tracking-wide uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {label}
                    </p>
                    <p className="text-sm font-medium capitalize" style={{ fontFamily: 'DM Sans, sans-serif' }}>{value || '—'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {listing.description && (
            <Card className="mb-5 border-[#EDE8E0] shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm text-[#6F757C] uppercase tracking-wider font-mono font-bold">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#101214] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── Seller Reviews Section ── */}
          <Card className="mb-5 border-[#EDE8E0] shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-[#6F757C] uppercase tracking-wider font-mono font-bold">
                Seller Reviews
              </CardTitle>
              {sellerReviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{sellerRating}</span>
                  <span className="text-xs text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>({sellerReviewCount})</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-sm text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>No reviews yet for this seller.</p>
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
                        <span className="text-xs font-semibold text-[#101214]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {r.reviewer?.firstName} {r.reviewer?.lastName}
                        </span>
                        <span className="text-[10px] text-[#6F757C]/70">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {r.title && <p className="text-sm font-medium mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>{r.title}</p>}
                      {r.comment && <p className="text-xs text-[#6F757C] mt-1 leading-relaxed" style={{ fontFamily: 'DM Sans, sans-serif' }}>{r.comment}</p>}
                      {r.response && (
                        <div className="mt-3 pl-3 border-l-2 border-[#FF6A00]/50 bg-[#FF6A00]/5 p-2 rounded-r-md">
                          <p className="text-xs text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            <span className="font-semibold text-[#101214]">Seller Response:</span> {r.response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Write review button */}
              {isAuthenticated && !isOwner && (
                <div className="mt-5 pt-5 border-t border-[#EDE8E0]">
                  {reviewMsg && (
                    <Alert className={`mb-4 ${reviewMsg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      <AlertDescription>{reviewMsg}</AlertDescription>
                    </Alert>
                  )}
                  
                  <AnimatePresence mode="wait">
                    {!showReviewForm ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Button variant="ghost" onClick={() => setShowReviewForm(true)} className="text-[#FF6A00] hover:text-[#e55f00] hover:bg-[#FF6A00]/5 p-0 h-auto">
                          <Star className="mr-2 h-4 w-4" /> Write a Review
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#6F757C] mb-2 uppercase tracking-wider font-mono">Rating</label>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] rounded">
                                <Star size={24} className={s <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-200 transition-colors'} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <Input
                          placeholder="Review title (optional)"
                          value={reviewForm.title}
                          onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))}
                          className="focus-visible:ring-[#FF6A00]"
                        />
                        <Textarea
                          rows={3}
                          placeholder="Share your experience..."
                          value={reviewForm.comment}
                          onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                          className="resize-none focus-visible:ring-[#FF6A00]"
                        />
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => setShowReviewForm(false)} className="flex-1">Cancel</Button>
                          <Button 
                            onClick={handleReviewSubmit}
                            disabled={reviewSubmitting}
                            className="flex-1 bg-[#FF6A00] hover:bg-[#e55f00] text-white"
                          >
                            {reviewSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Live IoT Telematics ── */}
          <Card className="mb-5 border-[#EDE8E0] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-[40px] pointer-events-none" />
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[#101214] font-bold flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  <Activity size={16} className="text-green-500" />
                  Live Telematics
                </CardTitle>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-green-700 uppercase tracking-widest" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Connected</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[#6F757C]">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Engine Health</span>
                    <Cpu size={14} />
                  </div>
                  <span className="text-lg font-extrabold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>94%</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[#6F757C]">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">GPS Sync</span>
                    <Wifi size={14} />
                  </div>
                  <span className="text-lg font-extrabold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>Active</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col gap-1 col-span-2">
                  <div className="flex justify-between items-center text-[#6F757C]">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Fuel Burn (Lifetime)</span>
                    <Activity size={14} />
                  </div>
                  <span className="text-lg font-extrabold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>14,230 L</span>
                </div>
              </div>
              <Button onClick={() => setShowIotModal(true)} variant="outline" className="w-full text-xs font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                <Wifi className="mr-2 h-4 w-4 text-[#FF6A00]" /> Connect Your Sensor
              </Button>
            </CardContent>
          </Card>

          {/* ── AI Similar Listings Section ── */}
          {aiSimilar.length > 0 && (
            <Card className="mb-5 border-[#EDE8E0] shadow-sm bg-[#F5EFEB]/50">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-[#6F757C] uppercase tracking-wider font-mono font-bold flex items-center gap-2">
                  <BarChart3 size={16} /> Similar Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiSimilar.map((sl: any) => (
                    <Link
                      key={sl.id}
                      to={`/listing/${sl.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white border border-[#EDE8E0] hover:border-purple-300 hover:shadow-md transition-all group"
                    >
                      <div className="w-16 h-16 bg-[#EDE8E0] rounded-lg flex-shrink-0 overflow-hidden">
                        {sl.images?.[0] ? (
                          <img src={sl.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                        ) : (
                          <Gauge size={20} className="m-auto mt-5 text-[#6F757C] opacity-30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-purple-600 transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                          {sl.make} {sl.model}
                        </p>
                        <p className="text-sm font-semibold text-[#FF6A00] mt-0.5">{formatPrice(sl.price)}</p>
                        {sl.similarityScore && (
                          <Badge variant="outline" className="text-[9px] text-purple-600 border-purple-200 bg-purple-50 mt-1.5 py-0 px-1.5 h-4">
                            {Math.round(sl.similarityScore * 10)}% match
                          </Badge>
                        )}
                      </div>
                      <div className="bg-purple-50 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 mr-2">
                         <ArrowRight size={14} className="text-purple-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — pricing + seller + actions */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-5 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1" style={{ scrollbarWidth: 'thin' }}>
          {/* Price card */}
          <Card className="border-[#EDE8E0] shadow-sm z-20 bg-white">
            <CardContent className="p-5 sm:p-6">
              <h1 className="text-2xl font-bold mb-2 leading-tight" style={{ fontFamily: 'Sora, sans-serif', color: '#101214' }}>
                {listing.make} {listing.model}
              </h1>
              
              <div className="flex items-center gap-3 text-sm text-[#6F757C] mb-6 flex-wrap font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {listing.year && <span className="flex items-center gap-1.5 bg-[#F5EFEB] px-2.5 py-1 rounded-md"><Calendar size={14} /> {listing.year}</span>}
                {listing.hoursUsed != null && <span className="flex items-center gap-1.5 bg-[#F5EFEB] px-2.5 py-1 rounded-md"><Gauge size={14} /> {listing.hoursUsed.toLocaleString()}h</span>}
                {listing.city && <span className="flex items-center gap-1.5 bg-[#F5EFEB] px-2.5 py-1 rounded-md"><MapPin size={14} /> {listing.city}</span>}
              </div>

              <div className="border-t border-[#EDE8E0] pt-6 mb-6">
                  <div className="space-y-3">
                    {listing.rentalRateDaily && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#6F757C] font-semibold tracking-wide uppercase text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Daily</span>
                        <span className="font-bold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(listing.rentalRateDaily)}</span>
                      </div>
                    )}
                    {listing.rentalRateWeekly && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#6F757C] font-semibold tracking-wide uppercase text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Weekly</span>
                        <span className="font-bold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(listing.rentalRateWeekly)}</span>
                      </div>
                    )}
                    {listing.rentalRateMonthly && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#6F757C] font-semibold tracking-wide uppercase text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Monthly</span>
                        <span className="font-bold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(listing.rentalRateMonthly)}</span>
                      </div>
                    )}
                    {!listing.rentalRateDaily && !listing.rentalRateWeekly && !listing.rentalRateMonthly && (
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(listing.price)}</p>
                        <span className="text-sm font-medium text-[#6F757C]">/ Day</span>
                      </div>
                    )}
                  </div>
              </div>

              {/* ── CTA Buttons ── */}
              {!isOwner && (
                <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleContactSeller}
                        disabled={contactLoading}
                        className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white text-[15px] font-bold shadow-sm"
                        style={{ fontFamily: 'Sora, sans-serif' }}
                      >
                        {contactLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
                        {contactLoading ? 'Connecting...' : 'Contact Supplier'}
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleWhatsApp}
                          className="flex-1 h-12 border-teal-600 text-teal-600 hover:bg-teal-50 transition-colors font-bold"
                        >
                          Call Now
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleToggleSaved}
                          className={`h-12 w-12 border-[#EDE8E0] transition-colors ${saved ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100 hover:text-red-600' : 'text-[#6F757C]'}`}
                          title={saved ? 'Saved' : 'Save'}
                        >
                          <Heart size={18} className={saved ? 'fill-red-500' : ''} />
                        </Button>
                      </div>
                    </div>

                  <div className="flex gap-2 pt-1 border-t border-[#EDE8E0] mt-3">
                    <Button variant="ghost" size="sm" onClick={handleShare} className="flex-1 text-[#6F757C] hover:text-[#101214]">
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                    {isAuthenticated && (
                      <Button variant="ghost" size="sm" onClick={() => { setShowReportModal(true); setReportMsg(''); }} className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Flag className="mr-2 h-4 w-4" /> Report
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* ── AI Price Verdict ── */}
              {aiPriceAnalysis && (
                <div className="mt-6 pt-5 border-t border-[#EDE8E0]">
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
                      <div className={`p-4 rounded-xl border ${vc.bg}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <VerdictIcon size={16} className={vc.color} />
                            <span className={`text-sm font-bold ${vc.color}`} style={{ fontFamily: 'Sora, sans-serif' }}>{vc.label}</span>
                          </div>
                          {diff !== 0 && (
                            <Badge variant="outline" className={`font-mono ${diff < 0 ? 'text-green-700 bg-green-100 border-transparent' : 'text-red-700 bg-red-100 border-transparent'}`}>
                              {diff > 0 ? '+' : ''}{diff}%
                            </Badge>
                          )}
                        </div>
                        {predicted > 0 && (
                          <p className="text-xs text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            AI estimates market value at <span className="font-bold text-[#101214]">{formatPrice(predicted)}</span>
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Availability Calendar ── */}
          <AvailabilityCalendar
            bookedDates={[]}
            onSelect={(start, end) => {
              setBookingForm(prev => ({ ...prev, startDate: start, endDate: end }));
              setShowBooking(true);
            }}
          />

          {/* ── Booking Panel ── */}
          <AnimatePresence>
            {showBooking && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card className="border-blue-200 shadow-md">
                  <CardHeader className="pb-4 bg-blue-50/50 rounded-t-xl border-b border-blue-100">
                    <CardTitle className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      <Calendar size={16} /> Book This Equipment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    {bookingMsg && (
                      <Alert className={`mb-5 ${bookingMsg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <AlertDescription>{bookingMsg}</AlertDescription>
                      </Alert>
                    )}

                    {!bookingMsg.startsWith('✅') && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Start Date</label>
                            <Input type="date" value={bookingForm.startDate} onChange={e => setBookingForm(p => ({ ...p, startDate: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]}
                              className="focus-visible:ring-blue-400" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>End Date</label>
                            <Input type="date" value={bookingForm.endDate} onChange={e => setBookingForm(p => ({ ...p, endDate: e.target.value }))}
                              min={bookingForm.startDate || new Date().toISOString().split('T')[0]}
                              className="focus-visible:ring-blue-400" />
                          </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer mt-2 bg-[#F9F7F4] p-3 rounded-lg border border-[#EDE8E0]">
                          <input type="checkbox" checked={bookingForm.withOperator} onChange={e => setBookingForm(p => ({ ...p, withOperator: e.target.checked }))}
                            className="w-4 h-4 accent-blue-600 rounded border-gray-300" />
                          <span className="text-sm font-medium text-[#101214]" style={{ fontFamily: 'DM Sans, sans-serif' }}>Include operator</span>
                        </label>

                        <Textarea
                          rows={2} placeholder="Any special requirements? (optional)"
                          value={bookingForm.renterNotes} onChange={e => setBookingForm(p => ({ ...p, renterNotes: e.target.value }))}
                          className="resize-none focus-visible:ring-blue-400"
                        />

                        {/* Cost breakdown */}
                        {bookingDays > 0 && (
                          <div className="bg-blue-50/50 rounded-xl p-4 space-y-3 text-sm border border-blue-100 font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            <div className="flex justify-between"><span className="text-[#6F757C]">Rate × {bookingDays} days</span><span className="text-[#101214]">{formatPrice(bookingTotal)}</span></div>
                            <div className="flex justify-between"><span className="text-[#6F757C]">Security Deposit (20%)</span><span className="text-[#101214]">{formatPrice(bookingDeposit)}</span></div>
                            <div className="flex justify-between"><span className="text-[#6F757C]">Platform Fee (10%)</span><span className="text-[#101214]">{formatPrice(bookingCommission)}</span></div>
                            <div className="flex justify-between border-t border-blue-200 pt-3 font-bold text-base mt-2">
                              <span>Total Estimate</span><span className="text-blue-700">{formatPrice(bookingGrandTotal)}</span>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleBooking}
                          disabled={bookingLoading || bookingDays === 0}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base mt-2"
                        >
                          {bookingLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Calendar className="mr-2 h-5 w-5" />}
                          {bookingLoading ? 'Submitting...' : 'Confirm Booking Request'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Seller card + AI Trust Score */}
          {listing.owner && (
            <Card className="border-[#EDE8E0] shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm text-[#6F757C] uppercase tracking-wider font-mono font-bold">Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-[#FF6A00]/10 rounded-full flex items-center justify-center border border-[#FF6A00]/20">
                    <User size={24} className="text-[#FF6A00]" />
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ fontFamily: 'Sora, sans-serif' }}>{listing.owner.firstName} {listing.owner.lastName}</p>
                    {listing.owner.companyName && <p className="text-xs font-medium text-[#6F757C] mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.owner.companyName}</p>}
                    {sellerReviewCount > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold">{sellerRating}</span>
                        <span className="text-[10px] font-medium text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>({sellerReviewCount} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mb-5">
                  <Badge variant="secondary" className="bg-[#F5EFEB] text-[#6F757C] hover:bg-[#EDE8E0] font-mono tracking-wider capitalize text-xs px-2.5 py-0.5 border-none">
                    {listing.owner.userType}
                  </Badge>
                </div>

                {/* ── AI Trust Score ── */}
                {aiTrustScore && (
                  <div className="border-t border-[#EDE8E0] pt-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck size={14} className="text-purple-500" />
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>AI Trust Score</span>
                    </div>
                    <div className="flex items-center gap-5">
                      {/* Circular gauge */}
                      <div className="relative w-16 h-16 shrink-0">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#F5EFEB" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke={aiTrustScore.trustScore?.score >= 70 ? '#22c55e' : aiTrustScore.trustScore?.score >= 40 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${(aiTrustScore.trustScore?.score || 0) * 0.975} 97.5`}
                            style={{ transition: 'stroke-dasharray 1s ease' }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{aiTrustScore.trustScore?.score || 0}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold capitalize ${
                          aiTrustScore.trustScore?.label === 'excellent' ? 'text-green-600' :
                          aiTrustScore.trustScore?.label === 'good' ? 'text-green-500' :
                          aiTrustScore.trustScore?.label === 'average' ? 'text-yellow-600' : 'text-red-500'
                        }`} style={{ fontFamily: 'Sora, sans-serif' }}>{aiTrustScore.trustScore?.label || 'N/A'}</p>
                        {aiTrustScore.sentimentSummary && (
                          <div className="flex gap-2.5 mt-1.5 bg-[#F9F7F4] py-1 px-2 rounded-md inline-flex">
                            <span className="text-[10px] font-medium text-green-700">{aiTrustScore.sentimentSummary.positive} 👍</span>
                            <span className="text-[10px] font-medium text-[#6F757C]">{aiTrustScore.sentimentSummary.neutral} —</span>
                            <span className="text-[10px] font-medium text-red-700">{aiTrustScore.sentimentSummary.negative} 👎</span>
                          </div>
                        )}
                        <p className="text-[10px] font-medium text-[#6F757C] mt-1.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>{aiTrustScore.reviewCount || 0} reviews analyzed</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Other listings from seller */}
          {otherListings.length > 0 && (
            <Card className="border-[#EDE8E0] shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm text-[#6F757C] uppercase tracking-wider font-mono font-bold">
                  More from this seller
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {otherListings.map((ol) => (
                    <Link
                      key={ol.id}
                      to={`/listing/${ol.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#EDE8E0] hover:border-[#FF6A00] transition-colors group bg-white"
                    >
                      <div className="w-14 h-14 bg-[#F5EFEB] rounded-lg flex-shrink-0 overflow-hidden">
                        {ol.images?.[0] ? (
                          <img src={ol.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Gauge size={20} className="m-auto mt-4 text-[#6F757C] opacity-30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-[#FF6A00] transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>{ol.make} {ol.model}</p>
                        <p className="text-sm font-bold text-[#FF6A00] mt-0.5">{formatPrice(ol.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </div>{/* end sticky wrapper */}
        </div>
      </div>

      {/* ─── Mobile Sticky CTA Bar ─── */}
      {!isOwner && (
        <div className="sticky-cta-bar sm:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-[#EDE8E0] bg-white z-40">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>
              {listing.listingType === 'rent'
                ? (listing.rentalRateDaily ? `${formatPrice(listing.rentalRateDaily)}/d`
                  : listing.rentalRateMonthly ? `${formatPrice(listing.rentalRateMonthly)}/m`
                  : formatPrice(listing.price))
                : formatPrice(listing.price)}
            </p>
            <p className="text-[11px] font-medium text-[#6F757C] truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.make} {listing.model}</p>
          </div>
          {listing.listingType === 'rent' ? (
            <Button
              onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } setShowBooking(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11 px-4"
            >
              <Calendar className="mr-1.5 h-4 w-4" /> Book
            </Button>
          ) : null}
          <Button onClick={handleContactSeller} disabled={contactLoading} className="bg-[#101214] hover:bg-[#202428] text-white shadow-sm h-11 px-4">
            {contactLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-1.5 h-4 w-4" />}
            Chat
          </Button>
          <Button variant="outline" size="icon" onClick={handleWhatsApp} className="h-11 w-11 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </Button>
        </div>
      )}

      {/* ─── Image Lightbox ─── */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
            <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10 transition-colors">
              <X size={32} />
            </button>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {currentImage + 1} / {images.length}
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImage((p) => (p - 1 + images.length) % images.length); }}
                  className="absolute left-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/30 transition-colors z-10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImage((p) => (p + 1) % images.length); }}
                  className="absolute right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/30 transition-colors z-10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            <motion.img
              key={currentImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={images[currentImage]}
              alt={`${listing.make} ${listing.model}`}
              className="max-w-[95vw] max-h-[85vh] object-contain drop-shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Share Modal ─── */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowShareModal(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-sm p-5 sm:p-7" onClick={e => e.stopPropagation()}>
              <h2 className="font-bold text-xl mb-5 text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>Share this listing</h2>
              <div className="space-y-3">
                <Button variant="outline" onClick={handleCopyLink} className="w-full justify-start h-12 text-sm font-medium border-[#EDE8E0] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {copied ? <Check className="mr-3 h-5 w-5 text-green-500" /> : <Copy className="mr-3 h-5 w-5 text-[#6F757C]" />}
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </Button>
                <Button variant="outline" onClick={() => { handleWhatsApp(); setShowShareModal(false); }} className="w-full justify-start h-12 text-sm font-medium border-[#EDE8E0] hover:border-[#25D366] hover:text-[#25D366] transition-colors" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Share via WhatsApp
                </Button>
                <Button variant="outline" onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${listing.make} ${listing.model} on YantraSetu`)}&url=${encodeURIComponent(window.location.href)}`, '_blank'); setShowShareModal(false); }} className="w-full justify-start h-12 text-sm font-medium border-[#EDE8E0] hover:border-blue-400 hover:text-blue-500 transition-colors" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <ExternalLink className="mr-3 h-5 w-5" /> Share on Twitter
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setShowShareModal(false)} className="w-full mt-4 h-12 text-[#6F757C]">Cancel</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fraud Report Modal ─── */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowReportModal(false)} className="absolute top-5 right-5 p-2 text-[#6F757C] hover:bg-[#F5EFEB] rounded-full transition-colors">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-2.5 rounded-full">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#101214' }}>Report Listing</h2>
              </div>

              {reportMsg && (
                <Alert className={`mb-5 ${reportMsg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <AlertDescription>{reportMsg}</AlertDescription>
                </Alert>
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
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#6F757C] mb-2 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Reason *</label>
                      <select
                        value={reportForm.reason}
                        onChange={e => setReportForm(p => ({ ...p, reason: e.target.value }))}
                        className="w-full h-11 px-3 bg-white border border-[#EDE8E0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-shadow"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        <option value="">Select reason…</option>
                        {FRAUD_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#6F757C] mb-2 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Description *</label>
                      <Textarea
                        rows={4}
                        placeholder="Describe the issue in detail…"
                        value={reportForm.description}
                        onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))}
                        className="resize-none focus-visible:ring-red-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#6F757C] mb-2 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Evidence (optional)</label>
                      <div className="flex flex-wrap gap-3 mb-3">
                        {reportForm.evidenceImages.map((img, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-lg border border-[#EDE8E0] overflow-hidden shadow-sm group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReportForm(p => ({ ...p, evidenceImages: p.evidenceImages.filter((_, j) => j !== i) }))}
                              className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {reportForm.evidenceImages.length < 3 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => evidenceRef.current?.click()}
                          className="border-dashed border-2 border-[#D1CBC2] text-[#6F757C] hover:border-red-400 hover:text-red-500 hover:bg-red-50 h-12 w-full sm:w-auto"
                        >
                          <Upload className="mr-2 h-4 w-4" /> Add Screenshot
                        </Button>
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
                    
                    <div className="flex gap-3 pt-4 border-t border-[#EDE8E0]">
                      <Button type="button" variant="outline" onClick={() => setShowReportModal(false)} className="flex-1 h-12">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={reportSubmitting} className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-semibold">
                        {reportSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : <><Flag className="mr-2 h-4 w-4" /> Submit Report</>}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── Quick Book Modal ── */}
      {showQuickBook && listing && listing.listingType === 'rent' && (
        <QuickBookModal
          listing={listing}
          onClose={() => setShowQuickBook(false)}
          aiPredictedPrice={aiPriceAnalysis?.prediction?.predicted}
        />
      )}

      {/* ── Enquiry Modal (Tractor Junction style) ── */}
      <AnimatePresence>
        {showEnquiryModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-0"
            onClick={() => setShowEnquiryModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-[#FF6A00] p-6 text-white relative">
                <button
                  onClick={() => setShowEnquiryModal(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Discover Your Ideal Equipment
                </h3>
                <p className="text-sm text-white/90" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Get the best quote for {listing.make} {listing.model}
                </p>
              </div>
              
              <div className="p-6">
                {enquiryMsg && (
                  <Alert className={`mb-4 ${enquiryMsg.includes('Success') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <AlertDescription>{enquiryMsg}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Name *</label>
                    <Input
                      placeholder="Enter your name"
                      value={enquiryForm.name}
                      onChange={e => setEnquiryForm(p => ({ ...p, name: e.target.value }))}
                      className="bg-[#EDE8E0]/40 border-[#EDE8E0] focus-visible:ring-[#FF6A00] h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Mobile No. *</label>
                    <Input
                      placeholder="10-digit mobile number"
                      type="tel"
                      value={enquiryForm.phone}
                      onChange={e => setEnquiryForm(p => ({ ...p, phone: e.target.value }))}
                      className="bg-[#EDE8E0]/40 border-[#EDE8E0] focus-visible:ring-[#FF6A00] h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>City *</label>
                    <Input
                      placeholder="e.g. Pune, Mumbai"
                      value={enquiryForm.city}
                      onChange={e => setEnquiryForm(p => ({ ...p, city: e.target.value }))}
                      className="bg-[#EDE8E0]/40 border-[#EDE8E0] focus-visible:ring-[#FF6A00] h-11"
                    />
                  </div>
                  
                  <Button
                    onClick={handleEnquirySubmit}
                    disabled={enquiryLoading}
                    className="w-full h-12 bg-[#101214] hover:bg-[#FF6A00] text-white text-[15px] font-bold mt-2 shadow-sm transition-all"
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    {enquiryLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'SUBMIT ENQUIRY'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── IoT Connection Modal (Mockup) ── */}
        {showIotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIotModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-[#101214] p-6 text-white relative">
                <button
                  onClick={() => setShowIotModal(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-[#FF6A00] transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#FF6A00]/20 flex items-center justify-center">
                    <Wifi className="text-[#FF6A00]" size={20} />
                  </div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Connect IoT Telematics
                  </h3>
                </div>
                <p className="text-sm text-white/60" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Link your YantraSetu Link OBD2 device to enable real-time tracking and engine diagnostics.
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#EDE8E0] flex items-center justify-center text-[#101214] font-bold shrink-0 text-sm">1</div>
                    <div>
                      <h4 className="font-bold text-sm text-[#101214]" style={{ fontFamily: 'DM Sans, sans-serif' }}>Locate OBD2 Port</h4>
                      <p className="text-xs text-[#6F757C] mt-1 leading-relaxed">Find the diagnostic port under your machine's steering column or inside the fuse box.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#EDE8E0] flex items-center justify-center text-[#101214] font-bold shrink-0 text-sm">2</div>
                    <div>
                      <h4 className="font-bold text-sm text-[#101214]" style={{ fontFamily: 'DM Sans, sans-serif' }}>Plug in YantraSetu Link</h4>
                      <p className="text-xs text-[#6F757C] mt-1 leading-relaxed">Insert the hardware module. A green LED should start blinking once connected to power.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#EDE8E0] flex items-center justify-center text-[#101214] font-bold shrink-0 text-sm">3</div>
                    <div>
                      <h4 className="font-bold text-sm text-[#101214]" style={{ fontFamily: 'DM Sans, sans-serif' }}>Sync with App</h4>
                      <p className="text-xs text-[#6F757C] mt-1 leading-relaxed">Turn on the machine's ignition and click the sync button below to pair via Bluetooth.</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    // Mock connection success
                    setTimeout(() => setShowIotModal(false), 1500);
                  }}
                  className="w-full h-12 bg-[#FF6A00] hover:bg-[#e55f00] text-white text-[15px] font-bold mt-8 shadow-sm transition-all"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  Start Bluetooth Sync
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
