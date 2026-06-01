import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, SlidersHorizontal, TrendingUp, MapPin, Wrench, Clock } from 'lucide-react';
import { machineryApi } from '../services/api';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Suggestions {
  makes: string[];
  models: { model: string; make: string }[];
  equipment: { name: string; category: string }[];
  cities: string[];
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [make, setMake] = useState('');
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ys_recent_searches') || '[]');
      setRecentSearches(saved.slice(0, 5));
    } catch { setRecentSearches([]); }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Debounced autocomplete
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions(null); return; }
    try {
      const res = await machineryApi.searchSuggestions(q);
      setSuggestions(res.suggestions);
    } catch { setSuggestions(null); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q.trim(), ...recentSearches.filter(s => s !== q.trim())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('ys_recent_searches', JSON.stringify(updated));
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query) { params.set('query', query); saveRecentSearch(query); }
    if (category) params.set('category', category);
    if (make) params.set('make', make);
    if (location) params.set('state', location);
    onClose();
    navigate(`/browse?${params.toString()}`);
  };

  const quickNavigate = (params: Record<string, string>, searchTerm?: string) => {
    if (searchTerm) saveRecentSearch(searchTerm);
    const qs = new URLSearchParams(params);
    onClose();
    navigate(`/browse?${qs.toString()}`);
  };

  if (!isOpen) return null;

  const CATEGORIES = ['construction', 'concrete', 'foundation', 'mining', 'agriculture', 'industrial'];
  const POPULAR: { label: string; params: Record<string, string> }[] = [
    { label: 'Excavators', params: { query: 'Excavators' } },
    { label: 'Tower Cranes', params: { query: 'Tower Cranes' } },
    { label: 'JCB', params: { make: 'JCB' } },
    { label: 'Tractors', params: { query: 'Tractors' } },
    { label: 'Forklifts', params: { query: 'Forklifts' } },
    { label: 'Transit Mixers', params: { query: 'Transit Mixers' } },
    { label: 'Generators', params: { query: 'Generators' } },
    { label: 'Piling Rigs', params: { query: 'Piling Rigs' } },
  ];

  const hasSuggestions = suggestions && (
    suggestions.makes.length > 0 ||
    suggestions.models.length > 0 ||
    suggestions.equipment.length > 0 ||
    suggestions.cities.length > 0
  );

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#101214]/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative max-w-2xl mx-4 sm:mx-auto mt-[5vh] sm:mt-[10vh] bg-[#F5EFEB] rounded-none shadow-2xl overflow-hidden animate-[slideDown_0.2s_ease-out]"
        style={{ border: '2px solid #101214' }}>
        {/* Search input */}
        <form onSubmit={handleSearch} className="flex items-center border-b-2 border-[#101214] px-6">
          <Search size={20} className="text-[#6F757C] flex-shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — e.g. 'JCB 3DX', 'Excavator in Pune', 'Tower Crane'"
            className="flex-1 px-4 py-5 bg-transparent text-[#101214] placeholder-[#6F757C] text-base focus:outline-none"
            style={{ fontFamily: 'Inter, sans-serif' }} />
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded transition-colors ${showFilters ? 'text-[#FF6A00]' : 'text-[#6F757C] hover:text-[#101214]'}`}>
            <SlidersHorizontal size={18} />
          </button>
          <button type="button" onClick={onClose} className="p-2 text-[#6F757C] hover:text-[#101214] transition-colors ml-1">
            <X size={18} />
          </button>
        </form>

        {/* Filters (expandable) */}
        {showFilters && (
          <div className="px-6 py-4 border-b-2 border-[#101214] grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#EDE8E0]">
            <div>
              <label className="block text-[10px] font-medium text-[#6F757C] mb-1 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#101214] text-sm focus:outline-none focus:border-[#FF6A00]" style={{ borderRadius: 0 }}>
                <option value="">All</option>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#6F757C] mb-1 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Make</label>
              <input type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Komatsu, JCB"
                className="w-full px-3 py-2 bg-white border-2 border-[#101214] text-sm focus:outline-none focus:border-[#FF6A00]" style={{ borderRadius: 0 }} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#6F757C] mb-1 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Maharashtra"
                className="w-full px-3 py-2 bg-white border-2 border-[#101214] text-sm focus:outline-none focus:border-[#FF6A00]" style={{ borderRadius: 0 }} />
            </div>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Live Autocomplete Results */}
          {hasSuggestions && (
            <div className="px-6 py-4 border-b border-[#101214]/10">
              {/* Equipment types */}
              {suggestions.equipment.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-medium text-[#6F757C] mb-2 uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    <Wrench size={10} /> Equipment Type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.equipment.map((eq) => (
                      <button key={eq.name} onClick={() => quickNavigate({ query: eq.name }, eq.name)}
                        className="px-3 py-1.5 bg-[#FF6A00] text-white text-xs font-bold hover:bg-[#e55f00] transition-colors"
                        style={{ fontFamily: 'Sora, sans-serif', borderRadius: 0 }}>
                        {eq.name}
                        <span className="ml-1 opacity-60 capitalize">· {eq.category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Makes */}
              {suggestions.makes.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-medium text-[#6F757C] mb-2 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Manufacturers
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.makes.map((m) => (
                      <button key={m} onClick={() => quickNavigate({ make: m }, m)}
                        className="px-3 py-1.5 bg-white text-[#101214] text-xs font-medium border-2 border-[#101214] hover:bg-[#101214] hover:text-white transition-colors"
                        style={{ fontFamily: 'Sora, sans-serif', borderRadius: 0 }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Models */}
              {suggestions.models.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-medium text-[#6F757C] mb-2 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Models
                  </p>
                  {suggestions.models.map((m) => (
                    <button key={`${m.make}-${m.model}`} onClick={() => quickNavigate({ query: `${m.make} ${m.model}` }, `${m.make} ${m.model}`)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-[#EDE8E0] transition-colors">
                      <span className="font-bold">{m.make}</span> <span className="text-[#6F757C]">{m.model}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Cities */}
              {suggestions.cities.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-[#6F757C] mb-2 uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    <MapPin size={10} /> Locations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.cities.map((c) => (
                      <button key={c} onClick={() => quickNavigate({ query: query, state: c })}
                        className="px-3 py-1.5 bg-white text-[#101214] text-xs font-medium border border-[#EDE8E0] hover:border-[#FF6A00] transition-colors"
                        style={{ borderRadius: 0 }}>
                        <MapPin size={10} className="inline mr-1" />{c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && !hasSuggestions && !query && (
            <div className="px-6 py-4 border-b border-[#101214]/10">
              <p className="text-[10px] font-medium text-[#6F757C] mb-3 uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <Clock size={10} /> Recent Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button key={s} onClick={() => { setQuery(s); handleSearch(); }}
                    className="px-3 py-1.5 bg-white text-[#101214] text-xs font-medium border border-[#EDE8E0] hover:border-[#FF6A00] transition-colors"
                    style={{ borderRadius: 0, fontFamily: 'Sora, sans-serif' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular searches */}
          <div className="px-6 py-5">
            <p className="text-[10px] font-medium text-[#6F757C] mb-3 uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <TrendingUp size={10} /> Popular Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((item) => (
                <button key={item.label} onClick={() => quickNavigate(item.params, item.label)}
                  className="px-3 py-1.5 bg-white text-[#101214] text-xs font-medium border-2 border-[#EDE8E0] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors"
                  style={{ fontFamily: 'Sora, sans-serif', borderRadius: 0 }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search button */}
        {query && (
          <div className="px-6 pb-5">
            <button onClick={() => handleSearch()} className="w-full flex items-center justify-center gap-2 text-sm py-3 bg-[#FF6A00] text-white font-bold hover:bg-[#e55f00] transition-colors"
              style={{ fontFamily: 'Sora, sans-serif', borderRadius: 0 }}>
              Search for "{query}" <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
