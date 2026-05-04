import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi, type MachineryListing } from '../services/api';
import {
  X, Calendar, Clock, Shield, CheckCircle, Loader2,
  Zap, CreditCard, User, MapPin, AlertTriangle, Sparkles
} from 'lucide-react';

interface QuickBookModalProps {
  listing: MachineryListing;
  onClose: () => void;
  aiPredictedPrice?: number;
}

export default function QuickBookModal({ listing, onClose, aiPredictedPrice }: QuickBookModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<'dates' | 'review' | 'success'>('dates');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [withOperator, setWithOperator] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-set dates (tomorrow + 3 days)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const end = new Date(tomorrow);
    end.setDate(end.getDate() + 3);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <Shield size={48} className="mx-auto text-[#FF6A00] mb-4" />
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Login to Book</h3>
            <p className="text-sm text-[#6F757C] mb-6">Create a free account to book equipment instantly</p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full py-3 text-sm">
              Login / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculations
  const days = (() => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  })();

  const dailyRate = listing.rentalRateDaily || listing.price || 0;
  const rentalCost = dailyRate * days;
  const operatorCost = withOperator ? (days * 800) : 0; // ₹800/day for operator
  const subtotal = rentalCost + operatorCost;
  const platformFee = Math.round(subtotal * 0.10); // 10% commission
  const securityDeposit = Math.round(subtotal * 0.20); // 20% deposit
  const total = subtotal + platformFee + securityDeposit;

  const isPriceBelowMarket = aiPredictedPrice && dailyRate < aiPredictedPrice * 0.9;
  const isPriceAboveMarket = aiPredictedPrice && dailyRate > aiPredictedPrice * 1.1;

  const handleBook = async () => {
    if (!startDate || !endDate) { setError('Please select dates'); return; }
    if (new Date(endDate) <= new Date(startDate)) { setError('End date must be after start date'); return; }

    setLoading(true);
    setError('');
    try {
      await bookingsApi.create({
        listingId: listing.id,
        startDate,
        endDate,
        withOperator,
        renterNotes: notes,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#EDE8E0] p-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[#FF6A00]" />
            <h2 className="font-bold text-base" style={{ fontFamily: 'Sora, sans-serif' }}>
              {step === 'success' ? 'Booking Confirmed!' : 'Quick Book'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#EDE8E0] rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {step === 'success' ? (
            /* ─── SUCCESS STATE ─── */
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                Booking Sent! 🎉
              </h3>
              <p className="text-sm text-[#6F757C] mb-2">
                Your request for <strong>{listing.make} {listing.model}</strong> has been sent to the owner.
              </p>
              <p className="text-xs text-[#6F757C] mb-6">
                They'll confirm within 2 hours. You'll receive a notification.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-4">
                <p className="text-xs font-bold text-blue-700 mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>WHAT HAPPENS NEXT</p>
                <div className="space-y-2">
                  {[
                    { step: '1', text: 'Owner reviews & confirms your booking' },
                    { step: '2', text: 'Digital agreement sent for e-sign' },
                    { step: '3', text: 'Machine delivered to your site' },
                    { step: '4', text: 'Track & pay via app' },
                  ].map(s => (
                    <div key={s.step} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
                      <span className="text-xs text-blue-800">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => navigate('/bookings')} className="flex-1 py-3 text-sm font-semibold bg-[#101214] text-white rounded-lg">
                  View Bookings
                </button>
                <button onClick={onClose} className="flex-1 py-3 text-sm font-semibold border border-[#EDE8E0] rounded-lg hover:bg-[#EDE8E0]/30">
                  Continue Browsing
                </button>
              </div>
            </div>
          ) : step === 'dates' ? (
            /* ─── DATE SELECTION ─── */
            <>
              {/* Machine card mini */}
              <div className="flex items-center gap-3 p-3 bg-[#F9F7F4] rounded-xl mb-5">
                <div className="w-14 h-14 bg-[#EDE8E0] rounded-lg overflow-hidden flex-shrink-0">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6F757C] text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{listing.make} {listing.model}</p>
                  <div className="flex items-center gap-2 text-xs text-[#6F757C]">
                    {listing.city && <span className="flex items-center gap-0.5"><MapPin size={10} />{listing.city}</span>}
                    {listing.isVerified && <span className="text-green-600 font-semibold">✓ Verified</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#FF6A00]">{formatPrice(dailyRate)}</p>
                  <p className="text-[10px] text-[#6F757C]">per day</p>
                </div>
              </div>

              {/* AI Price Signal */}
              {aiPredictedPrice && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs ${
                  isPriceBelowMarket ? 'bg-green-50 border border-green-200 text-green-700' :
                  isPriceAboveMarket ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
                  'bg-blue-50 border border-blue-100 text-blue-700'
                }`}>
                  <Sparkles size={12} />
                  <span>
                    <strong>AI:</strong>{' '}
                    {isPriceBelowMarket ? `🔥 Great deal! ${Math.round((1 - dailyRate/aiPredictedPrice) * 100)}% below market rate` :
                     isPriceAboveMarket ? `⚠️ ${Math.round((dailyRate/aiPredictedPrice - 1) * 100)}% above market avg (${formatPrice(aiPredictedPrice)}/day)` :
                     `Fair market price (avg: ${formatPrice(aiPredictedPrice)}/day)`}
                  </span>
                </div>
              )}

              {/* Date selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-3 border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-3 border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] bg-white"
                  />
                </div>
              </div>

              {days > 0 && (
                <p className="text-xs text-[#6F757C] mb-4 flex items-center gap-1">
                  <Clock size={12} /> {days} day{days !== 1 ? 's' : ''} rental
                </p>
              )}

              {/* Operator toggle */}
              <div className="flex items-center justify-between p-3 border border-[#EDE8E0] rounded-xl mb-4">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-[#FF6A00]" />
                  <div>
                    <p className="text-sm font-medium">Include Operator</p>
                    <p className="text-[10px] text-[#6F757C]">Certified operator · ₹800/day</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={withOperator} onChange={e => setWithOperator(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#EDE8E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6A00]"></div>
                </label>
              </div>

              {/* Notes */}
              <textarea
                placeholder="Special requirements (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 border border-[#EDE8E0] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] resize-none mb-4"
              />

              <button
                onClick={() => setStep('review')}
                disabled={days <= 0}
                className="w-full py-3.5 text-sm font-bold rounded-xl bg-[#FF6A00] text-white hover:bg-[#e55f00] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                Review Booking <Calendar size={16} />
              </button>
            </>
          ) : (
            /* ─── REVIEW & CONFIRM ─── */
            <>
              <div className="space-y-3 mb-5">
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Booking Summary</h3>

                <div className="bg-[#F9F7F4] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6F757C]">Equipment</span>
                    <span className="font-medium">{listing.make} {listing.model}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6F757C]">Duration</span>
                    <span className="font-medium">{startDate} → {endDate} ({days} days)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6F757C]">Daily Rate</span>
                    <span className="font-medium">{formatPrice(dailyRate)}/day</span>
                  </div>

                  <div className="border-t border-[#EDE8E0] pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6F757C]">Rental ({days} days × {formatPrice(dailyRate)})</span>
                      <span>{formatPrice(rentalCost)}</span>
                    </div>
                    {withOperator && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6F757C]">Operator ({days} days × ₹800)</span>
                        <span>{formatPrice(operatorCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6F757C]">Platform Fee (10%)</span>
                      <span>{formatPrice(platformFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6F757C]">Security Deposit (refundable)</span>
                      <span>{formatPrice(securityDeposit)}</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-[#101214] pt-3 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Trust signals */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Shield, text: 'Escrow Protected', color: 'text-green-600 bg-green-50' },
                    { icon: CreditCard, text: 'GST Invoice', color: 'text-blue-600 bg-blue-50' },
                    { icon: CheckCircle, text: 'Verified Machine', color: 'text-purple-600 bg-purple-50' },
                    { icon: AlertTriangle, text: '4hr Replacement', color: 'text-orange-600 bg-orange-50' },
                  ].map(t => (
                    <div key={t.text} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-medium ${t.color}`}>
                      <t.icon size={12} /> {t.text}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('dates')}
                  className="flex-1 py-3 text-sm font-medium border border-[#EDE8E0] rounded-xl hover:bg-[#EDE8E0]/30"
                >
                  Back
                </button>
                <button
                  onClick={handleBook}
                  disabled={loading}
                  className="flex-1 py-3.5 text-sm font-bold rounded-xl bg-[#FF6A00] text-white hover:bg-[#e55f00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  {loading ? 'Booking...' : 'Confirm & Book'}
                </button>
              </div>
            </>
          )}
        </div>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
