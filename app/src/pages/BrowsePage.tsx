import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { machineryApi, type MachineryListing, type MachineryFilters, type CategoriesResponse } from '../services/api';
import {
  Search, SlidersHorizontal, MapPin, ArrowLeft, ArrowRight,
  Loader2, X, ChevronDown, Eye, Calendar, Gauge
} from 'lucide-react';
import PageShell from '../components/PageShell';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState<MachineryListing[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 });
  const [categories, setCategories] = useState<CategoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Read filters from URL
  const getFilters = (): MachineryFilters => ({
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
    listingType: (searchParams.get('type') as 'sale' | 'rent') || undefined,
    category: searchParams.get('category') || undefined,
    make: searchParams.get('make') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    state: searchParams.get('state') || undefined,
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
    const fetchListings = async () => {
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
    };
    fetchListings();
  }, [searchParams]);

  // Fetch categories once
  useEffect(() => {
    machineryApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const activeType = searchParams.get('type');
  const activeCategory = searchParams.get('category');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  return (
    <PageShell
      breadcrumb="Browse"
      backTo="/"
      backLabel="Home"
    >
      {/* Title + type toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h1
          className="text-2xl sm:text-[1.75rem]"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#101214' }}
        >
          {activeType === 'rent' ? 'Rental Equipment' : activeType === 'sale' ? 'Machines for Sale' : 'All Listings'}
        </h1>
        <div className="flex bg-white rounded-lg p-1 shadow-sm w-full sm:w-auto">
          {([['all', 'All'], ['sale', 'Buy'], ['rent', 'Rent']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter('type', val === 'all' ? undefined : val)}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-sm font-medium rounded-md transition-all ${
                (val === 'all' && !activeType) || activeType === val
                  ? 'bg-[#101214] text-white shadow-sm'
                  : 'text-[#6F757C] hover:text-[#101214]'
              }`}
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Top row: filter button + sort */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E9E3DA] rounded-lg shadow-sm text-sm font-medium hover:border-[#6F757C] transition-colors min-h-[44px]"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            <SlidersHorizontal size={16} /> Filters
            {filtersOpen ? <X size={14} /> : <ChevronDown size={14} />}
          </button>
          <select
            value={searchParams.get('sortBy') || 'createdAt'}
            onChange={(e) => setFilter('sortBy', e.target.value)}
            className="ml-auto px-3 py-2.5 bg-white border border-[#E9E3DA] rounded-lg shadow-sm text-sm text-[#6F757C] focus:outline-none focus:border-[#FF6A00] min-h-[44px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <option value="createdAt">Newest</option>
            <option value="price">Price</option>
            <option value="year">Year</option>
          </select>
        </div>

        {/* Category chips — horizontal scroll on mobile */}
        {categories && (
          <div className="chip-scroll">
            {Object.keys(categories.categories).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter('category', activeCategory === cat ? undefined : cat)}
                className={`px-3 py-2 text-xs font-medium rounded-full transition-all capitalize whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-white text-[#6F757C] hover:text-[#101214] border border-[#E9E3DA]'
                }`}
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expanded filters panel */}
      {filtersOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E9E3DA] p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Make</label>
            <input
              type="text"
              placeholder="e.g. Tata, Komatsu"
              value={searchParams.get('make') || ''}
              onChange={(e) => setFilter('make', e.target.value || undefined)}
              className="w-full px-3 py-3 bg-[#E9E3DA]/40 border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Min Price</label>
            <input
              type="number"
              placeholder="₹ Min"
              value={searchParams.get('minPrice') || ''}
              onChange={(e) => setFilter('minPrice', e.target.value || undefined)}
              className="w-full px-3 py-3 bg-[#E9E3DA]/40 border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Max Price</label>
            <input
              type="number"
              placeholder="₹ Max"
              value={searchParams.get('maxPrice') || ''}
              onChange={(e) => setFilter('maxPrice', e.target.value || undefined)}
              className="w-full px-3 py-3 bg-[#E9E3DA]/40 border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6F757C] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>State</label>
            <input
              type="text"
              placeholder="e.g. Maharashtra"
              value={searchParams.get('state') || ''}
              onChange={(e) => setFilter('state', e.target.value || undefined)}
              className="w-full px-3 py-3 bg-[#E9E3DA]/40 border border-[#E9E3DA] rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] min-h-[44px]"
            />
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#FF6A00]" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24 sm:py-32">
          <Search size={48} className="mx-auto text-[#6F757C] mb-4 opacity-40" />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1.25rem', color: '#101214' }}>
            No listings found
          </h2>
          <p className="text-sm text-[#6F757C] mt-2 mb-6">Try adjusting your filters or check back later.</p>
          <button onClick={() => setSearchParams({})} className="btn-primary text-sm px-6 py-3">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#6F757C] mb-4">
            {pagination.total} listing{pagination.total !== 1 ? 's' : ''} found
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map((listing) => (
              <Link
                to={`/listing/${listing.id}`}
                key={listing.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E9E3DA] hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                {/* Image */}
                <div className="relative h-52 sm:h-48 bg-[#E9E3DA]">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={`${listing.make} ${listing.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6F757C]">
                      <Gauge size={40} className="opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${
                        listing.listingType === 'rent' ? 'bg-blue-600 text-white' : 'bg-[#FF6A00] text-white'
                      }`}
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      {listing.listingType === 'rent' ? 'RENT' : 'SALE'}
                    </span>
                    {listing.isVerified && (
                      <span
                        className="px-2.5 py-1 bg-green-600 text-white text-xs font-semibold rounded"
                        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                      >
                        VERIFIED
                      </span>
                    )}
                  </div>
                  {listing.isFeatured && (
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 bg-[#101214] text-white text-xs font-semibold rounded"
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      FEATURED
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <h3
                    className="font-bold text-[15px] mb-1.5 group-hover:text-[#FF6A00] transition-colors"
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    {listing.make} {listing.model}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[#6F757C] mb-3 flex-wrap">
                    {listing.year && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {listing.year}
                      </span>
                    )}
                    {listing.hoursUsed != null && (
                      <span className="flex items-center gap-1">
                        <Gauge size={12} /> {listing.hoursUsed.toLocaleString()}h
                      </span>
                    )}
                    {listing.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {listing.city}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <p
                      className="text-lg font-bold text-[#FF6A00]"
                      style={{ fontFamily: 'Sora, sans-serif' }}
                    >
                      {listing.listingType === 'rent'
                        ? `${listing.rentalRateMonthly ? formatPrice(listing.rentalRateMonthly) + '/mo' : formatPrice(listing.price)}`
                        : formatPrice(listing.price)}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-[#6F757C]">
                      <Eye size={12} /> {listing.viewCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setFilter('page', String(pagination.page - 1))}
                className="p-3 bg-white border border-[#E9E3DA] rounded-lg shadow-sm disabled:opacity-40 hover:border-[#6F757C] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeft size={18} />
              </button>
              <span className="text-sm text-[#6F757C]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setFilter('page', String(pagination.page + 1))}
                className="p-3 bg-white border border-[#E9E3DA] rounded-lg shadow-sm disabled:opacity-40 hover:border-[#6F757C] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
