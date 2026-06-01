import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { operatorsApi, chatsApi } from '../services/api';
import { Loader2, MapPin, Star, Briefcase, User, CheckCircle, Plus, X, Save, MessageCircle, ArrowRight, Wrench, Cog } from 'lucide-react';
import PageShell from '../components/PageShell';

const EQUIPMENT_OPTIONS = ['Excavator', 'Crane', 'Loader', 'Bulldozer', 'Dumper', 'Backhoe Loader', 'Roller', 'Forklift', 'Tower Crane', 'Other'];

interface OperatorForm {
  yearsOfExperience: string;
  equipmentTypes: string[];
  dayRate: string;
  city: string;
  state: string;
  bio: string;
  isAvailable: boolean;
}

const INITIAL_FORM: OperatorForm = {
  yearsOfExperience: '', equipmentTypes: [], dayRate: '', city: '', state: '', bio: '', isAvailable: true,
};

export default function OperatorsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', isAvailable: 'true' });

  // Service listing form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OperatorForm>(INITIAL_FORM);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof OperatorForm, string>>>({});
  const [contactingId, setContactingId] = useState<string | null>(null);

const MOCK_OPERATORS = [
  {
    id: 'op_mock_1',
    user: { id: 'u_1', firstName: 'Ramesh', lastName: 'Kumar' },
    yearsOfExperience: 8,
    equipmentTypes: ['Excavator', 'Backhoe Loader'],
    dayRate: 1500,
    city: 'Bengaluru',
    state: 'Karnataka',
    isAvailable: true,
    isVerified: true,
    rating: 4.8,
    reviewCount: 24
  },
  {
    id: 'op_mock_2',
    user: { id: 'u_2', firstName: 'Suresh', lastName: 'Singh' },
    yearsOfExperience: 12,
    equipmentTypes: ['Crane', 'Tower Crane'],
    dayRate: 2200,
    city: 'Mumbai',
    state: 'Maharashtra',
    isAvailable: true,
    isVerified: true,
    rating: 4.9,
    reviewCount: 41
  },
  {
    id: 'op_mock_3',
    user: { id: 'u_3', firstName: 'Abdul', lastName: 'Rehman' },
    yearsOfExperience: 5,
    equipmentTypes: ['Dumper', 'Loader'],
    dayRate: 1200,
    city: 'Delhi NCR',
    state: 'Delhi',
    isAvailable: false,
    isVerified: true,
    rating: 4.5,
    reviewCount: 12
  },
  {
    id: 'op_mock_4',
    user: { id: 'u_4', firstName: 'Vikram', lastName: 'Patil' },
    yearsOfExperience: 15,
    equipmentTypes: ['Bulldozer', 'Roller'],
    dayRate: 1800,
    city: 'Pune',
    state: 'Maharashtra',
    isAvailable: true,
    isVerified: true,
    rating: 4.7,
    reviewCount: 38
  },
  {
    id: 'op_mock_5',
    user: { id: 'u_5', firstName: 'Manoj', lastName: 'Gowda' },
    yearsOfExperience: 3,
    equipmentTypes: ['Forklift'],
    dayRate: 800,
    city: 'Bengaluru',
    state: 'Karnataka',
    isAvailable: true,
    isVerified: false,
    rating: 4.2,
    reviewCount: 5
  },
];

  useEffect(() => {
    setLoading(true);
    operatorsApi.getOperators(filters)
      .then(d => {
        // Merge API operators with mock operators for the demo
        const merged = [...(d.operators || []), ...MOCK_OPERATORS];
        // Apply basic filtering if needed for the mock data
        const filtered = merged.filter(op => {
          if (filters.city && !op.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
          if (filters.isAvailable === 'true' && !op.isAvailable) return false;
          return true;
        });
        setOperators(filtered);
      })
      .catch(() => setOperators(MOCK_OPERATORS))
      .finally(() => setLoading(false));
  }, [filters]);

  // Load existing profile
  useEffect(() => {
    if (!isAuthenticated) return;
    operatorsApi.getMyProfile().then(d => {
      if (d.profile) {
        setMyProfile(d.profile);
        setForm({
          yearsOfExperience: String(d.profile.yearsOfExperience || ''),
          equipmentTypes: d.profile.equipmentTypes || [],
          dayRate: String(d.profile.dayRate || ''),
          city: d.profile.city || '',
          state: d.profile.state || '',
          bio: d.profile.bio || '',
          isAvailable: d.profile.isAvailable ?? true,
        });
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  const validate = () => {
    const e: Partial<Record<keyof OperatorForm, string>> = {};
    if (!form.yearsOfExperience || Number(form.yearsOfExperience) < 0) e.yearsOfExperience = 'Required';
    if (form.equipmentTypes.length === 0) e.equipmentTypes = 'Select at least one';
    if (!form.dayRate || Number(form.dayRate) <= 0) e.dayRate = 'Required';
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
        equipmentTypes: form.equipmentTypes,
        dayRate: Number(form.dayRate),
        city: form.city.trim(),
        state: form.state.trim(),
        bio: form.bio.trim(),
        isAvailable: form.isAvailable,
      };
      const res = await operatorsApi.createOrUpdate(payload);
      setMyProfile(res.profile);
      setSaveMsg('✓ Profile saved! Your listing is now live.');
      operatorsApi.getOperators(filters).then(d => setOperators(d.operators)).catch(() => {});
    } catch (err: any) {
      setSaveMsg(err.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (eq: string) => {
    setForm(p => ({
      ...p,
      equipmentTypes: p.equipmentTypes.includes(eq)
        ? p.equipmentTypes.filter(e => e !== eq)
        : [...p.equipmentTypes, eq],
    }));
    setFormErrors(p => ({ ...p, equipmentTypes: '' }));
  };

  const fmt = (p: number) => `₹${Number(p).toLocaleString('en-IN')}`;

  const handleContact = async (operatorUserId: string) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!operatorUserId) return;
    setContactingId(operatorUserId);
    try {
      await chatsApi.startOrGet(operatorUserId, 'operator');
      navigate('/chats');
    } catch (err: any) {
      alert(err.message || 'Failed to start chat');
    } finally {
      setContactingId(null);
    }
  };

  return (
    <PageShell 
      breadcrumb="Operators" 
      backTo="/services" 
      backLabel="Services"
      seoTitle="Hire Certified Heavy Equipment Operators | YantraSetu"
      seoDescription="Find and hire verified, experienced heavy equipment operators for excavators, cranes, loaders, and more across India."
    >
      {/* Title + List Service button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-[1.75rem]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
            Hire an Operator
          </h1>
          <p className="text-[#6F757C] text-sm mt-1">Find certified heavy equipment operators near you.</p>
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

      {/* List Your Service Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-5 sm:p-7 mb-6 shadow-sm border-2 border-[#FF6A00]">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
            {myProfile ? 'Edit Your Operator Profile' : 'List Your Operator Service'}
          </h2>
          <p className="text-sm text-[#6F757C] mb-5">
            Fill in your details to appear in the operator directory.
          </p>

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
                  <input
                    type="number" min={0} value={form.yearsOfExperience}
                    onChange={e => { setForm(p => ({ ...p, yearsOfExperience: e.target.value })); setFormErrors(p => ({ ...p, yearsOfExperience: '' })); }}
                    className={`w-full px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] min-h-[44px] ${formErrors.yearsOfExperience ? 'border-red-400' : 'border-[#EDE8E0]'}`}
                    placeholder="e.g. 5"
                  />
                  {formErrors.yearsOfExperience && <p className="text-red-500 text-[11px] mt-1">{formErrors.yearsOfExperience}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Day Rate (₹) *</label>
                  <input
                    type="number" min={0} value={form.dayRate}
                    onChange={e => { setForm(p => ({ ...p, dayRate: e.target.value })); setFormErrors(p => ({ ...p, dayRate: '' })); }}
                    className={`w-full px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] min-h-[44px] ${formErrors.dayRate ? 'border-red-400' : 'border-[#EDE8E0]'}`}
                    placeholder="e.g. 1500"
                  />
                  {formErrors.dayRate && <p className="text-red-500 text-[11px] mt-1">{formErrors.dayRate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>City *</label>
                  <input
                    type="text" value={form.city}
                    onChange={e => { setForm(p => ({ ...p, city: e.target.value })); setFormErrors(p => ({ ...p, city: '' })); }}
                    className={`w-full px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] min-h-[44px] ${formErrors.city ? 'border-red-400' : 'border-[#EDE8E0]'}`}
                    placeholder="e.g. Bengaluru"
                  />
                  {formErrors.city && <p className="text-red-500 text-[11px] mt-1">{formErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>State *</label>
                  <input
                    type="text" value={form.state}
                    onChange={e => { setForm(p => ({ ...p, state: e.target.value })); setFormErrors(p => ({ ...p, state: '' })); }}
                    className={`w-full px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] min-h-[44px] ${formErrors.state ? 'border-red-400' : 'border-[#EDE8E0]'}`}
                    placeholder="e.g. Karnataka"
                  />
                  {formErrors.state && <p className="text-red-500 text-[11px] mt-1">{formErrors.state}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Equipment You Operate *</label>
                <div className="chip-scroll flex-wrap sm:flex">
                  {EQUIPMENT_OPTIONS.map(eq => (
                    <button
                      key={eq} onClick={() => toggleEquipment(eq)} type="button"
                      className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        form.equipmentTypes.includes(eq)
                          ? 'bg-[#FF6A00] text-white border border-[#FF6A00]'
                          : 'bg-white text-[#6F757C] border border-[#EDE8E0] hover:border-[#FF6A00]'
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
                {formErrors.equipmentTypes && <p className="text-red-500 text-[11px] mt-1">{formErrors.equipmentTypes}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Bio / Description</label>
                <textarea
                  value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                  className="w-full px-3 py-3 rounded-lg border border-[#EDE8E0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] resize-none"
                  placeholder="Describe your experience and what makes you a great operator…"
                />
              </div>

              <div className="flex items-center gap-4 mb-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="rounded" />
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

      {/* CTA for non-logged-in users */}
      {!isAuthenticated && !authLoading && (
        <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF8533] rounded-xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-[15px]" style={{ fontFamily: 'Sora, sans-serif' }}>Are you an operator?</p>
            <p className="text-white/80 text-sm">List your service and get hired by contractors across India.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-white/20 backdrop-blur-sm text-white border border-white/40 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white hover:text-[#FF6A00] transition-all min-h-[44px] whitespace-nowrap"
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
          className="w-full sm:w-48 px-4 py-3 bg-white border border-[#EDE8E0] rounded-lg text-sm focus:border-[#FF6A00] focus:outline-none min-h-[44px]"
        />
        <label className="flex items-center gap-2 text-sm text-[#6F757C] min-h-[44px]">
          <input
            type="checkbox"
            checked={filters.isAvailable === 'true'}
            onChange={e => setFilters(p => ({ ...p, isAvailable: e.target.checked ? 'true' : '' }))}
            className="rounded w-4 h-4"
          />
          Available only
        </label>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#FF6A00]" />
        </div>
      ) : operators.length === 0 ? (
        <div className="text-center py-24 sm:py-32">
          <User size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>No operators found</h2>
          <p className="text-sm text-[#6F757C] mt-2">Try broadening your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {operators.map(op => (
            <div key={op.id} className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#FF6A00]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={22} className="text-[#FF6A00]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {op.user?.firstName} {op.user?.lastName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#6F757C]">
                    {op.isVerified && <span className="flex items-center gap-0.5 text-green-600"><CheckCircle size={10} /> Verified</span>}
                    {op.isAvailable ? <span className="text-green-600">Available</span> : <span className="text-red-500">Unavailable</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#6F757C] mb-4">
                <div className="flex items-center gap-2"><Briefcase size={12} />{op.yearsOfExperience} yrs experience</div>
                {op.city && <div className="flex items-center gap-2"><MapPin size={12} />{op.city}, {op.state}</div>}
                {op.rating > 0 && <div className="flex items-center gap-2"><Star size={12} className="text-yellow-500" />{op.rating} ({op.reviewCount} reviews)</div>}
              </div>

              {op.equipmentTypes?.length > 0 && (
                <div className="chip-scroll mb-4">
                  {op.equipmentTypes.slice(0, 4).map((t: string) => (
                    <span key={t} className="px-2.5 py-1 bg-[#EDE8E0] text-[10px] font-medium rounded-full capitalize whitespace-nowrap">
                      {t}
                    </span>
                  ))}
                  {op.equipmentTypes.length > 4 && (
                    <span className="px-2.5 py-1 bg-[#EDE8E0] text-[10px] font-medium rounded-full text-[#6F757C]">
                      +{op.equipmentTypes.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#EDE8E0] pt-3">
                {op.dayRate && (
                  <p className="text-base font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {fmt(op.dayRate)}<span className="text-xs font-normal text-[#6F757C]">/day</span>
                  </p>
                )}
                <button
                  onClick={() => handleContact(op.user?.id)}
                  disabled={contactingId === op.user?.id}
                  className="btn-primary btn-small text-xs flex items-center gap-1.5"
                >
                  {contactingId === op.user?.id ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                  {contactingId === op.user?.id ? 'Connecting…' : 'Contact'}
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
          <Link to="/mechanics" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#EDE8E0] hover:border-blue-300 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wrench size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold group-hover:text-blue-600 transition-colors">Find a Mechanic</p>
              <p className="text-xs text-[#6F757C]">On-site repairs & maintenance</p>
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
