import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import {
  User, Phone, Mail, Building2, MapPin, FileText, Hash,
  Save, Loader2, LogOut, Lock, ArrowLeft, CheckCircle,
  Camera, Star, Calendar, Shield, Award
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    profileImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        companyName: user.companyName || '',
        gstNumber: user.gstNumber || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, profileImage: base64 }));
      setError('');
      setSuccess('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updateProfile(form);
      await refreshUser();
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E9E3DA] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6A00]" />
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—';

  const inputClass = 'w-full pl-11 pr-4 py-3.5 bg-white border border-[#E9E3DA] rounded-lg text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none transition-colors shadow-sm';
  const labelClass = 'block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider';

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[#E9E3DA] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-[#6F757C] hover:text-[#101214] transition-colors">
            <ArrowLeft size={16} />
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214' }}>YantraSetu</span>
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors font-medium">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] overflow-hidden mb-8">
          {/* Gradient banner */}
          <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #FF6A00 0%, #FF8C38 50%, #FFB347 100%)' }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          </div>

          <div className="px-6 pb-6 -mt-12">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer group"
                style={{ background: form.profileImage ? 'transparent' : 'linear-gradient(135deg, #FF6A00, #FF8C38)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {form.profileImage ? (
                  <img src={form.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={22} className="text-white" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF6A00] rounded-full flex items-center justify-center text-white shadow-md border-2 border-white hover:bg-[#e55f00] transition-colors"
              >
                <Camera size={14} />
              </button>
            </div>

            {/* Name and phone */}
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#101214' }}>
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-[#6F757C] text-sm flex items-center gap-1.5 mt-1">
              <Phone size={14} /> {user?.phone}
              {user?.isVerified && <CheckCircle size={14} className="text-green-600 ml-1" />}
            </p>

            {/* Info badges row */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6A00]/10 text-[#FF6A00] text-xs font-semibold rounded-full"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <Shield size={12} />
                {user?.userType?.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#101214]/5 text-[#101214] text-xs font-semibold rounded-full"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <Award size={12} />
                {user?.accountTier?.toUpperCase() || 'FREE'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <Calendar size={12} />
                SINCE {memberSince.toUpperCase()}
              </span>
              {(user as any)?.rating > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-600 text-xs font-semibold rounded-full"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  <Star size={12} />
                  {(user as any).rating} ({(user as any).reviewCount} REVIEWS)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave}>
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-6 mb-6">
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214', marginBottom: '1.25rem' }}
              className="flex items-center gap-2">
              <User size={18} className="text-[#FF6A00]" /> Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>First Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                    className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Last Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
                    className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Phone</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type="text" value={user?.phone || ''} disabled
                  className={`${inputClass} bg-[#f5f3f0] cursor-not-allowed text-[#6F757C]`} style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
              <p className="text-xs text-[#6F757C] mt-1 ml-1">Phone cannot be changed</p>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-6 mb-6">
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214', marginBottom: '1.25rem' }}
              className="flex items-center gap-2">
              <Building2 size={18} className="text-[#FF6A00]" /> Business Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Company Name</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.companyName} onChange={(e) => update('companyName', e.target.value)}
                    placeholder="Optional"
                    className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>GST Number</label>
                <div className="relative">
                  <Hash size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.gstNumber} onChange={(e) => update('gstNumber', e.target.value)}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-6 mb-6">
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214', marginBottom: '1.25rem' }}
              className="flex items-center gap-2">
              <MapPin size={18} className="text-[#FF6A00]" /> Location
            </h2>

            <div className="mb-4">
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Address</label>
              <div className="relative">
                <FileText size={18} className="absolute left-3.5 top-3.5 text-[#6F757C]" />
                <textarea value={form.address} onChange={(e) => update('address', e.target.value)}
                  rows={3}
                  placeholder="Street address, landmark, etc."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#E9E3DA] rounded-lg text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none transition-colors shadow-sm resize-none"
                  style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>City</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)}
                    className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>State</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.state} onChange={(e) => update('state', e.target.value)}
                    className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>PIN Code</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                  <input type="text" value={form.pincode} onChange={(e) => update('pincode', e.target.value)}
                    maxLength={6}
                    className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ borderRadius: '0.75rem', padding: '0.875rem' }}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : (
              <><Save size={16} /> Save Changes</>
            )}
          </button>
        </form>

        {/* Change Password link */}
        <Link to="/change-password"
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-[#101214] bg-white border border-[#E9E3DA] rounded-xl shadow-sm hover:border-[#6F757C] transition-colors"
          style={{ fontFamily: 'Sora, sans-serif' }}>
          <Lock size={16} /> Change Password
        </Link>
      </div>
    </div>
  );
}
