import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { machineryApi, mlApi } from '../services/api';
import { ArrowLeft, ArrowRight, Plus, Loader2, MapPin, IndianRupee, ImagePlus, X, Navigation, Sparkles, BarChart3 } from 'lucide-react';
import PageShell from '../components/PageShell';

const CATEGORIES: Record<string, string[]> = {
  construction: ['Excavators', 'Cranes', 'Bulldozers', 'Graders', 'Compactors', 'Tower Cranes', 'Concrete Pumps'],
  mining: ['Dumpers', 'Drills', 'Loaders', 'Conveyor Systems', 'Rock Breakers'],
  agriculture: ['Tractors', 'Harvesters', 'Rotavators', 'Sprayers', 'Threshers'],
  industrial: ['Forklifts', 'Compressors', 'Generators', 'CNC Machines', 'Welding Equipment'],
};

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    listingType: 'sale' as 'sale' | 'rent', category: '', subCategory: '',
    make: '', model: '', year: '', condition: 'used', hoursUsed: '', description: '',
    price: '', rentalRateDaily: '', rentalRateWeekly: '', rentalRateMonthly: '', city: '', state: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle');
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [seoScore, setSeoScore] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setGeoStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoStatus('done');
        },
        () => setGeoStatus('denied'),
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (images.length >= 5) return;
      const reader = new FileReader();
      reader.onload = () => { if (reader.result) setImages(prev => [...prev.slice(0, 4), reader.result as string]); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const u = (f: string, v: string) => { setForm(p => ({ ...p, [f]: v })); setError(''); };
  const subCats = form.category ? CATEGORIES[form.category] || [] : [];
  const lbl = 'block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider';
  const inp = 'w-full px-4 py-3.5 bg-white border border-[#E9E3DA] rounded-lg text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none shadow-sm min-h-[48px]';

  // Fetch AI price estimate and SEO score
  const fetchAiEstimate = async () => {
    if (!form.category || !form.make) return;
    setAiLoading(true);
    try {
      const res = await mlApi.predictPriceInline({
        category: form.category,
        subCategory: form.subCategory,
        make: form.make,
        model: form.model,
        condition: form.condition,
        listingType: form.listingType,
        year: form.year ? Number(form.year) : undefined,
        hoursUsed: form.hoursUsed ? Number(form.hoursUsed) : undefined,
        city: form.city,
        description: form.description,
      });
      setAiPrediction(res.prediction);
      setSeoScore(res.seoScore);
    } catch {
      // Silent fail — AI features are optional
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.make || !form.model || !form.price || !form.category) { setError('Fill all required fields.'); return; }
    setLoading(true);
    try {
      const d: any = { listingType: form.listingType, category: form.category, subCategory: form.subCategory, make: form.make, model: form.model, condition: form.condition, description: form.description, city: form.city, state: form.state, price: Number(form.price) };
      if (form.year) d.year = Number(form.year);
      if (form.hoursUsed) d.hoursUsed = Number(form.hoursUsed);
      if (form.rentalRateDaily) d.rentalRateDaily = Number(form.rentalRateDaily);
      if (form.rentalRateWeekly) d.rentalRateWeekly = Number(form.rentalRateWeekly);
      if (form.rentalRateMonthly) d.rentalRateMonthly = Number(form.rentalRateMonthly);
      if (images.length > 0) d.images = images;
      if (coords) { d.latitude = coords.lat; d.longitude = coords.lng; }
      await machineryApi.createListing(d);
      navigate('/my-listings');
    } catch (err: any) { setError(err.message || 'Failed to create listing.'); }
    finally { setLoading(false); }
  };

  if (authLoading) return <PageShell breadcrumb="Loading..." backTo="/" backLabel="Cancel"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  return (
    <PageShell breadcrumb="New Listing" backTo="/" backLabel="Cancel">
      <div className="max-w-2xl mx-auto">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#101214' }}>Post a Listing</h1>
        <p className="text-[#6F757C] text-sm mb-8">Create a new machinery listing. It will be reviewed before going live.</p>
        <div className="flex gap-2 mb-8">{[1,2,3].map(s => <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-[#FF6A00]' : 'bg-[#E9E3DA]'}`} />)}</div>
        {error && <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6 space-y-5">
            <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Machine Information</h2>
            <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Type *</label>
              <div className="flex gap-3">{(['sale','rent'] as const).map(t => (
                <button key={t} onClick={() => u('listingType', t)} className={`flex-1 py-3 rounded border text-sm font-medium capitalize ${form.listingType === t ? 'border-[#FF6A00] bg-[#FF6A00]/5 text-[#FF6A00]' : 'border-[#E9E3DA] bg-white text-[#6F757C]'}`} style={{ fontFamily: 'Sora, sans-serif' }}>{t === 'sale' ? 'For Sale' : 'For Rent'}</button>
              ))}</div></div>
            <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Category *</label>
              <select value={form.category} onChange={e => { u('category', e.target.value); u('subCategory', ''); }} className={inp}><option value="">Select…</option>{Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            {subCats.length > 0 && <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Sub-Category</label>
              <select value={form.subCategory} onChange={e => u('subCategory', e.target.value)} className={inp}><option value="">Select…</option>{subCats.map(s => <option key={s} value={s}>{s}</option>)}</select></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Make *</label><input value={form.make} onChange={e => u('make', e.target.value)} placeholder="e.g. Tata Hitachi" className={inp} /></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Model *</label><input value={form.model} onChange={e => u('model', e.target.value)} placeholder="e.g. EX200" className={inp} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Year</label><input type="number" value={form.year} onChange={e => u('year', e.target.value)} placeholder="2020" className={inp} /></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Hours</label><input type="number" value={form.hoursUsed} onChange={e => u('hoursUsed', e.target.value)} placeholder="5000" className={inp} /></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Condition</label>
                <select value={form.condition} onChange={e => u('condition', e.target.value)} className={inp}><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option></select></div>
            </div>
            <button onClick={() => { setStep(2); fetchAiEstimate(); }} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">Next <ArrowRight size={16} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6 space-y-5">
            <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Pricing & Location</h2>
            <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{form.listingType === 'rent' ? 'Base Price *' : 'Sale Price *'}</label>
              <div className="relative"><IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" /><input type="number" value={form.price} onChange={e => u('price', e.target.value)} placeholder="Price" className={`${inp} pl-10`} /></div></div>
            {form.listingType === 'rent' && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Daily</label><input type="number" value={form.rentalRateDaily} onChange={e => u('rentalRateDaily', e.target.value)} placeholder="₹/day" className={inp} /></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Weekly</label><input type="number" value={form.rentalRateWeekly} onChange={e => u('rentalRateWeekly', e.target.value)} placeholder="₹/week" className={inp} /></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Monthly</label><input type="number" value={form.rentalRateMonthly} onChange={e => u('rentalRateMonthly', e.target.value)} placeholder="₹/mo" className={inp} /></div>
            </div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>City</label><div className="relative"><MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" /><input value={form.city} onChange={e => u('city', e.target.value)} placeholder="City" className={`${inp} pl-10`} /></div></div>
              <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>State</label><div className="relative"><MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" /><input value={form.state} onChange={e => u('state', e.target.value)} placeholder="State" className={`${inp} pl-10`} /></div></div>
            </div>
            {/* Location auto-detect indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              geoStatus === 'done' ? 'bg-green-50 text-green-700' :
              geoStatus === 'loading' ? 'bg-blue-50 text-blue-600' :
              geoStatus === 'denied' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-[#6F757C]'
            }`}>
              {geoStatus === 'done' && <><Navigation size={12} /> GPS coordinates detected — your listing will appear in "Near Me" searches</>}
              {geoStatus === 'loading' && <><Loader2 size={12} className="animate-spin" /> Detecting your location…</>}
              {geoStatus === 'denied' && <><MapPin size={12} /> Location access denied — listing won't appear in proximity searches</>}
              {geoStatus === 'idle' && <><MapPin size={12} /> Geolocation unavailable</>}
            </div>
            {/* AI Price Estimate */}
            {aiLoading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-600">
                <Loader2 size={12} className="animate-spin" /> Getting AI price estimate...
              </div>
            )}
            {aiPrediction && !aiLoading && (
              <div className="bg-gradient-to-r from-[#FF6A00]/5 to-[#FF8C38]/5 border border-[#FF6A00]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-[#FF6A00]" />
                  <span className="text-xs font-semibold text-[#FF6A00] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>AI Price Estimate</span>
                </div>
                <p className="text-lg font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  ₹{Number(aiPrediction.predictedPrice || aiPrediction.min || 0).toLocaleString('en-IN')}
                  {aiPrediction.max && <span className="text-sm font-normal text-[#6F757C]"> — ₹{Number(aiPrediction.max).toLocaleString('en-IN')}</span>}
                </p>
                {aiPrediction.confidence && (
                  <p className="text-xs text-[#6F757C] mt-1">Confidence: {Math.round(aiPrediction.confidence * 100)}% · Based on {aiPrediction.sampleSize || 'similar'} listings</p>
                )}
              </div>
            )}
            {seoScore && !aiLoading && (
              <div className="flex items-center gap-3 px-3 py-2 bg-[#F9F7F4] rounded-lg">
                <BarChart3 size={16} className={seoScore.overall >= 70 ? 'text-green-600' : seoScore.overall >= 40 ? 'text-yellow-600' : 'text-red-500'} />
                <div>
                  <span className="text-xs font-semibold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>SEO Score: {seoScore.overall || seoScore.score || '—'}/100</span>
                  {seoScore.tips && seoScore.tips.length > 0 && (
                    <p className="text-xs text-[#6F757C] mt-0.5">{seoScore.tips[0]}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-3"><button onClick={() => setStep(1)} className="btn-secondary flex-1 flex items-center justify-center gap-2"><ArrowLeft size={16} /> Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1 flex items-center justify-center gap-2">Next <ArrowRight size={16} /></button></div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6 space-y-5">
            <h2 className="font-semibold text-sm text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Photos & Description</h2>
            {/* Image upload */}
            <div>
              <label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Photos (up to 5)</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded border border-[#E9E3DA] overflow-hidden group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded border-2 border-dashed border-[#E9E3DA] hover:border-[#FF6A00] flex flex-col items-center justify-center cursor-pointer text-[#6F757C] hover:text-[#FF6A00] transition-colors">
                    <ImagePlus size={20} />
                    <span className="text-[10px] mt-1">Add</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div><label className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Description</label>
              <textarea value={form.description} onChange={e => u('description', e.target.value)} rows={5} placeholder="Describe the machine…" className={`${inp} resize-none`} /></div>
            <div className="bg-[#E9E3DA]/40 rounded-lg p-4">
              <p className="text-xs text-[#6F757C] uppercase tracking-wider mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Preview</p>
              <p className="text-sm font-bold">{form.make} {form.model} {form.year && `(${form.year})`}</p>
              <p className="text-sm text-[#FF6A00] font-bold">₹{Number(form.price || 0).toLocaleString('en-IN')} — {form.listingType === 'rent' ? 'Rent' : 'Sale'}</p>
              <p className="text-xs text-[#6F757C]">{form.category} {form.subCategory && `/ ${form.subCategory}`} {form.city && `· ${form.city}`}</p>
            </div>
            <div className="flex gap-3"><button onClick={() => setStep(2)} className="btn-secondary flex-1 flex items-center justify-center gap-2"><ArrowLeft size={16} /> Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={16} /> Publish</>}</button></div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
