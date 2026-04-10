import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { certificationsApi } from '../services/api';
import { Loader2, Upload, FileCheck, Clock, CheckCircle, XCircle, Plus, X, Shield } from 'lucide-react';
import PageShell from '../components/PageShell';

const CERT_TYPES = [
  { value: 'DGMS', label: 'DGMS Certificate' },
  { value: 'crane_operator', label: 'Crane Operator License' },
  { value: 'JCB_certified', label: 'JCB Certified Operator' },
  { value: 'ITI_diploma', label: 'ITI Diploma' },
  { value: 'trade_license', label: 'Trade License' },
  { value: 'GST_certificate', label: 'GST Certificate' },
  { value: 'ISO', label: 'ISO Certification' },
  { value: 'safety_training', label: 'Safety Training' },
  { value: 'other', label: 'Other' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock },
  approved: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
};

export default function CertificationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    certificationType: '',
    documentName: '',
    documentNumber: '',
    issuingAuthority: '',
    issuedDate: '',
    expiresAt: '',
    documentImage: ''
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    certificationsApi.getMine()
      .then(d => setCerts(d.certifications))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg('File must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, documentImage: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.certificationType || !form.documentName || !form.documentImage) {
      setMsg('Please fill required fields and upload a document.');
      return;
    }
    setSubmitting(true); setMsg('');
    try {
      const res = await certificationsApi.submit(form);
      setCerts(prev => [res.certification, ...prev]);
      setShowForm(false);
      setForm({ certificationType: '', documentName: '', documentNumber: '', issuingAuthority: '', issuedDate: '', expiresAt: '', documentImage: '' });
      setMsg('✅ Certificate submitted for verification!');
    } catch (err: any) { setMsg(err.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <PageShell breadcrumb="Certifications"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  return (
    <PageShell breadcrumb="Certifications" backTo="/profile" backLabel="Profile">
        {/* Title + CTA */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem' }}>My Certifications</h1>
            <p className="text-sm text-[#6F757C] mt-1">Submit certifications for admin verification to earn a verified badge.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
            {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Submit Certificate</>}
          </button>
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>
        )}

        {/* Submit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-6 mb-8">
            <h2 className="font-semibold text-sm mb-5 text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>New Certification</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Certificate Type *</label>
                <select value={form.certificationType} onChange={e => setForm(p => ({ ...p, certificationType: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30">
                  <option value="">Select type…</option>
                  {CERT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Document Name *</label>
                <input type="text" placeholder="e.g. Heavy Equipment Operator License" value={form.documentName}
                  onChange={e => setForm(p => ({ ...p, documentName: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Certificate/License Number</label>
                <input type="text" placeholder="e.g. DGMS/2024/1234" value={form.documentNumber}
                  onChange={e => setForm(p => ({ ...p, documentNumber: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Issuing Authority</label>
                <input type="text" placeholder="e.g. DGMS India" value={form.issuingAuthority}
                  onChange={e => setForm(p => ({ ...p, issuingAuthority: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Issue Date</label>
                <input type="date" value={form.issuedDate} onChange={e => setForm(p => ({ ...p, issuedDate: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Expiry Date</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30" />
              </div>
            </div>

            {/* Document upload */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-[#6F757C] mb-1.5">Document Image *</label>
              {form.documentImage ? (
                <div className="relative w-full h-48 border border-[#E9E3DA] rounded-lg overflow-hidden bg-[#E9E3DA]">
                  <img src={form.documentImage} alt="Document" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setForm(p => ({ ...p, documentImage: '' }))}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center"><X size={14} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-[#D1CBC2] rounded-lg flex flex-col items-center gap-2 text-[#6F757C] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors">
                  <Upload size={28} />
                  <span className="text-sm">Click to upload certificate image</span>
                  <span className="text-xs opacity-60">JPEG, PNG, PDF — max 5 MB</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2 w-full py-3 disabled:opacity-50">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><FileCheck size={16} /> Submit for Verification</>}
            </button>
          </form>
        )}

        {/* Certifications List */}
        {certs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-12 text-center">
            <Shield size={48} className="mx-auto text-[#6F757C] opacity-30 mb-4" />
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1.1rem' }}>No certifications yet</h2>
            <p className="text-sm text-[#6F757C] mt-2">Submit your certificates to get a verified badge on your profile.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map(cert => {
              const st = STATUS_STYLES[cert.status] || STATUS_STYLES.pending;
              const StIcon = st.icon;
              const typeLabel = CERT_TYPES.find(c => c.value === cert.certificationType)?.label || cert.certificationType;
              return (
                <div key={cert.id} className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm truncate" style={{ fontFamily: 'Sora, sans-serif' }}>{cert.documentName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.bg} ${st.text}`}>
                        <StIcon size={10} /> {cert.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#6F757C]">
                      {typeLabel}
                      {cert.documentNumber && <> · #{cert.documentNumber}</>}
                      {cert.issuingAuthority && <> · {cert.issuingAuthority}</>}
                    </p>
                    {cert.adminNotes && <p className="text-xs mt-1.5 text-[#6F757C] italic">Admin: {cert.adminNotes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-[#6F757C] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {new Date(cert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    {cert.expiresAt && (
                      <p className="text-[10px] text-[#6F757C] mt-0.5">Expires: {new Date(cert.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </PageShell>
  );
}
