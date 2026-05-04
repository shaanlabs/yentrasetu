import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { machineryApi, type MachineryListing } from '../services/api';
import { Heart, Trash2, Loader2, MapPin, Calendar, Gauge, Eye, ShoppingBag } from 'lucide-react';
import PageShell from '../components/PageShell';

const STORAGE_KEY = 'ys_saved_listings';

export function getSavedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function isSaved(id: string): boolean {
  return getSavedIds().includes(id);
}

export function toggleSaved(id: string): boolean {
  const ids = getSavedIds();
  const idx = ids.indexOf(id);
  if (idx >= 0) { ids.splice(idx, 1); } else { ids.push(id); }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent('savedListingsChanged'));
  return idx < 0; // true if now saved
}

export default function SavedListingsPage() {
  const [listings, setListings] = useState<MachineryListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getSavedIds();
    if (ids.length === 0) { setLoading(false); return; }

    // Fetch each saved listing
    Promise.allSettled(ids.map(id => machineryApi.getListing(id)))
      .then(results => {
        const fetched: MachineryListing[] = [];
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value?.listing) fetched.push(r.value.listing);
        });
        setListings(fetched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = (id: string) => {
    toggleSaved(id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  return (
    <PageShell breadcrumb="Saved" backTo="/browse" backLabel="Browse" title="Saved Listings">
      {loading ? (
        <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-[#FF6A00]" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-32">
          <Heart size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>No saved listings</h2>
          <p className="text-sm text-[#6F757C] mt-2 mb-6">Tap the heart icon on any listing to save it here.</p>
          <Link to="/browse" className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2">
            <ShoppingBag size={16} /> Browse Machines
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#6F757C] mb-4">{listings.length} saved listing{listings.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#EDE8E0] hover:shadow-lg transition-all group relative">
                {/* Remove button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(listing.id); }}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                  title="Remove from saved"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>

                <Link to={`/listing/${listing.id}`}>
                  {/* Image */}
                  <div className="relative h-52 sm:h-48 bg-[#EDE8E0]">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={`${listing.make} ${listing.model}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6F757C]">
                        <Gauge size={40} className="opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded ${listing.listingType === 'rent' ? 'bg-blue-600 text-white' : 'bg-[#FF6A00] text-white'}`}
                        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                      >
                        {listing.listingType === 'rent' ? 'RENT' : 'SALE'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-bold text-[15px] mb-1.5 group-hover:text-[#FF6A00] transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {listing.make} {listing.model}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#6F757C] mb-3 flex-wrap">
                      {listing.year && <span className="flex items-center gap-1"><Calendar size={12} /> {listing.year}</span>}
                      {listing.hoursUsed != null && <span className="flex items-center gap-1"><Gauge size={12} /> {listing.hoursUsed.toLocaleString()}h</span>}
                      {listing.city && <span className="flex items-center gap-1"><MapPin size={12} /> {listing.city}</span>}
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-lg font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {listing.listingType === 'rent'
                          ? `${listing.rentalRateMonthly ? formatPrice(listing.rentalRateMonthly) + '/mo' : formatPrice(listing.price)}`
                          : formatPrice(listing.price)}
                      </p>
                      <span className="flex items-center gap-1 text-xs text-[#6F757C]"><Eye size={12} /> {listing.viewCount}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
