import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

// Shadcn UI
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

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
    
    // Phone validation (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
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

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
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
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F5EFEB] flex">
        {/* Left panel — image (desktop only) */}
        <div className="hidden lg:block lg:w-[50vw] relative">
            <img
              src="/images/hero_excavator.jpg"
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
                India's Heavy Equipment Marketplace.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-white/70 mt-4 text-base"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Buy, sell, and rent verified machinery — inspected, documented, and ready to work.
              </motion.p>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="flex-1 flex flex-col justify-center items-center px-5 sm:px-6 py-16 sm:py-12 bg-white relative">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[420px] relative z-10"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-block">
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: '#FF6A00' }}>
                  YantraSetu
                </span>
              </Link>
            </div>

            <Card className="border-none shadow-2xl shadow-black/5 bg-white">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="text-2xl text-center" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Welcome back
                </CardTitle>
                <CardDescription className="text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Sign in to your account to continue.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setError(''); }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="password" style={{ fontFamily: 'Sora, sans-serif' }}>Password</TabsTrigger>
                    <TabsTrigger value="otp" style={{ fontFamily: 'Sora, sans-serif' }}>OTP</TabsTrigger>
                  </TabsList>

                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription style={{ fontFamily: 'DM Sans, sans-serif' }}>{error}</AlertDescription>
                    </Alert>
                  )}

                  <TabsContent value="password">
                    <form onSubmit={handlePasswordLogin} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                          <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                            className="pl-9 h-11 focus-visible:ring-[#FF6A00]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                            Password
                          </label>
                          <Link to="/forgot-password" className="text-xs text-[#FF6A00] hover:underline" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            Forgot password?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
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

                      <Button type="submit" disabled={loading} className="w-full h-11 bg-[#101214] hover:bg-[#202428] text-white">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                          <>
                            Sign In <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="otp">
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-[#6F757C]" />
                          <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                            className="pl-9 h-11 focus-visible:ring-[#FF6A00]"
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={loading} className="w-full h-11 bg-[#FF6A00] hover:bg-[#e55f00] text-white">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                          <>
                            Send OTP <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 border-t border-[#EDE8E0] pt-6 mt-2">
                <p className="text-center text-sm text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Don't have an account?{' '}
                  <Link to="/register" className="text-[#FF6A00] font-semibold hover:underline">
                    Create account
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
