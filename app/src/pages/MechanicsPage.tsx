import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mechanicsApi } from '../services/api';
import { ArrowLeft, Loader2, MapPin, Star, Wrench, CheckCircle, Plus, X, Save } from 'lucide-react';

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1.5px solid #ddd',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', background: '#fff',
  };

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      <div className="bg-white/80 backdrop-blur-md border-b border-[#E9E3DA] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214' }}>YantraSetu</Link>
            <span className="text-[#6F757C] text-sm">/ Mechanics</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary btn-small text-xs flex items-center gap-1.5"
                style={{ padding: '8px 16px' }}
              >
                {showForm ? <X size={14} /> : <Plus size={14} />}
                {showForm ? 'Close' : myProfile ? 'Edit My Listing' : 'List Your Service'}
              </button>
            )}
            <Link to="/" className="flex items-center gap-1.5 text-sm text-[#6F757C] hover:text-[#101214]"><ArrowLeft size={16} /> Home</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.75rem', marginBottom: '0.5rem' }}>Find a Mechanic</h1>
        <p className="text-[#6F757C] text-sm mb-6">Expert mechanics for heavy equipment repair and maintenance.</p>

        {/* List Your Service Form */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '28px', marginBottom: '24px',
            boxShadow: '0 4px 24px rgba(16,18,20,0.06)', border: '2px solid #3b82f6',
          }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
              {myProfile ? 'Edit Your Mechanic Profile' : 'List Your Mechanic Service'}
            </h2>
            <p style={{ fontSize: '13px', color: '#6F757C', marginBottom: '20px' }}>
              Fill in your details to appear in the mechanic directory.
            </p>

            {!isAuthenticated ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontSize: '14px', color: '#6F757C', marginBottom: '12px' }}>You need to sign in to list your service.</p>
                <button className="btn-primary btn-small" onClick={() => navigate('/login')}>Sign In</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>Years of Experience *</label>
                    <input type="number" min={0} value={form.yearsOfExperience} onChange={e => { setForm(p => ({ ...p, yearsOfExperience: e.target.value })); setFormErrors(p => ({ ...p, yearsOfExperience: '' })); }}
                      style={{ ...inputStyle, borderColor: formErrors.yearsOfExperience ? '#e53e3e' : '#ddd' }} placeholder="e.g. 5" />
                    {formErrors.yearsOfExperience && <p style={{ color: '#e53e3e', fontSize: '11px', marginTop: '2px' }}>{formErrors.yearsOfExperience}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>Daily Rate (₹) *</label>
                    <input type="number" min={0} value={form.dailyRate} onChange={e => { setForm(p => ({ ...p, dailyRate: e.target.value })); setFormErrors(p => ({ ...p, dailyRate: '' })); }}
                      style={{ ...inputStyle, borderColor: formErrors.dailyRate ? '#e53e3e' : '#ddd' }} placeholder="e.g. 1200" />
                    {formErrors.dailyRate && <p style={{ color: '#e53e3e', fontSize: '11px', marginTop: '2px' }}>{formErrors.dailyRate}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>Hourly Rate (₹)</label>
                    <input type="number" min={0} value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))}
                      style={inputStyle} placeholder="e.g. 200" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>Service Radius (km)</label>
                    <input type="number" min={0} value={form.serviceRadius} onChange={e => setForm(p => ({ ...p, serviceRadius: e.target.value }))}
                      style={inputStyle} placeholder="e.g. 50" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>City *</label>
                    <input type="text" value={form.city} onChange={e => { setForm(p => ({ ...p, city: e.target.value })); setFormErrors(p => ({ ...p, city: '' })); }}
                      style={{ ...inputStyle, borderColor: formErrors.city ? '#e53e3e' : '#ddd' }} placeholder="e.g. Pune" />
                    {formErrors.city && <p style={{ color: '#e53e3e', fontSize: '11px', marginTop: '2px' }}>{formErrors.city}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>State *</label>
                    <input type="text" value={form.state} onChange={e => { setForm(p => ({ ...p, state: e.target.value })); setFormErrors(p => ({ ...p, state: '' })); }}
                      style={{ ...inputStyle, borderColor: formErrors.state ? '#e53e3e' : '#ddd' }} placeholder="e.g. Maharashtra" />
                    {formErrors.state && <p style={{ color: '#e53e3e', fontSize: '11px', marginTop: '2px' }}>{formErrors.state}</p>}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>Specializations *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {SPECIALIZATION_OPTIONS.map(s => (
                      <button key={s} onClick={() => toggleSpec(s)} type="button"
                        style={{
                          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontFamily: 'Inter, sans-serif',
                          border: `1.5px solid ${form.specializations.includes(s) ? '#3b82f6' : '#ddd'}`,
                          background: form.specializations.includes(s) ? '#3b82f6' : '#fff',
                          color: form.specializations.includes(s) ? '#fff' : '#6F757C',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {formErrors.specializations && <p style={{ color: '#e53e3e', fontSize: '11px', marginTop: '4px' }}>{formErrors.specializations}</p>}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>Bio / Description</label>
                  <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }} placeholder="Describe your skills, certifications, and work experience…" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} />
                    <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 500 }}>Currently available for hire</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={handleSave} disabled={saving} className="btn-primary btn-small" style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving…' : myProfile ? 'Update Profile' : 'Publish Listing'}
                  </button>
                  {saveMsg && <p style={{ fontSize: '13px', color: saveMsg.startsWith('✓') ? '#22c55e' : '#e53e3e' }}>{saveMsg}</p>}
                </div>
              </>
            )}
          </div>
        )}

        {/* CTA for non-logged-in users */}
        {!isAuthenticated && !authLoading && (
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '10px',
            padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
          }}>
            <div>
              <p style={{ color: '#fff', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px' }}>Are you a mechanic?</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>List your service and get repair jobs from equipment owners across India.</p>
            </div>
            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ borderColor: '#fff', color: '#fff', padding: '10px 20px', fontSize: '13px' }}>
              Sign In to List
            </button>
          </div>
        )}

        <div className="flex gap-3 mb-8">
          <input placeholder="Filter by city…" value={filters.city} onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
            className="px-4 py-2.5 bg-white border border-[#E9E3DA] rounded text-sm w-48 focus:border-[#FF6A00] focus:outline-none" />
          <label className="flex items-center gap-2 text-sm text-[#6F757C]">
            <input type="checkbox" checked={filters.isAvailable === 'true'} onChange={e => setFilters(p => ({ ...p, isAvailable: e.target.checked ? 'true' : '' }))} className="rounded" />
            Available only
          </label>
        </div>
        {loading ? <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
        : mechanics.length === 0 ? (
          <div className="text-center py-32">
            <Wrench size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>No mechanics found</h2>
            <p className="text-sm text-[#6F757C] mt-2">Try broadening your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mechanics.map(m => (
              <div key={m.id} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Wrench size={22} className="text-blue-600" /></div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{m.user?.firstName} {m.user?.lastName}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#6F757C]">
                      {m.isVerified && <span className="flex items-center gap-0.5 text-green-600"><CheckCircle size={10} /> Verified</span>}
                      {m.isAvailable ? <span className="text-green-600">Available</span> : <span className="text-red-500">Unavailable</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-[#6F757C] mb-4">
                  <div className="flex items-center gap-2"><Wrench size={12} />{m.yearsOfExperience} yrs experience</div>
                  {m.city && <div className="flex items-center gap-2"><MapPin size={12} />{m.city}, {m.state}</div>}
                  {m.rating > 0 && <div className="flex items-center gap-2"><Star size={12} className="text-yellow-500" />{m.rating} ({m.reviewCount} reviews)</div>}
                  {m.serviceRadius && <div>Service radius: {m.serviceRadius} km</div>}
                </div>
                {m.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">{m.specializations.slice(0, 3).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded capitalize">{s}</span>
                  ))}</div>
                )}
                <div className="flex items-center justify-between border-t border-[#E9E3DA] pt-3">
                  <div>
                    {m.hourlyRate && <p className="text-xs text-[#6F757C]">{fmt(m.hourlyRate)}/hr</p>}
                    {m.dailyRate && <p className="text-sm font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{fmt(m.dailyRate)}/day</p>}
                  </div>
                  <button className="btn-primary btn-small text-xs px-4 py-2">Contact</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
