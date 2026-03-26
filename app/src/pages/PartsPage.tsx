import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { partsApi } from '../services/api';
import { Search, ArrowLeft, ArrowRight, Loader2, Eye, MapPin, Gauge } from 'lucide-react';

const CATS = ['engine', 'hydraulics', 'electrical', 'undercarriage', 'cab', 'attachments', 'other'];
const CONDS = ['new', 'used', 'oem', 'aftermarket', 'refurbished'];

export default function PartsPage() {
  const [parts, setParts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, category: '', condition: '' });

  useEffect(() => {
    setLoading(true);
    partsApi.getParts(filters).then(d => { setParts(d.parts); setPagination(d.pagination); }).catch(() => setParts([])).finally(() => setLoading(false));
  }, [filters]);

  const setF = (k: string, v: any) => setFilters(p => ({ ...p, [k]: v, page: k === 'page' ? v : 1 }));
  const fmt = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  return (
    <div className="min-h-screen bg-[#E9E3DA]">
      <div className="bg-white/80 backdrop-blur-md border-b border-[#E9E3DA] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214' }}>YantraSetu</Link>
            <span className="text-[#6F757C] text-sm">/ Parts</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-[#6F757C] hover:text-[#101214]"><ArrowLeft size={16} /> Home</Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.75rem', marginBottom: '1.5rem' }}>Spare Parts Marketplace</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {CATS.map(c => (
            <button key={c} onClick={() => setF('category', filters.category === c ? '' : c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize ${filters.category === c ? 'bg-[#FF6A00] text-white' : 'bg-white border border-[#E9E3DA] text-[#6F757C]'}`}
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c}</button>
          ))}
          <select value={filters.condition} onChange={e => setF('condition', e.target.value)}
            className="ml-auto px-3 py-1.5 bg-white border border-[#E9E3DA] rounded text-sm text-[#6F757C]">
            <option value="">All Conditions</option>{CONDS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        {loading ? <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
        : parts.length === 0 ? (
          <div className="text-center py-32">
            <Gauge size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1.25rem' }}>No parts found</h2>
            <p className="text-sm text-[#6F757C] mt-2">Check back later or try different filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#6F757C] mb-4">{pagination.total} part{pagination.total !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {parts.map(part => (
                <div key={part.id} className="bg-white rounded-lg shadow-sm border border-[#E9E3DA] overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-40 bg-[#E9E3DA] flex items-center justify-center">
                    {part.images?.[0] ? <img src={part.images[0]} className="w-full h-full object-cover" /> : <Gauge size={32} className="text-[#6F757C] opacity-30" />}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{part.partName}</h3>
                      <span className="px-2 py-0.5 bg-[#E9E3DA] text-[10px] font-semibold rounded capitalize" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{part.condition}</span>
                    </div>
                    <p className="text-xs text-[#6F757C] capitalize mb-2">{part.category} {part.partNumber && `· #${part.partNumber}`}</p>
                    <div className="flex items-center gap-2 text-xs text-[#6F757C] mb-3">
                      {part.city && <span className="flex items-center gap-1"><MapPin size={11} />{part.city}</span>}
                      <span className="flex items-center gap-1"><Eye size={11} />{part.viewCount}</span>
                      {part.quantity > 1 && <span>Qty: {part.quantity}</span>}
                    </div>
                    <p className="text-lg font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>{fmt(part.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button disabled={pagination.page <= 1} onClick={() => setF('page', pagination.page - 1)} className="p-2.5 bg-white border border-[#E9E3DA] rounded shadow-sm disabled:opacity-40"><ArrowLeft size={16} /></button>
                <span className="text-sm text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{pagination.page}/{pagination.pages}</span>
                <button disabled={pagination.page >= pagination.pages} onClick={() => setF('page', pagination.page + 1)} className="p-2.5 bg-white border border-[#E9E3DA] rounded shadow-sm disabled:opacity-40"><ArrowRight size={16} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
