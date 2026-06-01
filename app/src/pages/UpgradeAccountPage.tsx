import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { Loader2, Briefcase, FileText, MapPin, Building, ShieldCheck } from 'lucide-react';
import PageShell from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function UpgradeAccountPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, setAuthState } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  const [form, setForm] = useState({
    userType: 'dealer',
    companyName: user?.companyName || '',
    gstNumber: user?.gstNumber || '',
    address: user?.address || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.address.trim()) {
      setError('Company Name and Address are required.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await authApi.updateProfile(form);
      setAuthState((prev: any) => ({ ...prev, user: res.user }));
      setSuccess(true);
      setTimeout(() => navigate('/sell'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade account.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <PageShell breadcrumb="Loading..."><div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  return (
    <PageShell breadcrumb="Upgrade Account" backTo="/sell" backLabel="Back to Listing">
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE8E0] p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#EDE8E0]">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6A00]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>Become a Verified Seller</h1>
              <p className="text-sm text-[#6F757C]">Provide your business details to unlock equipment listing capabilities.</p>
            </div>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#101214] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Account Upgraded Successfully!</h2>
              <p className="text-sm text-[#6F757C] mb-6">You are now a registered seller and can start listing your machinery.</p>
              <Loader2 className="animate-spin text-[#FF6A00] mx-auto" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6F757C] uppercase tracking-wider mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Account Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'dealer', label: 'Dealer', icon: Briefcase },
                      { id: 'company', label: 'Company', icon: Building },
                      { id: 'contractor', label: 'Contractor', icon: FileText }
                    ].map(type => (
                      <div 
                        key={type.id}
                        onClick={() => setForm(p => ({ ...p, userType: type.id }))}
                        className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-all ${form.userType === type.id ? 'border-[#FF6A00] bg-[#FF6A00]/5 text-[#FF6A00]' : 'border-[#EDE8E0] hover:border-gray-300 text-[#6F757C]'}`}
                      >
                        <type.icon size={20} />
                        <span className="text-sm font-semibold">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#6F757C] uppercase tracking-wider mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Company/Business Name *</label>
                    <Input 
                      placeholder="e.g. ABC Equipments Ltd." 
                      value={form.companyName} 
                      onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                      className="h-12 focus-visible:ring-[#FF6A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6F757C] uppercase tracking-wider mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>GST Number (Optional)</label>
                    <Input 
                      placeholder="e.g. 22AAAAA0000A1Z5" 
                      value={form.gstNumber} 
                      onChange={e => setForm(p => ({ ...p, gstNumber: e.target.value }))}
                      className="h-12 focus-visible:ring-[#FF6A00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6F757C] uppercase tracking-wider mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Business Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 text-[#6F757C]" size={18} />
                      <Input 
                        placeholder="Complete business address" 
                        value={form.address} 
                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                        className="h-12 pl-10 focus-visible:ring-[#FF6A00]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EDE8E0]">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold rounded-xl transition-colors text-base"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : 'Complete Account Upgrade'}
                </Button>
                <p className="text-center text-xs text-[#6F757C] mt-3">
                  By upgrading, you agree to our Seller Terms and Conditions.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}
