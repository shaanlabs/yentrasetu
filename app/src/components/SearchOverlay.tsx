import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, SlidersHorizontal } from 'lucide-react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [make, setMake] = useState('');
  const [location, setLocation] = useState('');

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

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    if (make) params.set('make', make);
    if (location) params.set('state', location);
    onClose();
    navigate(`/browse?${params.toString()}`);
  };

  const quickSearch = (cat: string) => {
    onClose();
    navigate(`/browse?category=${cat}`);
  };

  if (!isOpen) return null;

  const CATEGORIES = ['construction', 'mining', 'agriculture', 'industrial'];
  const POPULAR = [
    { label: 'Excavators', cat: 'construction' },
    { label: 'Cranes', cat: 'construction' },
    { label: 'Tractors', cat: 'agriculture' },
    { label: 'Forklifts', cat: 'industrial' },
    { label: 'Loaders', cat: 'mining' },
    { label: 'Generators', cat: 'industrial' },
  ];

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#101214]/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative max-w-2xl mx-4 sm:mx-auto mt-[5vh] sm:mt-[10vh] bg-[#EDE8E0] rounded-xl shadow-2xl overflow-hidden animate-[slideDown_0.2s_ease-out]">
        {/* Search input */}
        <form onSubmit={handleSearch} className="flex items-center border-b border-[#101214]/10 px-6">
          <Search size={20} className="text-[#6F757C] flex-shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search machines — e.g. 'Tata excavator in Maharashtra'"
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
          <div className="px-6 py-4 border-b border-[#101214]/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-[#6F757C] mb-1 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#EDE8E0] rounded text-sm focus:outline-none focus:border-[#FF6A00]">
                <option value="">All</option>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#6F757C] mb-1 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Make</label>
              <input type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Komatsu"
                className="w-full px-3 py-2 bg-white border border-[#EDE8E0] rounded text-sm focus:outline-none focus:border-[#FF6A00]" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#6F757C] mb-1 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Maharashtra"
                className="w-full px-3 py-2 bg-white border border-[#EDE8E0] rounded text-sm focus:outline-none focus:border-[#FF6A00]" />
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-medium text-[#6F757C] mb-3 uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Popular Searches</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((item) => (
              <button key={item.label} onClick={() => quickSearch(item.cat)}
                className="px-3 py-1.5 bg-white text-[#101214] text-xs font-medium rounded-full border border-[#EDE8E0] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors"
                style={{ fontFamily: 'Sora, sans-serif' }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search button */}
        {query && (
          <div className="px-6 pb-5">
            <button onClick={() => handleSearch()} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3">
              Search for "{query}" <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
