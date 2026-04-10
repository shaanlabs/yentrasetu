import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { machineryApi, type MachineryListing } from '../services/api';
import { Plus, Loader2, MapPin, Calendar, Gauge, Eye, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import PageShell from '../components/PageShell';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800', sold: 'bg-blue-100 text-blue-800',
  rented: 'bg-purple-100 text-purple-800', expired: 'bg-gray-100 text-gray-600',
};

export default function MyListingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);

  const [listings, setListings] = useState<MachineryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    try { const data = await machineryApi.getMyListings(); setListings(data.listings); }
    catch { setListings([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (isAuthenticated) fetchListings(); }, [isAuthenticated]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    setActionId(id);
    try { await machineryApi.deleteListing(id); setListings(prev => prev.filter(l => l.id !== id)); }
    catch { /* noop */ }
    finally { setActionId(null); }
  };

  const handleMarkSold = async (id: string) => {
    setActionId(id);
    try { await machineryApi.markAsSold(id, 'sold'); fetchListings(); }
    catch { /* noop */ }
    finally { setActionId(null); }
  };

  const handleRenew = async (id: string) => {
    setActionId(id);
    try { await machineryApi.renewListing(id); fetchListings(); }
    catch { /* noop */ }
    finally { setActionId(null); }
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  if (authLoading) return <PageShell breadcrumb="My Listings"><div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div></PageShell>;

  return (
    <PageShell breadcrumb="My Listings" backTo="/" backLabel="Home">
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#101214' }}>My Listings</h1>
          <Link to="/sell" className="btn-primary btn-small flex items-center gap-2"><Plus size={14} /> New Listing</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-32">
            <Gauge size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1.25rem' }}>No listings yet</h2>
            <p className="text-sm text-[#6F757C] mt-2 mb-6">Create your first listing to start selling or renting.</p>
            <Link to="/sell" className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2"><Plus size={16} /> Post a Listing</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                {/* Thumbnail */}
                <div className="w-full sm:w-32 h-24 bg-[#E9E3DA] rounded overflow-hidden flex-shrink-0">
                  {listing.images?.[0] ? <img src={listing.images[0]} className="w-full h-full object-cover" /> : <Gauge size={24} className="m-auto mt-7 text-[#6F757C] opacity-30" />}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/listing/${listing.id}`} className="font-bold text-sm hover:text-[#FF6A00] transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {listing.make} {listing.model}
                    </Link>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded ${STATUS_COLORS[listing.status] || 'bg-gray-100'}`}
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{listing.status.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#6F757C] mt-1.5 flex-wrap">
                    {listing.year && <span className="flex items-center gap-1"><Calendar size={11} /> {listing.year}</span>}
                    {listing.city && <span className="flex items-center gap-1"><MapPin size={11} /> {listing.city}</span>}
                    <span className="flex items-center gap-1"><Eye size={11} /> {listing.viewCount} views</span>
                  </div>
                  <p className="text-sm font-bold text-[#FF6A00] mt-2" style={{ fontFamily: 'Sora, sans-serif' }}>{formatPrice(listing.price)}</p>
                  {/* Actions */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {listing.status === 'approved' && (
                      <button onClick={() => handleMarkSold(listing.id)} disabled={actionId === listing.id}
                        className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1 disabled:opacity-50">
                        <CheckCircle size={12} /> Mark Sold
                      </button>
                    )}
                    {(listing.status === 'expired' || listing.status === 'rejected') && (
                      <button onClick={() => handleRenew(listing.id)} disabled={actionId === listing.id}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1 disabled:opacity-50">
                        <RefreshCw size={12} /> Renew
                      </button>
                    )}
                    <button onClick={() => handleDelete(listing.id)} disabled={actionId === listing.id}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 flex items-center gap-1 disabled:opacity-50">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </PageShell>
  );
}
