import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';

const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithOtp, sendOtp } = useAuth();

  const phone = (location.state as any)?.phone || '';
  const devOtp = (location.state as any)?.otp || '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no phone
  useEffect(() => {
    if (!phone) navigate('/login');
  }, [phone, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    // Auto-focus next
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newDigits.every((d) => d) && newDigits.join('').length === OTP_LENGTH) {
      submitOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      submitOtp(pasted);
    }
  };

  const submitOtp = async (otp: string) => {
    setLoading(true);
    setError('');
    try {
      await loginWithOtp(phone, otp);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await sendOtp(phone);
      setCountdown(30);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE8E0] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px] text-center">
        <Link to="/" className="inline-block mb-10">
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#101214' }}>
            YantraSetu
          </span>
        </Link>

        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.75rem', color: '#101214', marginBottom: '0.5rem' }}>
          Verify your phone
        </h1>
        <p className="text-[#6F757C] text-sm mb-2">
          Enter the 6-digit code sent to
        </p>
        <p className="text-[#101214] font-semibold text-sm mb-1">
          {phone || '—'}
        </p>

        {/* Dev hint */}
        {devOtp && (
          <div className="mb-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            DEV MODE — OTP: <strong>{devOtp}</strong>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mt-8 mb-8" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold bg-white border-2 border-[#EDE8E0] rounded-lg focus:border-[#FF6A00] focus:outline-none transition-colors shadow-sm"
              style={{ fontFamily: 'Sora, sans-serif', color: '#101214' }}
              disabled={loading}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          onClick={() => submitOtp(digits.join(''))}
          disabled={loading || digits.some((d) => !d)}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : (
            <>Verify & Sign In <ArrowRight size={16} /></>
          )}
        </button>

        {/* Resend */}
        <div className="mt-6">
          {countdown > 0 ? (
            <p className="text-[#6F757C] text-sm">
              Resend code in <span className="text-[#101214] font-medium">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-[#FF6A00] text-sm font-medium hover:underline disabled:opacity-60"
            >
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          )}
        </div>

        <Link to="/login" className="block text-sm text-[#6F757C] mt-6 hover:text-[#101214] transition-colors">
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
