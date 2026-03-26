import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mechanicsApi } from '../services/api';
import { ArrowLeft, Loader2, MapPin, Star, Wrench, CheckCircle } from 'lucide-react';

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', isAvailable: 'true' });

  useEffect(() => {
    setLoading(true);
    mechanicsApi.getMechanics(filters).then(d => setMechanics(d.mechanics)).catch(() => setMechanics([])).finally(() => setLoading(false));
  }, [filters]);

  const fmt = (p: number) => `₹${Number(p).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      <div className="bg-white/80 backdrop-blur-md border-b border-[#E9E3DA] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214' }}>YantraSetu</Link>
            <span className="text-[#6F757C] text-sm">/ Mechanics</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-[#6F757C] hover:text-[#101214]"><ArrowLeft size={16} /> Home</Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.75rem', marginBottom: '0.5rem' }}>Find a Mechanic</h1>
        <p className="text-[#6F757C] text-sm mb-6">Expert mechanics for heavy equipment repair and maintenance.</p>
        <div className="flex gap-3 mb-8">
          <input placeholder="Filter by city…" value={filters.city} onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
            className="px-4 py-2.5 bg-white border border-[#E9E3DA] rounded text-sm w-48 focus:border-[#FF6A00] focus:outline-none" />
          <label className="flex items-center gap-2 text-sm text-[#6F757C]">
            <input type="checkbox" checked={filters.isAvailable === 'true'} onChange={e => setFilters(p => ({ ...p, isAvailable: e.target.checked ? 'true' : '' }))} className="rounded" />
            Available only
          </label>
        </div>
        {loading ? <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
        : mechanics.length === 0 ? (
          <div className="text-center py-32">
            <Wrench size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>No mechanics found</h2>
            <p className="text-sm text-[#6F757C] mt-2">Try broadening your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mechanics.map(m => (
              <div key={m.id} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Wrench size={22} className="text-blue-600" /></div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{m.user?.firstName} {m.user?.lastName}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#6F757C]">
                      {m.isVerified && <span className="flex items-center gap-0.5 text-green-600"><CheckCircle size={10} /> Verified</span>}
                      {m.isAvailable ? <span className="text-green-600">Available</span> : <span className="text-red-500">Unavailable</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-[#6F757C] mb-4">
                  <div className="flex items-center gap-2"><Wrench size={12} />{m.yearsOfExperience} yrs experience</div>
                  {m.city && <div className="flex items-center gap-2"><MapPin size={12} />{m.city}, {m.state}</div>}
                  {m.rating > 0 && <div className="flex items-center gap-2"><Star size={12} className="text-yellow-500" />{m.rating} ({m.reviewCount} reviews)</div>}
                  {m.serviceRadius && <div>Service radius: {m.serviceRadius} km</div>}
                </div>
                {m.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">{m.specializations.slice(0, 3).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded capitalize">{s}</span>
                  ))}</div>
                )}
                <div className="flex items-center justify-between border-t border-[#E9E3DA] pt-3">
                  <div>
                    {m.hourlyRate && <p className="text-xs text-[#6F757C]">{fmt(m.hourlyRate)}/hr</p>}
                    {m.dailyRate && <p className="text-sm font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{fmt(m.dailyRate)}/day</p>}
                  </div>
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
