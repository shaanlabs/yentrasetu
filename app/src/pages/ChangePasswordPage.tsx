import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import PageShell from '../components/PageShell';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isLoading, isAuthenticated, navigate]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess(false);
  };

  const toggleShow = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.newPassword || form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <PageShell breadcrumb="Password" backTo="/profile" backLabel="Profile"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;
  }

  const inputClass = 'w-full pl-11 pr-12 py-3.5 bg-white border border-[#E9E3DA] rounded-lg text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none transition-colors shadow-sm min-h-[48px]';
  const labelClass = 'block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider';

  return (
    <PageShell breadcrumb="Change Password" backTo="/profile" backLabel="Profile">
      <div className="max-w-lg mx-auto">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#101214', marginBottom: '0.5rem' }}>
          Change Password
        </h1>
        <p className="text-[#6F757C] text-sm mb-8">
          Update your account password.
        </p>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-3.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> Password changed successfully.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 sm:p-6 space-y-5">
            <div>
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Current Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type={showPasswords.current ? 'text' : 'password'} value={form.currentPassword}
                  onChange={(e) => update('currentPassword', e.target.value)}
                  placeholder="Enter current password" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                <button type="button" onClick={() => toggleShow('current')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F757C] hover:text-[#101214] transition-colors">
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>New Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type={showPasswords.new ? 'text' : 'password'} value={form.newPassword}
                  onChange={(e) => update('newPassword', e.target.value)}
                  placeholder="Min 6 characters" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                <button type="button" onClick={() => toggleShow('new')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F757C] hover:text-[#101214] transition-colors">
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Confirm New Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F757C]" />
                <input type={showPasswords.confirm ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Repeat new password" className={inputClass} style={{ fontFamily: 'Inter, sans-serif' }} />
                <button type="button" onClick={() => toggleShow('confirm')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F757C] hover:text-[#101214] transition-colors">
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
