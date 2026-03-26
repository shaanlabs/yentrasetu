import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { operatorsApi } from '../services/api';
import { ArrowLeft, Loader2, MapPin, Star, Briefcase, User, CheckCircle } from 'lucide-react';

export default function OperatorsPage() {
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', isAvailable: 'true' });

  useEffect(() => {
    setLoading(true);
    operatorsApi.getOperators(filters).then(d => setOperators(d.operators)).catch(() => setOperators([])).finally(() => setLoading(false));
  }, [filters]);

  const fmt = (p: number) => `₹${Number(p).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      <div className="bg-white/80 backdrop-blur-md border-b border-[#E9E3DA] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214' }}>YantraSetu</Link>
            <span className="text-[#6F757C] text-sm">/ Operators</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-[#6F757C] hover:text-[#101214]"><ArrowLeft size={16} /> Home</Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.75rem', marginBottom: '0.5rem' }}>Hire an Operator</h1>
        <p className="text-[#6F757C] text-sm mb-6">Find certified heavy equipment operators near you.</p>
        <div className="flex gap-3 mb-8">
          <input placeholder="Filter by city…" value={filters.city} onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
            className="px-4 py-2.5 bg-white border border-[#E9E3DA] rounded text-sm w-48 focus:border-[#FF6A00] focus:outline-none" />
          <label className="flex items-center gap-2 text-sm text-[#6F757C]">
            <input type="checkbox" checked={filters.isAvailable === 'true'} onChange={e => setFilters(p => ({ ...p, isAvailable: e.target.checked ? 'true' : '' }))} className="rounded" />
            Available only
          </label>
        </div>
        {loading ? <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
        : operators.length === 0 ? (
          <div className="text-center py-32">
            <User size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>No operators found</h2>
            <p className="text-sm text-[#6F757C] mt-2">Try broadening your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {operators.map(op => (
              <div key={op.id} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#FF6A00]/10 rounded-full flex items-center justify-center"><User size={22} className="text-[#FF6A00]" /></div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{op.user?.firstName} {op.user?.lastName}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#6F757C]">
                      {op.isVerified && <span className="flex items-center gap-0.5 text-green-600"><CheckCircle size={10} /> Verified</span>}
                      {op.isAvailable ? <span className="text-green-600">Available</span> : <span className="text-red-500">Unavailable</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-[#6F757C] mb-4">
                  <div className="flex items-center gap-2"><Briefcase size={12} />{op.yearsOfExperience} yrs experience</div>
                  {op.city && <div className="flex items-center gap-2"><MapPin size={12} />{op.city}, {op.state}</div>}
                  {op.rating > 0 && <div className="flex items-center gap-2"><Star size={12} className="text-yellow-500" />{op.rating} ({op.reviewCount} reviews)</div>}
                </div>
                {op.equipmentTypes?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">{op.equipmentTypes.slice(0, 3).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 bg-[#E9E3DA] text-[10px] rounded capitalize">{t}</span>
                  ))}</div>
                )}
                <div className="flex items-center justify-between border-t border-[#E9E3DA] pt-3">
                  {op.dayRate && <p className="text-sm font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{fmt(op.dayRate)}/day</p>}
                  <button className="btn-primary btn-small text-xs px-4 py-2">Contact</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
