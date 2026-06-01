import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Phone, Lock, Mail, User, Eye, EyeOff, Loader2, Building2, Gift, Check, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

// Shadcn UI
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';

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
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    userType: 'individual',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill referral code from URL ?ref=XXXX
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && !form.referralCode) {
      setForm(prev => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

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

    // Phone validation (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(form.phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    // Email validation (standard email format)
    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    // Password validation (min 8 chars, at least one letter and one number)
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[a-zA-Z]/.test(form.password)) {
      setError('Password must contain at least one letter.');
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError('Password must contain at least one number.');
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
        referralCode: form.referralCode || undefined,
      } as any);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F5EFEB] flex">
        {/* Left panel */}
        <div className="hidden lg:block lg:w-[50vw] relative">
          <img
            src="/images/safety_quarry.jpg"
            alt="Heavy machinery"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101214]/80 to-transparent" />
          <div className="absolute bottom-16 left-16 text-white max-w-lg">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.1 }}
            >
              Join India's largest heavy equipment network.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-white/70 mt-4 text-base"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Create a free account and start buying, selling, or renting machinery today.
            </motion.p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col justify-center items-center px-5 sm:px-6 py-16 sm:py-12 bg-white relative overflow-y-auto">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[480px] relative z-10"
          >
            <div className="text-center mb-6">
              <Link to="/" className="inline-block">
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: '#FF6A00' }}>
                  YantraSetu
                </span>
              </Link>
            </div>

            <Card className="border-none shadow-2xl shadow-black/5 bg-white">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="text-2xl text-center" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Create your account
                </CardTitle>
                <CardDescription className="text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  One account for everything — buy, sell, rent, hire.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription style={{ fontFamily: 'DM Sans, sans-serif' }}>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>First Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                        <Input
                          value={form.firstName}
                          onChange={(e) => update('firstName', e.target.value)}
                          placeholder="First name"
                          className="pl-9 h-11 focus-visible:ring-[#FF6A00]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Last Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                        <Input
                          value={form.lastName}
                          onChange={(e) => update('lastName', e.target.value)}
                          placeholder="Last name"
                          className="pl-9 h-11 focus-visible:ring-[#FF6A00]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        placeholder="10-digit phone number"
                        className="pl-9 h-11 focus-visible:ring-[#FF6A00]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Email (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        placeholder="you@example.com"
                        className="pl-9 h-11 focus-visible:ring-[#FF6A00]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        placeholder="Min 6 characters"
                        className="pl-9 pr-9 h-11 focus-visible:ring-[#FF6A00]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#6F757C] hover:text-[#101214]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>I am a</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {USER_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => update('userType', t.value)}
                          className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                            form.userType === t.value
                              ? 'border-[#FF6A00] bg-[#FF6A00]/5 shadow-sm'
                              : 'border-[#EDE8E0] bg-white hover:border-[#6F757C]'
                          }`}
                        >
                          <Building2 className={`h-4 w-4 mb-2 ${form.userType === t.value ? 'text-[#FF6A00]' : 'text-[#6F757C]'}`} />
                          <p className={`text-xs font-semibold ${form.userType === t.value ? 'text-[#101214]' : 'text-[#6F757C]'}`} style={{ fontFamily: 'Sora, sans-serif' }}>
                            {t.label}
                          </p>
                          {form.userType === t.value && (
                            <div className="absolute top-2 right-2 bg-[#FF6A00] text-white rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Referral Code (Optional)</label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                      <Input
                        type="text"
                        value={form.referralCode}
                        onChange={(e) => update('referralCode', e.target.value.toUpperCase())}
                        placeholder="e.g. AB12CD34"
                        maxLength={20}
                        className="pl-9 h-11 focus-visible:ring-[#FF6A00]"
                      />
                    </div>
                    {form.referralCode && (
                      <p className="text-[10px] text-green-600 mt-1 ml-1 font-semibold flex items-center gap-1 uppercase tracking-wide" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        <Check className="h-3 w-3" /> Referral code applied
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-11 bg-[#101214] hover:bg-[#202428] text-white mt-2">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        Create Account <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 border-t border-[#EDE8E0] pt-6 mt-2">
                <p className="text-center text-sm text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#FF6A00] font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
                <Link to="/" className="text-center text-xs text-[#6F757C] hover:text-[#101214] transition-colors" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  ← Back to home
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
