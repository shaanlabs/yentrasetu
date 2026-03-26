import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import {
  User, Phone, Mail, Building2, MapPin,
  Save, Loader2, LogOut, Lock, ArrowLeft, CheckCircle
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isLoading, isAuthenticated, navigate]);

  // Populate form from user
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        companyName: user.companyName || '',
        city: user.city || '',
        state: user.state || '',
        pincode: '',
      });
    }
  }, [user]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
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

  const inputClass = 'w-full pl-11 pr-4 py-3.5 bg-white border border-[#E9E3DA] rounded text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none transition-colors shadow-sm';
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-[#FF6A00]/10 rounded-full flex items-center justify-center">
            <User size={28} className="text-[#FF6A00]" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#101214' }}>
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-[#6F757C] text-sm flex items-center gap-1.5">
              <Phone size={14} /> {user?.phone}
              {user?.isVerified && <CheckCircle size={14} className="text-green-600 ml-1" />}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <span className="px-3 py-1.5 bg-[#FF6A00]/10 text-[#FF6A00] text-xs font-semibold rounded"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {user?.userType?.toUpperCase()}
          </span>
          <span className="px-3 py-1.5 bg-[#101214]/5 text-[#101214] text-xs font-semibold rounded"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {user?.accountTier?.toUpperCase() || 'FREE'}
          </span>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-6 mb-6">
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214', marginBottom: '1.25rem' }}>
              Personal Information
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
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Company Name</label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type="text" value={form.companyName} onChange={(e) => update('companyName', e.target.value)}
                  className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-6 mb-6">
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214', marginBottom: '1.25rem' }}>
              Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div className="mt-4">
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>PIN Code</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type="text" value={form.pincode} onChange={(e) => update('pincode', e.target.value)}
                  className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <Loader2 size={18} className="animate-spin" /> : (
              <><Save size={16} /> Save Changes</>
            )}
          </button>
        </form>

        {/* Change Password link */}
        <Link to="/change-password"
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-[#101214] bg-white border border-[#E9E3DA] rounded shadow-sm hover:border-[#6F757C] transition-colors"
          style={{ fontFamily: 'Sora, sans-serif' }}>
          <Lock size={16} /> Change Password
        </Link>
      </div>
    </div>
  );
}
