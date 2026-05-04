import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, sendOtp } = useAuth();

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone || !password) {
      setError('Phone and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login({ phone, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(phone);
      navigate('/verify-otp', { state: { phone, otp: result.otp } });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE8E0] flex">
      {/* Left panel — image (desktop only) */}
      <div className="hidden lg:block lg:w-[50vw] relative">
        <img
          src="/images/hero_excavator.jpg"
          alt="Heavy machinery"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101214]/60 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white max-w-md">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '2rem', lineHeight: 1.1 }}>
            India's Heavy Equipment Marketplace.
          </h2>
          <p className="text-white/70 mt-3 text-sm">
            Buy, sell, and rent verified machinery — inspected, documented, and ready to work.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 sm:px-6 py-16 sm:py-12">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <Link to="/" className="block mb-8 sm:mb-10">
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#101214' }}>
              YantraSetu
            </span>
          </Link>

          <h1
            className="text-2xl sm:text-[1.75rem] mb-2"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#101214' }}
          >
            Welcome back
          </h1>
          <p className="text-[#6F757C] text-sm mb-8">
            Sign in to your account to continue.
          </p>

          {/* Mode toggle */}
          <div className="flex bg-white rounded-lg p-1 mb-8 shadow-sm">
            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                mode === 'password'
                  ? 'bg-[#101214] text-white shadow-sm'
                  : 'text-[#6F757C] hover:text-[#101214]'
              }`}
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setMode('otp'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                mode === 'otp'
                  ? 'bg-[#101214] text-white shadow-sm'
                  : 'text-[#6F757C] hover:text-[#101214]'
              }`}
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              OTP
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleSendOtp}>
            {/* Phone */}
            <div className="mb-5">
              <label
                className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#EDE8E0] rounded-lg text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none transition-colors shadow-sm min-h-[48px]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* Password field */}
            {mode === 'password' && (
              <div className="mb-5">
                <label
                  className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-[#EDE8E0] rounded-lg text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none transition-colors shadow-sm min-h-[48px]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F757C] hover:text-[#101214] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'password' ? 'Sign In' : 'Send OTP'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#6F757C] mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FF6A00] font-medium hover:underline">
              Create account
            </Link>
          </p>

          <Link to="/" className="block text-center text-sm text-[#6F757C] mt-4 hover:text-[#101214] transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
