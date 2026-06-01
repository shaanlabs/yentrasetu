import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mechanicsApi, chatsApi } from '../services/api';
import { Loader2, MapPin, Star, Wrench, CheckCircle, Plus, X, Save, MessageCircle, ArrowRight, HardHat, Cog } from 'lucide-react';
import PageShell from '../components/PageShell';

const SPECIALIZATION_OPTIONS = ['Engine', 'Hydraulics', 'Electrical', 'Welding', 'Tyres', 'PMS', 'Gearbox', 'Body Work', 'AC/Cooling', 'Other'];

interface MechanicForm {
  yearsOfExperience: string;
  specializations: string[];
  dailyRate: string;
  hourlyRate: string;
  city: string;
  state: string;
  serviceRadius: string;
  bio: string;
  isAvailable: boolean;
}

const INITIAL_FORM: MechanicForm = {
  yearsOfExperience: '', specializations: [], dailyRate: '', hourlyRate: '', city: '', state: '', serviceRadius: '50', bio: '', isAvailable: true,
};

export default function MechanicsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', isAvailable: 'true' });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MechanicForm>(INITIAL_FORM);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MechanicForm, string>>>({});
  const [contactingId, setContactingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    mechanicsApi.getMechanics(filters).then(d => setMechanics(d.mechanics)).catch(() => setMechanics([])).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    if (!isAuthenticated) return;
    mechanicsApi.getMyProfile().then(d => {
      if (d.profile) {
        setMyProfile(d.profile);
        setForm({
          yearsOfExperience: String(d.profile.yearsOfExperience || ''),
          specializations: d.profile.specializations || [],
          dailyRate: String(d.profile.dailyRate || ''),
          hourlyRate: String(d.profile.hourlyRate || ''),
          city: d.profile.city || '',
          state: d.profile.state || '',
          serviceRadius: String(d.profile.serviceRadius || '50'),
          bio: d.profile.bio || '',
          isAvailable: d.profile.isAvailable ?? true,
        });
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  const validate = () => {
    const e: Partial<Record<keyof MechanicForm, string>> = {};
    if (!form.yearsOfExperience || Number(form.yearsOfExperience) < 0) e.yearsOfExperience = 'Required';
    if (form.specializations.length === 0) e.specializations = 'Select at least one';
    if (!form.dailyRate || Number(form.dailyRate) <= 0) e.dailyRate = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const payload = {
        yearsOfExperience: Number(form.yearsOfExperience),
        specializations: form.specializations,
        dailyRate: Number(form.dailyRate),
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        serviceRadius: Number(form.serviceRadius) || 50,
        bio: form.bio.trim(),
        isAvailable: form.isAvailable,
      };
      const res = await mechanicsApi.createOrUpdate(payload);
      setMyProfile(res.profile);
      setSaveMsg('✓ Profile saved! Your listing is now live.');
      mechanicsApi.getMechanics(filters).then(d => setMechanics(d.mechanics)).catch(() => {});
    } catch (err: any) {
      setSaveMsg(err.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSpec = (s: string) => {
    setForm(p => ({
      ...p,
      specializations: p.specializations.includes(s)
        ? p.specializations.filter(x => x !== s)
        : [...p.specializations, s],
    }));
    setFormErrors(p => ({ ...p, specializations: '' }));
  };

  const fmt = (p: number) => `₹${Number(p).toLocaleString('en-IN')}`;

  const handleContact = async (mechanicUserId: string) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!mechanicUserId) return;
    setContactingId(mechanicUserId);
    try {
      await chatsApi.startOrGet(mechanicUserId, 'mechanic');
      navigate('/chats');
    } catch (err: any) {
      alert(err.message || 'Failed to start chat');
    } finally {
      setContactingId(null);
    }
  };

  return (
    <PageShell 
      breadcrumb="Mechanics" 
      backTo="/services" 
      backLabel="Services"
      seoTitle="Find Heavy Equipment Mechanics & Repair Services | YantraSetu"
      seoDescription="Connect with expert mechanics for heavy equipment repair and maintenance. Filter by location and specialization on YantraSetu."
    >
      {/* Title + button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-[1.75rem]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
            Find a Mechanic
          </h1>
          <p className="text-[#6F757C] text-sm mt-1">Expert mechanics for heavy equipment repair and maintenance.</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary btn-small text-sm flex items-center gap-2 self-start sm:self-auto"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Close' : myProfile ? 'Edit Listing' : 'List Service'}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-5 sm:p-7 mb-6 shadow-sm border-2 border-blue-500">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
            {myProfile ? 'Edit Your Mechanic Profile' : 'List Your Mechanic Service'}
          </h2>
          <p className="text-sm text-[#6F757C] mb-5">Fill in your details to appear in the mechanic directory.</p>

          {!isAuthenticated ? (
            <div className="text-center py-5">
              <p className="text-sm text-[#6F757C] mb-3">You need to sign in to list your service.</p>
              <button className="btn-primary btn-small" onClick={() => navigate('/login')}>Sign In</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Years of Experience *</label>
                  <input type="number" min={0} value={form.yearsOfExperience}
                    onChange={e => { setForm(p => ({ ...p, yearsOfExperience: e.target.value })); setFormErrors(p => ({ ...p, yearsOfExperience: '' })); }}
                    className={`w-full px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] ${formErrors.yearsOfExperience ? 'border-red-400' : 'border-[#EDE8E0]'}`}
                    placeholder="e.g. 5" />
                  {formErrors.yearsOfExperience && <p className="text-red-500 text-[11px] mt-1">{formErrors.yearsOfExperience}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Daily Rate (₹) *</label>
                  <input type="number" min={0} value={form.dailyRate}
                    onChange={e => { setForm(p => ({ ...p, dailyRate: e.target.value })); setFormErrors(p => ({ ...p, dailyRate: '' })); }}
                    className={`w-full px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] ${formErrors.dailyRate ? 'border-red-400' : 'border-[#EDE8E0]'}`}
                    placeholder="e.g. 1200" />
                  {formErrors.dailyRate && <p className="text-red-500 text-[11px] mt-1">{formErrors.dailyRate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Hourly Rate (₹)</label>
                  <input type="number" min={0} value={form.hourlyRate}
                    onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-[#EDE8E0] text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
                    placeholder="e.g. 200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Service Radius (km)</label>
                  <input type="number" min={0} value={form.serviceRadius}
                    onChange={e => setForm(p => ({ ...p, serviceRadius: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-[#EDE8E0] text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
                    placeholder="e.g. 50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>City *</label>
                  <input type="text" value={form.city}
                    onChange={e => { setForm(p => ({ ...p, city: e.target.value })); setFormErrors(p => ({ ...p, city: '' })); }}
                    className={`w-full px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] ${formErrors.city ? 'border-red-400' : 'border-[#EDE8E0]'}`}
                    placeholder="e.g. Pune" />
                  {formErrors.city && <p className="text-red-500 text-[11px] mt-1">{formErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>State *</label>
                  <input type="text" value={form.state}
                    onChange={e => { setForm(p => ({ ...p, state: e.target.value })); setFormErrors(p => ({ ...p, state: '' })); }}
                    className={`w-full px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] ${formErrors.state ? 'border-red-400' : 'border-[#EDE8E0]'}`}
                    placeholder="e.g. Maharashtra" />
                  {formErrors.state && <p className="text-red-500 text-[11px] mt-1">{formErrors.state}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Specializations *</label>
                <div className="chip-scroll flex-wrap sm:flex">
                  {SPECIALIZATION_OPTIONS.map(s => (
                    <button key={s} onClick={() => toggleSpec(s)} type="button"
                      className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        form.specializations.includes(s)
                          ? 'bg-blue-500 text-white border border-blue-500'
                          : 'bg-white text-[#6F757C] border border-[#EDE8E0] hover:border-blue-400'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
                {formErrors.specializations && <p className="text-red-500 text-[11px] mt-1">{formErrors.specializations}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Bio / Description</label>
                <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                  className="w-full px-3 py-3 rounded-lg border border-[#EDE8E0] text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="Describe your skills, certifications, and work experience…" />
              </div>

              <div className="flex items-center gap-4 mb-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="rounded w-4 h-4" />
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 500 }}>Currently available for hire</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button onClick={handleSave} disabled={saving} className="btn-primary btn-small flex items-center gap-2" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? 'Saving…' : myProfile ? 'Update Profile' : 'Publish Listing'}
                </button>
                {saveMsg && <p className={`text-sm ${saveMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{saveMsg}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* CTA for non-logged-in */}
      {!isAuthenticated && !authLoading && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-[15px]" style={{ fontFamily: 'Sora, sans-serif' }}>Are you a mechanic?</p>
            <p className="text-white/80 text-sm">List your service and get repair jobs from equipment owners across India.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-white/20 backdrop-blur-sm text-white border border-white/40 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white hover:text-blue-600 transition-all min-h-[44px] whitespace-nowrap"
          >
            Sign In to List
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Filter by city…"
          value={filters.city}
          onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
          className="w-full sm:w-48 px-4 py-3 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:border-blue-500 focus:outline-none min-h-[44px]"
        />
        <label className="flex items-center gap-2 text-sm text-[#6F757C] min-h-[44px]">
          <input type="checkbox" checked={filters.isAvailable === 'true'}
            onChange={e => setFilters(p => ({ ...p, isAvailable: e.target.checked ? 'true' : '' }))} className="rounded w-4 h-4" />
          Available only
        </label>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : mechanics.length === 0 ? (
        <div className="text-center py-24 sm:py-32">
          <Wrench size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>No mechanics found</h2>
          <p className="text-sm text-[#6F757C] mt-2">Try broadening your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {mechanics.map(m => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Wrench size={22} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {m.user?.firstName} {m.user?.lastName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#6F757C]">
                    {m.isVerified && <span className="flex items-center gap-0.5 text-green-600"><CheckCircle size={10} /> Verified</span>}
                    {m.isAvailable ? <span className="text-green-600">Available</span> : <span className="text-red-500">Unavailable</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#6F757C] mb-4">
                <div className="flex items-center gap-2"><Wrench size={12} />{m.yearsOfExperience} yrs experience</div>
                {m.city && <div className="flex items-center gap-2"><MapPin size={12} />{m.city}, {m.state}</div>}
                {m.rating > 0 && <div className="flex items-center gap-2"><Star size={12} className="text-yellow-500" />{m.rating} ({m.reviewCount} reviews)</div>}
                {m.serviceRadius && <div>Service radius: {m.serviceRadius} km</div>}
              </div>

              {m.specializations?.length > 0 && (
                <div className="chip-scroll mb-4">
                  {m.specializations.slice(0, 4).map((s: string) => (
                    <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full capitalize whitespace-nowrap">
                      {s}
                    </span>
                  ))}
                  {m.specializations.length > 4 && (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-500 text-[10px] font-medium rounded-full">
                      +{m.specializations.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#EDE8E0] pt-3">
                <div>
                  {m.hourlyRate && <p className="text-xs text-[#6F757C]">{fmt(m.hourlyRate)}/hr</p>}
                  {m.dailyRate && <p className="text-base font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{fmt(m.dailyRate)}<span className="text-xs font-normal text-[#6F757C]">/day</span></p>}
                </div>
                <button
                  onClick={() => handleContact(m.user?.id)}
                  disabled={contactingId === m.user?.id}
                  className="btn-primary btn-small text-xs flex items-center gap-1.5"
                >
                  {contactingId === m.user?.id ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                  {contactingId === m.user?.id ? 'Connecting…' : 'Contact'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Cross-navigation to related services */}
      <div className="mt-10 pt-6 border-t border-[#EDE8E0]">
        <p className="text-xs font-bold text-[#6F757C] uppercase tracking-wider mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Related Services</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/operators" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#EDE8E0] hover:border-orange-300 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <HardHat size={18} className="text-[#FF6A00]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold group-hover:text-[#FF6A00] transition-colors">Hire an Operator</p>
              <p className="text-xs text-[#6F757C]">Certified operators for your equipment</p>
            </div>
            <ArrowRight size={14} className="text-[#6F757C] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link to="/parts" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#EDE8E0] hover:border-green-300 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Cog size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold group-hover:text-green-600 transition-colors">Spare Parts</p>
              <p className="text-xs text-[#6F757C]">Source genuine parts for your equipment</p>
            </div>
            <ArrowRight size={14} className="text-[#6F757C] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
