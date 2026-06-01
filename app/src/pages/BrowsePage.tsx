import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { machineryApi, mlApi, type MachineryListing, type MachineryFilters, type CategoriesResponse } from '../services/api';
import {
  Search, SlidersHorizontal, MapPin, ArrowLeft, ArrowRight,
  Loader2, X, ChevronDown, Eye, Gauge, Heart, Navigation
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { useSEO } from '../hooks/useSEO';
import { toggleSaved } from './SavedListingsPage';

// Shadcn UI
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState<MachineryListing[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 });
  const [categories, setCategories] = useState<CategoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(getSavedIds());
  const [aiTrending, setAiTrending] = useState<string[]>([]);

  // ── SEO & JSON-LD Schema ──────────────────────────────
  const q = searchParams.get('q');
  const city = searchParams.get('city');
  const type = searchParams.get('type');
  
  const pageTitle = `${type === 'rent' ? 'Rent' : 'Buy'} ${q || 'Heavy Equipment'}${city ? ` in ${city}` : ''}`;
  const pageDesc = `Browse ${pagination.total || 'hundreds of'} ${q || 'heavy machinery'} listings${city ? ` in ${city}` : ''} on YantraSetu. Buy, sell, or rent with verified sellers.`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": pageDesc,
    "url": window.location.href,
    "numberOfItems": pagination.total
  };

  useSEO({
    title: pageTitle,
    description: pageDesc,
    schema: collectionSchema
  });

  // Listen for saved listings changes
  useEffect(() => {
    const handler = () => setSavedIds(getSavedIds());
    window.addEventListener('savedListingsChanged', handler);
    return () => window.removeEventListener('savedListingsChanged', handler);
  }, []);

  function getSavedIds(): string[] {
    try { return JSON.parse(localStorage.getItem('ys_saved_listings') || '[]'); } catch { return []; }
  }

  // Detect user location via browser geolocation
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams);
        params.set('lat', position.coords.latitude.toFixed(6));
        params.set('lng', position.coords.longitude.toFixed(6));
        params.set('sortBy', 'nearest');
        params.delete('page');
        setSearchParams(params);
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.code === 1 ? 'Location access denied' : 'Could not detect location');
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [searchParams, setSearchParams]);

  // Read filters from URL
  const getFilters = (): MachineryFilters => ({
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
    listingType: (searchParams.get('type') as 'sale' | 'rent') || undefined,
    category: searchParams.get('category') || undefined,
    make: searchParams.get('make') || undefined,
    query: searchParams.get('query') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    state: searchParams.get('state') || undefined,
    lat: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
    lng: searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC',
  });

  const setFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  // Fetch listings
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const filters = getFilters();
        const data = await machineryApi.getListings(filters);
        setListings(data.listings);
        setPagination(data.pagination);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Fetch categories once + AI trending
  useEffect(() => {
    machineryApi.getCategories().then(setCategories).catch(() => {});
    mlApi.getTrending({ limit: 3 }).then(res => {
      const cats = [...new Set((res.listings || []).map((l: any) => l.category).filter(Boolean))];
      setAiTrending(cats as string[]);
    }).catch(() => {});
  }, []);

  const activeType = searchParams.get('type');
  const activeCategory = searchParams.get('category');
  const activeQuery = searchParams.get('query');
  const hasLocation = searchParams.has('lat') && searchParams.has('lng');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  return (
    <PageShell 
      breadcrumb="Browse Machinery" 
      seoTitle={activeType === 'rent' ? "Rent Heavy Equipment" : "Buy Heavy Equipment"}
      seoDescription="Browse thousands of verified heavy equipment listings across India. Find excavators, cranes, loaders and more for sale or rent on YantraSetu."
      backTo="/" 
      backLabel="Home"
    >
      {/* Title + type toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl sm:text-[1.75rem] font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>
          {activeType === 'rent' ? 'Rental Equipment' : activeType === 'sale' ? 'Machines for Sale' : 'All Listings'}
        </h1>
      </div>

      {/* Active search query badge */}
      <AnimatePresence>
        {activeQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-white rounded-lg shadow-sm border border-[#EDE8E0]">
              <Search size={14} className="text-[#6F757C]" />
              <span className="text-sm text-[#101214]" style={{ fontFamily: 'DM Sans, sans-serif' }}>Results for &ldquo;<strong>{activeQuery}</strong>&rdquo;</span>
              <button onClick={() => setFilter('query', undefined)} className="ml-auto p-1 text-[#6F757C] hover:text-[#101214] transition-colors">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 font-medium"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            <SlidersHorizontal size={16} /> Filters
            {filtersOpen ? <X size={14} /> : <ChevronDown size={14} />}
          </Button>

          <Button
            variant={hasLocation ? "default" : "outline"}
            onClick={hasLocation ? () => { setFilter('lat', undefined); setFilter('lng', undefined); if (searchParams.get('sortBy') === 'nearest') setFilter('sortBy', 'createdAt'); } : detectLocation}
            disabled={geoLoading}
            className={`flex items-center gap-1.5 font-medium ${hasLocation ? 'bg-[#FF6A00] hover:bg-[#e55f00] text-white' : ''}`}
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
            {hasLocation ? 'Near Me ✓' : 'Near Me'}
          </Button>
          {geoError && <span className="text-xs text-red-500">{geoError}</span>}
          
          <div className="ml-auto min-w-[120px]">
            <Select
              value={searchParams.get('sortBy') || 'createdAt'}
              onValueChange={(val) => setFilter('sortBy', val)}
            >
              <SelectTrigger style={{ fontFamily: 'DM Sans, sans-serif' }}>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Newest</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                {hasLocation && <SelectItem value="nearest">Nearest</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category chips */}
        {categories && (
          <div className="chip-scroll flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            {Object.keys(categories.categories).map((cat) => (
              <Badge
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                onClick={() => setFilter('category', activeCategory === cat ? undefined : cat)}
                className={`px-3 py-1.5 text-xs cursor-pointer rounded-full transition-all capitalize whitespace-nowrap font-medium ${
                  activeCategory === cat
                    ? 'bg-[#FF6A00] hover:bg-[#e55f00] text-white border-transparent'
                    : 'bg-white hover:bg-[#F5EFEB] text-[#6F757C] border-[#EDE8E0]'
                }`}
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Expanded filters panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Make</label>
                <Input
                  placeholder="e.g. Tata, Komatsu"
                  value={searchParams.get('make') || ''}
                  onChange={(e) => setFilter('make', e.target.value || undefined)}
                  className="bg-[#EDE8E0]/40 border-[#EDE8E0] focus-visible:ring-[#FF6A00]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Min Price</label>
                <Input
                  type="number"
                  placeholder="₹ Min"
                  value={searchParams.get('minPrice') || ''}
                  onChange={(e) => setFilter('minPrice', e.target.value || undefined)}
                  className="bg-[#EDE8E0]/40 border-[#EDE8E0] focus-visible:ring-[#FF6A00]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Max Price</label>
                <Input
                  type="number"
                  placeholder="₹ Max"
                  value={searchParams.get('maxPrice') || ''}
                  onChange={(e) => setFilter('maxPrice', e.target.value || undefined)}
                  className="bg-[#EDE8E0]/40 border-[#EDE8E0] focus-visible:ring-[#FF6A00]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>State</label>
                <Input
                  placeholder="e.g. Maharashtra"
                  value={searchParams.get('state') || ''}
                  onChange={(e) => setFilter('state', e.target.value || undefined)}
                  className="bg-[#EDE8E0]/40 border-[#EDE8E0] focus-visible:ring-[#FF6A00]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending categories */}
      {aiTrending.length > 0 && !loading && listings.length > 0 && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-white rounded-xl border border-[#EDE8E0] shadow-sm">
          <Eye size={14} className="text-[#6F757C] shrink-0" />
          <p className="text-xs text-[#101214]">
            <span className="font-bold font-mono text-[#6F757C]">TRENDING:</span>{' '}
            {aiTrending.map((cat, i) => (
              <span key={cat}>
                <button onClick={() => setFilter('category', cat)} className="font-semibold text-[#FF6A00] hover:underline capitalize">{cat}</button>
                {i < aiTrending.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-[#EDE8E0] shadow-sm">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <CardContent className="p-4 sm:p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between items-end mt-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center py-24 sm:py-32"
        >
          <Search size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1.25rem', color: '#101214' }}>
            No listings found
          </h2>
          <p className="text-sm text-[#6F757C] mt-2 mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Try adjusting your filters or check back later.
          </p>
          <Button onClick={() => setSearchParams({})} className="bg-[#101214] hover:bg-[#202428] text-white">
            Clear Filters
          </Button>
        </motion.div>
      ) : (
        <>
          <p className="text-sm text-[#6F757C] mb-4 font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {pagination.total} listing{pagination.total !== 1 ? 's' : ''} found
          </p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {listings.map((listing) => {
              const slug = `${listing.make}-${listing.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              const seoUrl = `/${listing.listingType === 'rent' ? 'rent' : 'sale'}/${slug}-${listing.id}`;
              
              return (
              <motion.div key={listing.id} variants={itemVariants}>
                <Link to={seoUrl} className="block h-full group">
                  <Card className="h-full overflow-hidden shadow-sm border-[#EDE8E0] group-hover:shadow-md transition-shadow">
                    {/* Image Section (Shared) */}
                    <div className="relative aspect-[4/3] bg-[#EDE8E0] overflow-hidden">
                      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.4 }} className="w-full h-full">
                        {listing.images?.[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={`${listing.make} ${listing.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#6F757C] bg-[#F5EFEB]">
                            <Gauge size={40} className="opacity-30" />
                          </div>
                        )}
                      </motion.div>
                      
                      {/* Save button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSaved(listing.id);
                          setSavedIds(getSavedIds());
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-colors z-10 ${
                          savedIds.includes(listing.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#6F757C] hover:text-red-500'
                        }`}
                        title={savedIds.includes(listing.id) ? 'Saved' : 'Save'}
                      >
                        <Heart size={16} className={savedIds.includes(listing.id) ? 'fill-red-500' : ''} />
                      </button>
                      
                      {/* View count tag (bottom left image) */}
                      {listing.viewCount > 100 && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium rounded flex items-center gap-1">
                          <Eye size={12} /> {listing.viewCount} views
                        </div>
                      )}
                    </div>

                    {/* Content Section (Differentiated) */}
                    <CardContent className="p-4 sm:p-5 flex flex-col h-[calc(100%-12rem)] sm:h-[calc(100%-12rem)]">
                      {listing.listingType === 'sale' ? (
                        // ─── SALE CARD (Tractor Junction style) ───
                        <>
                          <div className="mb-1 flex gap-2">
                            <Badge variant="secondary" className="px-2 py-0 bg-[#FF6A00]/10 text-[#FF6A00] text-[10px] font-bold rounded" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                              FOR SALE
                            </Badge>
                            {listing.isVerified && (
                              <Badge variant="secondary" className="px-2 py-0 bg-green-100 text-green-700 text-[10px] font-bold rounded" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                                VERIFIED
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-[16px] mb-2 text-[#101214] group-hover:text-[#FF6A00] transition-colors line-clamp-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                            {listing.make} {listing.model}
                          </h3>
                          
                          {/* Specs Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-[#6F757C] uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Mfg Year</span>
                              <span className="text-xs font-semibold text-[#101214]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.year || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-[#6F757C] uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Hours Used</span>
                              <span className="text-xs font-semibold text-[#101214]" style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.hoursUsed?.toLocaleString() || 0}h</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-[#6F757C] uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Location</span>
                              <span className="text-xs font-semibold text-[#101214] truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.city || 'Pan India'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-[#6F757C] uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Condition</span>
                              <span className="text-xs font-semibold text-[#101214] capitalize" style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.condition || 'Used'}</span>
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-[#EDE8E0] flex items-center justify-between">
                            <div>
                              <span className="block text-[10px] text-[#6F757C] mb-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>Asking Price</span>
                              <p className="text-lg font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>
                                {formatPrice(listing.price)}
                              </p>
                            </div>
                            <Button size="sm" className="bg-[#101214] hover:bg-[#FF6A00] text-white text-xs font-medium px-4 h-8" style={{ fontFamily: 'Sora, sans-serif' }}>
                              Check Offer
                            </Button>
                          </div>
                        </>
                      ) : (
                        // ─── RENT CARD (IndiaMart style) ───
                        <>
                          <div className="mb-2">
                            <h3 className="font-bold text-[16px] mb-1 text-[#101214] group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                              {listing.make} {listing.model} Rental Service
                            </h3>
                            <p className="text-lg font-bold text-blue-600" style={{ fontFamily: 'Sora, sans-serif' }}>
                              {listing.rentalRateDaily ? `${formatPrice(listing.rentalRateDaily)}/Day`
                                : listing.rentalRateMonthly ? `${formatPrice(listing.rentalRateMonthly)}/Month`
                                : `${formatPrice(listing.price)}/Day`}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 mb-4 text-xs text-[#6F757C]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-[#6F757C]" />
                              <span className="font-medium text-[#101214]">{listing.city || 'Pan India'}</span>
                            </div>
                            {listing.owner?.companyName && (
                              <div className="flex items-center gap-2">
                                <Search size={14} className="text-transparent" />
                                <span className="font-medium truncate">{listing.owner.companyName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Search size={14} className="text-transparent" />
                              <span className="text-[11px]">Usage: Construction, Earthmoving</span>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-[#EDE8E0] grid grid-cols-2 gap-2">
                            <Button size="sm" variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 h-8 text-xs font-medium">
                              View Details
                            </Button>
                            <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs font-medium">
                              Contact Supplier
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.page <= 1}
                onClick={() => setFilter('page', String(pagination.page - 1))}
                className="w-10 h-10 border-[#EDE8E0]"
              >
                <ArrowLeft size={16} />
              </Button>
              <span className="text-sm font-medium text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setFilter('page', String(pagination.page + 1))}
                className="w-10 h-10 border-[#EDE8E0]"
              >
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
