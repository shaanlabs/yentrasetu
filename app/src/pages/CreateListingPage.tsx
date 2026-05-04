import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { machineryApi, mlApi } from '../services/api';
import {
  ArrowLeft, ArrowRight, Plus, Loader2, MapPin, IndianRupee, ImagePlus, X,
  Navigation, Sparkles, BarChart3, Clock, Calendar,
  Zap, CheckCircle, AlertCircle
} from 'lucide-react';
import PageShell from '../components/PageShell';

const CATEGORIES: Record<string, string[]> = {
  construction: ['Excavators', 'Cranes', 'Bulldozers', 'Graders', 'Compactors', 'Tower Cranes', 'Concrete Pumps'],
  mining: ['Dumpers', 'Drills', 'Loaders', 'Conveyor Systems', 'Rock Breakers'],
  agriculture: ['Tractors', 'Harvesters', 'Rotavators', 'Sprayers', 'Threshers'],
  industrial: ['Forklifts', 'Compressors', 'Generators', 'CNC Machines', 'Welding Equipment'],
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi NCR',
];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [step, setStep] = useState(0); // 0 = type selection
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    listingType: '' as '' | 'sale' | 'rent', category: '', subCategory: '',
    make: '', model: '', year: '', condition: 'used', hoursUsed: '', description: '',
    price: '', rentalRateDaily: '', rentalRateWeekly: '', rentalRateMonthly: '',
    city: '', state: '',
    // Sale-specific
    negotiable: true, warrantyAvailable: false, documentsVerified: false, insuranceValid: false,
    // Rent-specific
    minRentalDays: '1', operatorAvailable: false, fuelIncluded: false, deliveryAvailable: false,
    availableFrom: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle');
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [seoScore, setSeoScore] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      setGeoStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus('done'); },
        () => setGeoStatus('denied'),
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }
  }, []);

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (images.length >= 5) return;
      if (file.size > MAX_IMAGE_SIZE) { setError(`"${file.name}" is too large (max 5MB).`); return; }
      if (!file.type.startsWith('image/')) { setError(`"${file.name}" is not an image.`); return; }
      const reader = new FileReader();
      reader.onload = () => { if (reader.result) setImages(prev => [...prev.slice(0, 4), reader.result as string]); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const u = (f: string, v: any) => { setForm(p => ({ ...p, [f]: v })); setError(''); };
  const subCats = form.category ? CATEGORIES[form.category] || [] : [];
  const lbl = 'block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider';
  const inp = 'w-full px-4 py-3.5 bg-white border border-[#EDE8E0] rounded-lg text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none shadow-sm min-h-[48px]';
  const isSale = form.listingType === 'sale';
  const isRent = form.listingType === 'rent';



  const fetchAiEstimate = async () => {
    if (!form.category || !form.make) return;
    setAiLoading(true);
    try {
      const res = await mlApi.predictPriceInline({
        category: form.category, subCategory: form.subCategory, make: form.make,
        model: form.model, condition: form.condition, listingType: form.listingType,
        year: form.year ? Number(form.year) : undefined,
        hoursUsed: form.hoursUsed ? Number(form.hoursUsed) : undefined,
        city: form.city, description: form.description,
      });
      setAiPrediction(res.prediction);
      setSeoScore(res.seoScore);
    } catch { /* AI is optional */ }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async () => {
    if (isSale && (!form.make || !form.model || !form.price || !form.category)) { setError('Fill all required fields.'); return; }
    if (isRent && (!form.make || !form.model || !form.category)) { setError('Fill all required fields.'); return; }
    if (isRent && !form.rentalRateDaily && !form.rentalRateWeekly && !form.rentalRateMonthly) { setError('Set at least one rental rate.'); return; }

    setLoading(true);
    try {
      const d: any = {
        listingType: form.listingType, category: form.category, subCategory: form.subCategory,
        make: form.make, model: form.model, condition: form.condition, description: form.description,
        city: form.city, state: form.state,
      };
      if (isSale) {
        d.price = Number(form.price);
      } else {
        d.price = Number(form.rentalRateDaily || form.rentalRateWeekly || form.rentalRateMonthly || 0);
        if (form.rentalRateDaily) d.rentalRateDaily = Number(form.rentalRateDaily);
        if (form.rentalRateWeekly) d.rentalRateWeekly = Number(form.rentalRateWeekly);
        if (form.rentalRateMonthly) d.rentalRateMonthly = Number(form.rentalRateMonthly);
      }
      if (form.year) d.year = Number(form.year);
      if (form.hoursUsed) d.hoursUsed = Number(form.hoursUsed);
      if (images.length > 0) d.images = images;
      if (coords) { d.latitude = coords.lat; d.longitude = coords.lng; }
      await machineryApi.createListing(d);
      navigate('/my-listings');
    } catch (err: any) { setError(err.message || 'Failed to create listing.'); }
    finally { setLoading(false); }
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (authLoading) return <PageShell breadcrumb="Loading..." backTo="/" backLabel="Cancel"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  // ─── Step 0: Sale vs Rent Selection ───────────────────
  if (step === 0) {
    return (
      <PageShell breadcrumb="New Listing" backTo="/" backLabel="Cancel">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.75rem', color: '#101214' }}>
              What would you like to do?
            </h1>
            <p className="text-[#6F757C] text-sm mt-2">Choose how you want to list your equipment</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* SALE Card */}
            <button
              onClick={() => { u('listingType', 'sale'); setStep(1); }}
              className={`group relative bg-white rounded-2xl border-2 p-8 text-left transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                form.listingType === 'sale' ? 'border-[#FF6A00] shadow-lg' : 'border-[#EDE8E0] hover:border-[#FF6A00]'
              }`}
            >
              <div className="w-14 h-14 bg-[#FF6A00] rounded-xl flex items-center justify-center mb-6">
                <IndianRupee size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-heading">Sell Equipment</h3>
              <p className="text-sm text-[#6F757C] mb-4">List your machinery for outright sale. Set your price, negotiate, and close the deal.</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <CheckCircle size={14} className="text-green-500" /> Set selling price
                </li>
                <li className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <CheckCircle size={14} className="text-green-500" /> AI price estimation
                </li>
                <li className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <CheckCircle size={14} className="text-green-500" /> EMI calculator for buyers
                </li>
                <li className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <CheckCircle size={14} className="text-green-500" /> Negotiation support
                </li>
              </ul>
              <div className="mt-6 flex items-center gap-2 text-[#FF6A00] font-semibold text-sm">
                Start Sale Listing <ArrowRight size={16} />
              </div>
            </button>

            {/* RENT Card */}
            <button
              onClick={() => { u('listingType', 'rent'); setStep(1); }}
              className={`group relative bg-white rounded-2xl border-2 p-8 text-left transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                form.listingType === 'rent' ? 'border-blue-500 shadow-lg' : 'border-[#EDE8E0] hover:border-blue-500'
              }`}
            >
              <div className="w-14 h-14 bg-[#3b82f6] rounded-xl flex items-center justify-center mb-6">
                <Calendar size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-heading">Rent Out Equipment</h3>
              <p className="text-sm text-[#6F757C] mb-4">Make money from idle equipment. Set daily, weekly, or monthly rental rates.</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <CheckCircle size={14} className="text-blue-500" /> Flexible rental rates
                </li>
                <li className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <CheckCircle size={14} className="text-blue-500" /> AI demand forecasting
                </li>
                <li className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <CheckCircle size={14} className="text-blue-500" /> Operator availability
                </li>
                <li className="flex items-center gap-2 text-xs text-[#6F757C]">
                  <CheckCircle size={14} className="text-blue-500" /> Booking management
                </li>
              </ul>
              <div className="mt-6 flex items-center gap-2 text-blue-600 font-semibold text-sm">
                Start Rental Listing <ArrowRight size={16} />
              </div>
            </button>
          </div>

          {/* Tip */}
          <p className="mt-8 text-center text-xs text-[#6F757C]">
            Not sure? You can always change the listing type later from your dashboard.
          </p>
        </div>
      </PageShell>
    );
  }

  const accentColor = isSale ? '#FF6A00' : '#3b82f6';
  const accentBg = isSale ? 'bg-[#FF6A00]' : 'bg-blue-500';
  const accentText = isSale ? 'text-[#FF6A00]' : 'text-blue-600';


  return (
    <PageShell breadcrumb={isSale ? "Sell Equipment" : "Rent Out Equipment"} backTo="/" backLabel="Cancel">
      <div className="max-w-2xl mx-auto">
        {/* Header with type indicator */}
        <div className="flex items-center gap-3 mb-2">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white ${accentBg}`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {isSale ? 'FOR SALE' : 'FOR RENT'}
          </div>
          <button onClick={() => { setStep(0); u('listingType', ''); }} className="text-xs text-[#6F757C] hover:text-[#101214] transition-colors">
            Change →
          </button>
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#101214' }}>
          {isSale ? 'Post Equipment for Sale' : 'Post Equipment for Rent'}
        </h1>
        <p className="text-[#6F757C] text-sm mb-6">
          {isSale ? 'Add details to attract serious buyers. AI will help estimate the best price.' : 'Set up your rental listing with rates and availability. AI will suggest optimal pricing.'}
        </p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1,2,3,4].map(s => (
            <div key={s} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: s <= step ? accentColor : '#EDE8E0' }} />
          ))}
        </div>

        {error && <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" />{error}</div>}

        {/* ═══ STEP 1: Machine Information ═══ */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 space-y-5">
            <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <Zap size={14} className={accentText} /> Machine Information
            </h2>

            <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Category *</label>
              <select value={form.category} onChange={e => { u('category', e.target.value); u('subCategory', ''); }} className={inp}>
                <option value="">Select category…</option>
                {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>

            {subCats.length > 0 && <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Sub-Category</label>
              <select value={form.subCategory} onChange={e => u('subCategory', e.target.value)} className={inp}>
                <option value="">Select…</option>
                {subCats.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>}

            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Make *</label>
                <input value={form.make} onChange={e => u('make', e.target.value)} placeholder="e.g. Tata Hitachi" className={inp} /></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Model *</label>
                <input value={form.model} onChange={e => u('model', e.target.value)} placeholder="e.g. EX200" className={inp} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Year</label>
                <input type="number" value={form.year} onChange={e => u('year', e.target.value)} placeholder="2020" className={inp} /></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Hours Used</label>
                <input type="number" value={form.hoursUsed} onChange={e => u('hoursUsed', e.target.value)} placeholder="5000" className={inp} /></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Condition</label>
                <select value={form.condition} onChange={e => u('condition', e.target.value)} className={inp}>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            <button onClick={() => { setStep(2); fetchAiEstimate(); }} disabled={!form.category || !form.make || !form.model}
              className="w-full flex items-center justify-center gap-2 mt-4 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 min-h-[48px] transition-all"
              style={{ background: accentColor, fontFamily: 'Sora, sans-serif' }}>
              Next: {isSale ? 'Pricing' : 'Rental Rates'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ═══ STEP 2: Pricing (different for Sale vs Rent) ═══ */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 space-y-5">
              <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {isSale ? <><IndianRupee size={14} className="text-[#FF6A00]" /> Sale Price</> :
                          <><Clock size={14} className="text-blue-500" /> Rental Rates</>}
              </h2>

              {/* ── SALE Pricing ── */}
              {isSale && (
                <>
                  <div>
                    <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Asking Price *</label>
                    <div className="relative">
                      <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                      <input type="number" value={form.price} onChange={e => u('price', e.target.value)} placeholder="Enter sale price" className={`${inp} pl-10 text-lg font-bold`} />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#F9F7F4] transition-colors">
                    <input type="checkbox" checked={form.negotiable} onChange={e => u('negotiable', e.target.checked)} className="w-4 h-4 accent-[#FF6A00]" />
                    <div><span className="text-sm font-medium">Price is negotiable</span>
                      <p className="text-xs text-[#6F757C]">Buyers can make counter-offers</p></div>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#EDE8E0] hover:border-[#FF6A00] transition-colors">
                      <input type="checkbox" checked={form.warrantyAvailable} onChange={e => u('warrantyAvailable', e.target.checked)} className="w-4 h-4 accent-[#FF6A00]" />
                      <div><span className="text-xs font-medium">Warranty Available</span></div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#EDE8E0] hover:border-[#FF6A00] transition-colors">
                      <input type="checkbox" checked={form.insuranceValid} onChange={e => u('insuranceValid', e.target.checked)} className="w-4 h-4 accent-[#FF6A00]" />
                      <div><span className="text-xs font-medium">Insurance Valid</span></div>
                    </label>
                  </div>
                </>
              )}

              {/* ── RENT Pricing ── */}
              {isRent && (
                <>
                  <p className="text-xs text-[#6F757C]">Set at least one rental rate. Multiple options help attract more renters.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Daily Rate</label>
                      <div className="relative">
                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                        <input type="number" value={form.rentalRateDaily} onChange={e => u('rentalRateDaily', e.target.value)} placeholder="₹/day" className={`${inp} pl-9`} />
                      </div>
                    </div>
                    <div className="relative">
                      <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Weekly Rate</label>
                      <div className="relative">
                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                        <input type="number" value={form.rentalRateWeekly} onChange={e => u('rentalRateWeekly', e.target.value)} placeholder="₹/week" className={`${inp} pl-9`} />
                      </div>
                    </div>
                    <div className="relative">
                      <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Monthly Rate</label>
                      <div className="relative">
                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                        <input type="number" value={form.rentalRateMonthly} onChange={e => u('rentalRateMonthly', e.target.value)} placeholder="₹/month" className={`${inp} pl-9`} />
                      </div>
                    </div>
                  </div>

                  {/* Auto-calculate helper */}
                  {form.rentalRateDaily && !form.rentalRateWeekly && !form.rentalRateMonthly && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <Sparkles size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-700">
                        <span className="font-semibold">AI Suggestion:</span> Based on daily rate, set weekly at{' '}
                        <button onClick={() => u('rentalRateWeekly', String(Math.round(Number(form.rentalRateDaily) * 6)))} className="font-bold underline">
                          {formatPrice(Number(form.rentalRateDaily) * 6)}
                        </button>{' '}
                        and monthly at{' '}
                        <button onClick={() => u('rentalRateMonthly', String(Math.round(Number(form.rentalRateDaily) * 22)))} className="font-bold underline">
                          {formatPrice(Number(form.rentalRateDaily) * 22)}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Minimum Rental Period</label>
                    <select value={form.minRentalDays} onChange={e => u('minRentalDays', e.target.value)} className={inp}>
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">1 Week</option>
                      <option value="15">15 Days</option>
                      <option value="30">1 Month</option>
                    </select>
                  </div>

                  <div>
                    <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Available From</label>
                    <input type="date" value={form.availableFrom} onChange={e => u('availableFrom', e.target.value)}
                      min={new Date().toISOString().split('T')[0]} className={inp} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#EDE8E0] hover:border-blue-400 transition-colors">
                      <input type="checkbox" checked={form.operatorAvailable} onChange={e => u('operatorAvailable', e.target.checked)} className="w-4 h-4 accent-blue-500" />
                      <div><span className="text-xs font-medium">Operator Available</span>
                        <p className="text-[10px] text-[#6F757C]">Extra charge</p></div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#EDE8E0] hover:border-blue-400 transition-colors">
                      <input type="checkbox" checked={form.fuelIncluded} onChange={e => u('fuelIncluded', e.target.checked)} className="w-4 h-4 accent-blue-500" />
                      <div><span className="text-xs font-medium">Fuel Included</span></div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#EDE8E0] hover:border-blue-400 transition-colors">
                      <input type="checkbox" checked={form.deliveryAvailable} onChange={e => u('deliveryAvailable', e.target.checked)} className="w-4 h-4 accent-blue-500" />
                      <div><span className="text-xs font-medium">Delivery Available</span></div>
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* AI Price Insight */}
            {aiLoading && (
              <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-xl text-xs text-purple-600 border border-purple-100">
                <Loader2 size={14} className="animate-spin" /> AI is analyzing market data for best pricing...
              </div>
            )}
            {aiPrediction && !aiLoading && (
              <div className="bg-white border border-[#EDE8E0] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={18} className="text-[#6F757C]" />
                  <span className="text-sm font-bold text-[#101214]">Price Estimate</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-[#6F757C] uppercase tracking-wider mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {isSale ? 'Estimated Market Value' : 'Suggested Daily Rate'}
                    </p>
                    <p className="text-xl font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {formatPrice(aiPrediction.predicted || aiPrediction.predictedPrice || aiPrediction.min || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6F757C] uppercase tracking-wider mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      Confidence
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/80 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-blue-500"
                          style={{ width: `${aiPrediction.confidence === 'high' ? 90 : aiPrediction.confidence === 'medium' ? 65 : 40}%` }} />
                      </div>
                      <span className="text-xs font-bold capitalize text-purple-600">{aiPrediction.confidence || 'medium'}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-[#6F757C] mt-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  Based on {aiPrediction.trainedOn || 'market'} similar listings · Method: {aiPrediction.method || 'ML regression'}
                </p>
              </div>
            )}

            {seoScore && !aiLoading && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#EDE8E0]">
                <BarChart3 size={18} className={
                  (seoScore.overall || seoScore.score || 0) >= 70 ? 'text-green-500' :
                  (seoScore.overall || seoScore.score || 0) >= 40 ? 'text-yellow-500' : 'text-red-500'
                } />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Listing Visibility Score</span>
                    <span className="text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {seoScore.overall || seoScore.score || 0}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EDE8E0] rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all bg-gradient-to-r from-[#FF6A00] to-green-500"
                      style={{ width: `${seoScore.overall || seoScore.score || 0}%` }} />
                  </div>
                  {seoScore.tips?.[0] && <p className="text-[10px] text-[#6F757C] mt-1">{seoScore.tips[0]}</p>}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 flex items-center justify-center gap-2 min-h-[48px]"><ArrowLeft size={16} /> Back</button>
              <button onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white min-h-[48px] transition-all"
                style={{ background: accentColor, fontFamily: 'Sora, sans-serif' }}>
                Next: Location <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Location ═══ */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 space-y-5">
            <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <MapPin size={14} className={accentText} /> Equipment Location
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>City</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input value={form.city} onChange={e => u('city', e.target.value)} placeholder="City" className={`${inp} pl-10`} />
                </div>
              </div>
              <div>
                <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>State</label>
                <select value={form.state} onChange={e => u('state', e.target.value)} className={inp}>
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              geoStatus === 'done' ? 'bg-green-50 text-green-700 border border-green-100' :
              geoStatus === 'loading' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
              geoStatus === 'denied' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-gray-50 text-[#6F757C] border border-gray-100'
            }`}>
              {geoStatus === 'done' && <><Navigation size={12} /> GPS detected — listing will appear in "Near Me" searches</>}
              {geoStatus === 'loading' && <><Loader2 size={12} className="animate-spin" /> Detecting location…</>}
              {geoStatus === 'denied' && <><MapPin size={12} /> Location denied — won't appear in proximity searches</>}
              {geoStatus === 'idle' && <><MapPin size={12} /> Geolocation unavailable</>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1 flex items-center justify-center gap-2 min-h-[48px]"><ArrowLeft size={16} /> Back</button>
              <button onClick={() => setStep(4)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white min-h-[48px] transition-all"
                style={{ background: accentColor, fontFamily: 'Sora, sans-serif' }}>
                Next: Photos <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Photos & Description ═══ */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 space-y-5">
              <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <ImagePlus size={14} className={accentText} /> Photos & Description
              </h2>

              <div>
                <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Photos (up to 5)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg border border-[#EDE8E0] overflow-hidden group">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-[#EDE8E0] hover:border-[#FF6A00] flex flex-col items-center justify-center cursor-pointer text-[#6F757C] hover:text-[#FF6A00] transition-colors">
                      <ImagePlus size={20} />
                      <span className="text-[10px] mt-1">Add</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
                {images.length === 0 && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700 border border-yellow-100">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    Listings with photos get 4x more views. Add at least one image.
                  </div>
                )}
              </div>

              <div>
                <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Description</label>
                <textarea value={form.description} onChange={e => u('description', e.target.value)} rows={5}
                  placeholder={isSale
                    ? "Describe condition, service history, modifications, reason for selling..."
                    : "Describe the equipment, maintenance status, what's included in rental, any restrictions..."
                  }
                  className={`${inp} resize-none`} />
                {form.description.length > 0 && form.description.length < 50 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600">
                    <Sparkles size={12} /> AI tip: Add more detail ({50 - form.description.length} more chars) to improve visibility by 35%
                  </div>
                )}
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
              <p className="text-xs text-[#6F757C] uppercase tracking-wider mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                Listing Preview
              </p>
              <div className="flex gap-4 items-start">
                {images[0] ? (
                  <img src={images[0]} className="w-20 h-20 rounded-lg object-cover border border-[#EDE8E0]" alt="" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-[#EDE8E0] flex items-center justify-center"><ImagePlus size={20} className="text-[#6F757C] opacity-40" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded text-white ${isSale ? 'bg-[#FF6A00]' : 'bg-blue-500'}`}
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {isSale ? 'SALE' : 'RENT'}
                    </span>
                    <span className="text-[10px] text-[#6F757C] capitalize">{form.category}</span>
                  </div>
                  <p className="font-bold text-sm truncate">{form.make || '—'} {form.model || '—'} {form.year && `(${form.year})`}</p>
                  <p className="font-bold text-sm" style={{ color: accentColor }}>
                    {isSale
                      ? (form.price ? formatPrice(Number(form.price)) : '—')
                      : (form.rentalRateDaily
                        ? `${formatPrice(Number(form.rentalRateDaily))}/day`
                        : form.rentalRateMonthly
                          ? `${formatPrice(Number(form.rentalRateMonthly))}/month`
                          : '—')
                    }
                  </p>
                  {form.city && <p className="text-xs text-[#6F757C] flex items-center gap-1"><MapPin size={10} />{form.city}{form.state && `, ${form.state}`}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1 flex items-center justify-center gap-2 min-h-[48px]"><ArrowLeft size={16} /> Back</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white min-h-[48px] transition-all disabled:opacity-60"
                style={{ background: accentColor, fontFamily: 'Sora, sans-serif' }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={16} /> Publish Listing</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
