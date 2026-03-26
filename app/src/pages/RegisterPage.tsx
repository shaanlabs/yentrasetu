import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Phone, Lock, Mail, User, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';

const USER_TYPES = [
  { value: 'individual', label: 'Individual', desc: 'Buy, sell, or rent machinery' },
  { value: 'contractor', label: 'Contractor', desc: 'Manage fleet & hire operators' },
  { value: 'dealer', label: 'Dealer', desc: 'List inventory & manage leads' },
  { value: 'operator', label: 'Operator', desc: 'Find work & manage bookings' },
  { value: 'mechanic', label: 'Mechanic', desc: 'Offer repair & service' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    userType: 'individual',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.firstName || !form.phone || !form.password) {
      setError('Name, phone, and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        userType: form.userType,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full pl-11 pr-4 py-3.5 bg-white border border-[#E9E3DA] rounded text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none transition-colors shadow-sm';
  const labelClass = 'block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider';

  return (
    <div className="min-h-screen bg-[#E9E3DA] flex">
      {/* Left panel */}
      <div className="hidden lg:block lg:w-[50vw] relative">
        <img
          src="/images/safety_quarry.jpg"
          alt="Heavy machinery"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101214]/60 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white max-w-md">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '2rem', lineHeight: 1.1 }}>
            Join India's largest heavy equipment network.
          </h2>
          <p className="text-white/70 mt-3 text-sm">
            Create a free account and start buying, selling, or renting machinery today.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          <Link to="/" className="block mb-8">
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#101214' }}>
              YantraSetu
            </span>
          </Link>

          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.75rem', color: '#101214', marginBottom: '0.5rem' }}>
            Create your account
          </h1>
          <p className="text-[#6F757C] text-sm mb-8">
            One account for everything — buy, sell, rent, hire.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>First Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                    placeholder="First name" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Last Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
                    placeholder="Last name" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Phone Number *</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                  placeholder="10-digit phone number" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Email (Optional)</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Password *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)}
                  placeholder="Min 6 characters" className={`${inputClass} pr-12`} style={{ fontFamily: 'Inter, sans-serif' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F757C] hover:text-[#101214] transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* User Type */}
            <div className="mb-6">
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>I am a</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {USER_TYPES.map((t) => (
                  <button key={t.value} type="button"
                    onClick={() => update('userType', t.value)}
                    className={`p-3 rounded border text-left transition-all ${
                      form.userType === t.value
                        ? 'border-[#FF6A00] bg-[#FF6A00]/5 shadow-sm'
                        : 'border-[#E9E3DA] bg-white hover:border-[#6F757C]'
                    }`}
                  >
                    <Building2 size={16} className={form.userType === t.value ? 'text-[#FF6A00]' : 'text-[#6F757C]'} />
                    <p className="text-xs font-semibold mt-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#6F757C] mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FF6A00] font-medium hover:underline">Sign in</Link>
          </p>

          <Link to="/" className="block text-center text-sm text-[#6F757C] mt-4 hover:text-[#101214] transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
