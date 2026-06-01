import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Facebook, Instagram, ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer bg-[#101214] text-white pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group mb-6 inline-flex">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6A00] to-[#e55f00] flex items-center justify-center shadow-[0_0_15px_rgba(255,106,0,0.3)] group-hover:shadow-[0_0_20px_rgba(255,106,0,0.5)] transition-shadow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10h3v4H3z"/><path d="M6 10h12v4"/><path d="M18 10h3v4h-3z"/><path d="M8 14v4"/><path d="M16 14v4"/><path d="M12 4v6"/><path d="M8 4h8"/>
                </svg>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white transition-colors" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.03em' }}>
                Yantra<span className="text-[#FF6A00]">Setu</span>
              </span>
            </Link>
            <p className="text-[#6F757C] text-sm leading-relaxed max-w-sm mb-8">
              India's premier marketplace for heavy equipment. Buy, sell, and rent with confidence through our verified network of trusted sellers and certified inspection processes.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#6F757C] hover:bg-[#FF6A00] hover:text-white transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#6F757C] hover:bg-[#FF6A00] hover:text-white transition-all">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#6F757C] hover:bg-[#FF6A00] hover:text-white transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#6F757C] hover:bg-[#FF6A00] hover:text-white transition-all">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Platform</h3>
            <ul className="space-y-4">
              <li><Link to="/browse" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Browse Equipment</Link></li>
              <li><Link to="/browse?type=sale" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Buy Machinery</Link></li>
              <li><Link to="/browse?type=rent" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Rent Equipment</Link></li>
              <li><Link to="/sell" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Sell Equipment</Link></li>
              <li><Link to="/parts" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Spare Parts</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Services</h3>
            <ul className="space-y-4">
              <li><Link to="/operators" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Hire Operators</Link></li>
              <li><Link to="/mechanics" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Find Mechanics</Link></li>
              <li><Link to="/certifications" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Inspections</Link></li>
              <li><Link to="/loan-eligibility" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Financing</Link></li>
              <li><Link to="/fleet-optimizer" className="text-[#6F757C] hover:text-[#FF6A00] text-sm transition-colors">Fleet Optimizer</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Get in Touch</h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-[#6F757C] text-sm">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#FF6A00]" />
                <span>124 Business Tech Park, Sector 44<br />Bengaluru, Karnataka 560001</span>
              </li>
              <li className="flex items-center gap-3 text-[#6F757C] text-sm">
                <Phone size={18} className="shrink-0 text-[#FF6A00]" />
                <span>1800-123-4567 (Toll Free)</span>
              </li>
              <li className="flex items-center gap-3 text-[#6F757C] text-sm">
                <Mail size={18} className="shrink-0 text-[#FF6A00]" />
                <span>support@yantrasetu.com</span>
              </li>
            </ul>
            
            <div className="flex">
              <input 
                type="email" 
                placeholder="Subscribe to newsletter" 
                className="footer-input flex-1 bg-white/5 border border-white/10 rounded-l-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A00] transition-colors"
              />
              <button className="bg-[#FF6A00] hover:bg-[#e55f00] text-white px-4 py-2.5 rounded-r-md transition-colors">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* SEO Links — States */}
        <div className="mb-10 pt-8 border-t border-white/[0.06]">
          <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Equipment by State
          </h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {['Delhi NCR', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow', 'Chandigarh', 'Bhopal', 'Nagpur', 'Kochi', 'Guwahati', 'Jamshedpur', 'Bhubaneswar', 'Visakhapatnam'].map(city => (
              <Link key={city} to={`/browse?city=${encodeURIComponent(city)}`} className="text-[#6F757C] hover:text-[#FF6A00] text-xs transition-colors">
                {city}
              </Link>
            ))}
          </div>
        </div>

        {/* SEO Links — Categories */}
        <div className="mb-10">
          <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Browse by Category
          </h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {['Excavators', 'Cranes', 'Loaders', 'Bulldozers', 'Dumpers', 'Rollers', 'Forklifts', 'Backhoe Loaders', 'Tractors', 'Concrete Mixers', 'Tower Cranes', 'Compactors', 'Drilling Rigs', 'Motor Graders'].map(cat => (
              <Link key={cat} to={`/browse?category=${encodeURIComponent(cat)}`} className="text-[#6F757C] hover:text-[#FF6A00] text-xs transition-colors">
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[#6F757C] text-xs">
              © {new Date().getFullYear()} YantraSetu Technologies Pvt. Ltd. All rights reserved.
            </p>
            <p className="text-[#6F757C]/50 text-[10px] mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              CIN: U72900KA2024PTC123456 | GST: 29AABCU9603R1ZM
            </p>
          </div>
          <div className="flex gap-6">
            <Link to="/terms" className="text-[#6F757C] hover:text-white text-xs transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="text-[#6F757C] hover:text-white text-xs transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="text-[#6F757C] hover:text-white text-xs transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
