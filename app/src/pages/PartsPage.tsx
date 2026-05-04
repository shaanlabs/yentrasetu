import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { partsApi, chatsApi } from '../services/api';
import { ArrowLeft, ArrowRight, Loader2, Eye, MapPin, Gauge, Search, MessageCircle } from 'lucide-react';
import PageShell from '../components/PageShell';

const CATS = ['engine', 'hydraulics', 'electrical', 'undercarriage', 'cab', 'attachments', 'other'];
const CONDS = ['new', 'used', 'oem', 'aftermarket', 'refurbished'];

export default function PartsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [parts, setParts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, category: '', condition: '', query: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [contactingId, setContactingId] = useState<string | null>(null);

  const handleContactSeller = async (sellerId: string) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!sellerId) return;
    setContactingId(sellerId);
    try {
      await chatsApi.startOrGet(sellerId, 'part');
      navigate('/chats');
    } catch (err: any) {
      alert(err.message || 'Failed to start chat');
    } finally {
      setContactingId(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, query: searchQuery, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    partsApi.getParts(filters).then(d => {
      setParts(d.parts);
      setPagination(d.pagination);
    }).catch(() => setParts([])).finally(() => setLoading(false));
  }, [filters]);

  const setF = (k: string, v: any) => setFilters(p => ({ ...p, [k]: v, page: k === 'page' ? v : 1 }));
  const fmt = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  return (
    <PageShell breadcrumb="Parts" backTo="/" backLabel="Home" title="Spare Parts Marketplace">
      {/* Search bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6F757C]">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Search by part name, number, or OEM..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-[#EDE8E0] py-3.5 pl-12 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent transition-all min-h-[48px]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6F757C] hover:text-[#101214]"
          >
            ×
          </button>
        )}
      </div>

      {/* Filters row — horizontal scroll on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="chip-scroll">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setF('category', filters.category === c ? '' : c)}
              className={`px-3 py-2 text-xs font-medium rounded-full capitalize whitespace-nowrap ${
                filters.category === c
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-white border border-[#EDE8E0] text-[#6F757C] hover:text-[#101214]'
              }`}
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={filters.condition}
          onChange={e => setF('condition', e.target.value)}
          className="sm:ml-auto px-3 py-2.5 bg-white border border-[#EDE8E0] rounded-lg text-sm text-[#6F757C] focus:outline-none focus:border-[#FF6A00] min-h-[44px]"
        >
          <option value="">All Conditions</option>
          {CONDS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#FF6A00]" />
        </div>
      ) : parts.length === 0 ? (
        <div className="text-center py-24 sm:py-32">
          <Gauge size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1.25rem' }}>No parts found</h2>
          <p className="text-sm text-[#6F757C] mt-2">Check back later or try different filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#6F757C] mb-4">{pagination.total} part{pagination.total !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {parts.map(part => (
              <div key={part.id} className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] overflow-hidden hover:shadow-md transition-all group">
                <div className="h-44 sm:h-40 bg-[#EDE8E0] flex items-center justify-center relative">
                  {part.images?.[0] ? (
                    <img src={part.images[0]} className="w-full h-full object-cover" alt={part.partName} />
                  ) : (
                    <Gauge size={32} className="text-[#6F757C] opacity-30" />
                  )}
                  <span
                    className="absolute top-3 right-3 px-2 py-1 bg-white/90 text-[10px] font-semibold rounded capitalize shadow-sm"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {part.condition}
                  </span>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {part.partName}
                  </h3>
                  <p className="text-xs text-[#6F757C] capitalize mb-2">
                    {part.category} {part.partNumber && `· #${part.partNumber}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#6F757C] mb-3 flex-wrap">
                    {part.city && <span className="flex items-center gap-1"><MapPin size={11} />{part.city}</span>}
                    <span className="flex items-center gap-1"><Eye size={11} />{part.viewCount}</span>
                    {part.quantity > 1 && <span>Qty: {part.quantity}</span>}
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-lg font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {fmt(part.price)}
                    </p>
                    <button
                      onClick={() => handleContactSeller(part.seller?.id)}
                      disabled={contactingId === part.seller?.id}
                      className="p-2 bg-[#FF6A00]/10 rounded-lg text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white transition-all flex items-center gap-1"
                      title="Contact Seller"
                    >
                      {contactingId === part.seller?.id ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setF('page', pagination.page - 1)}
                className="p-3 bg-white border border-[#EDE8E0] rounded-lg shadow-sm disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeft size={18} />
              </button>
              <span className="text-sm text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {pagination.page}/{pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setF('page', pagination.page + 1)}
                className="p-3 bg-white border border-[#EDE8E0] rounded-lg shadow-sm disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
