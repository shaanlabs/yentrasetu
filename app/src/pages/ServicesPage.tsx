import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HardHat, Wrench, Cog, TrendingUp, Shield, Banknote,
  ArrowRight, Users, Truck, BarChart3, FileCheck, Star,
  Sparkles
} from 'lucide-react';
import PageShell from '../components/PageShell';

const SERVICE_CATEGORIES = [
  {
    title: 'Hire Operators',
    description: 'Find certified, experienced operators for excavators, cranes, loaders, and more. Verified profiles with ratings and availability.',
    icon: HardHat,
    color: '#FF6A00',
    bg: 'bg-orange-50',
    link: '/operators',
    stats: '200+ Operators',
    tags: ['Excavator', 'Crane', 'Loader', 'Bulldozer'],
  },
  {
    title: 'Find Mechanics',
    description: 'Connect with skilled mechanics for on-site repairs, scheduled maintenance, and emergency breakdowns. Service history tracked.',
    icon: Wrench,
    color: '#3b82f6',
    bg: 'bg-blue-50',
    link: '/mechanics',
    stats: '150+ Mechanics',
    tags: ['Engine', 'Hydraulic', 'Electrical', 'Transmission'],
  },
  {
    title: 'Spare Parts',
    description: 'Source genuine and aftermarket parts for all major equipment brands. Verified suppliers, competitive pricing.',
    icon: Cog,
    color: '#22c55e',
    bg: 'bg-green-50',
    link: '/parts',
    stats: '5000+ Parts',
    tags: ['Filters', 'Hydraulic', 'Engine', 'Undercarriage'],
  },
  {
    title: 'Fleet Optimizer',
    description: 'AI-powered fleet matching for your project. Bundle machines from the same owner, get fleet discounts, and reduce logistics costs.',
    icon: Truck,
    color: '#8b5cf6',
    bg: 'bg-purple-50',
    link: '/fleet-optimizer',
    stats: 'AI-Powered',
    tags: ['Multi-machine', 'Same-owner', 'Discounts'],
  },
  {
    title: 'Equipment Financing',
    description: 'Check loan eligibility in minutes. Partnered with India\'s top equipment financiers for competitive rates and fast approval.',
    icon: Banknote,
    color: '#f59e0b',
    bg: 'bg-amber-50',
    link: '/loan-eligibility',
    stats: '24hr Approval',
    tags: ['EMI', 'Low Interest', 'Minimal Docs'],
  },
  {
    title: 'Market Intelligence',
    description: 'Real-time pricing trends, demand forecasting, and regional insights powered by AI. Make data-driven equipment decisions.',
    icon: BarChart3,
    color: '#ec4899',
    bg: 'bg-pink-50',
    link: '/market-insights',
    stats: 'Real-time Data',
    tags: ['Price Trends', 'Demand', 'Regional'],
  },
  {
    title: 'Inspections & Certifications',
    description: 'Get your equipment professionally inspected and certified. Increase buyer trust and listing visibility.',
    icon: FileCheck,
    color: '#0ea5e9',
    bg: 'bg-sky-50',
    link: '/certifications',
    stats: '40+ Hubs',
    tags: ['Physical Check', 'Report', 'Certification'],
  },
  {
    title: 'Contact a Specialist',
    description: 'Need help deciding? Talk to our equipment specialists who understand your project needs and can guide you to the right solution.',
    icon: Users,
    color: '#6366f1',
    bg: 'bg-indigo-50',
    link: '/contact-specialist',
    stats: '24/7 Support',
    tags: ['Expert Advice', 'Free Consultation'],
  },
];

export default function ServicesPage() {
  const { isAuthenticated } = useAuth();

  return (
    <PageShell breadcrumb="Services" backTo="/" backLabel="Home">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-3 py-1 bg-[#FF6A00]/10 rounded-full">
            <span className="text-xs font-bold text-[#FF6A00] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Full-Service Platform
            </span>
          </div>
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '2rem', color: '#101214', lineHeight: 1.2 }}>
          Everything You Need,<br />Under One Roof.
        </h1>
        <p className="text-[#6F757C] text-base mt-3 max-w-2xl">
          YantraSetu isn't just a marketplace — it's your complete equipment partner. From hiring operators to financing purchases, we've got every aspect of heavy equipment covered.
        </p>
      </div>

      {/* Quick Navigation Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <Link to="/browse" className="flex items-center gap-3 p-4 bg-[#101214] text-white rounded-xl hover:bg-[#2a2e32] transition-colors group">
          <div className="w-10 h-10 bg-[#FF6A00] rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>Browse Equipment</p>
            <p className="text-[10px] text-white/60">Buy or Rent</p>
          </div>
        </Link>
        <Link to={isAuthenticated ? '/sell' : '/login'} className="flex items-center gap-3 p-4 bg-white border-2 border-[#FF6A00] rounded-xl hover:bg-[#FF6A00]/5 transition-colors group">
          <div className="w-10 h-10 bg-[#FF6A00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Star size={18} className="text-[#FF6A00]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>List Equipment</p>
            <p className="text-[10px] text-[#6F757C]">Sell or Rent Out</p>
          </div>
        </Link>
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center gap-3 p-4 bg-white border border-[#EDE8E0] rounded-xl hover:border-[#FF6A00] transition-colors group">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>My Dashboard</p>
            <p className="text-[10px] text-[#6F757C]">Manage Everything</p>
          </div>
        </Link>
        <Link to="/subscriptions" className="flex items-center gap-3 p-4 bg-white border border-[#EDE8E0] rounded-xl hover:border-[#FF6A00] transition-colors group">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#101214]" style={{ fontFamily: 'Sora, sans-serif' }}>Plans & Pricing</p>
            <p className="text-[10px] text-[#6F757C]">Upgrade Benefits</p>
          </div>
        </Link>
      </div>

      {/* All Services Grid */}
      <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif', color: '#101214' }}>
        Our Services
        <span className="text-xs font-normal text-[#6F757C] bg-[#EDE8E0] px-2 py-0.5 rounded-full">{SERVICE_CATEGORIES.length}</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
        {SERVICE_CATEGORIES.map((service) => {
          const Icon = service.icon;
          return (
            <Link
              key={service.title}
              to={service.link}
              className="group bg-white rounded-2xl border border-[#EDE8E0] p-6 hover:shadow-xl hover:border-transparent hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${service.bg}`}>
                  <Icon size={24} style={{ color: service.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base group-hover:text-[#FF6A00] transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {service.title}
                    </h3>
                    <span className="text-[10px] font-bold text-[#6F757C] bg-[#EDE8E0] px-2 py-0.5 rounded-full whitespace-nowrap" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {service.stats}
                    </span>
                  </div>
                  <p className="text-sm text-[#6F757C] leading-relaxed mb-3">{service.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {service.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#F9F7F4] rounded text-[#6F757C] border border-[#EDE8E0]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-[#FF6A00] opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="bg-[#101214] rounded-2xl p-8 sm:p-10 text-center">
        <h3 className="text-white text-xl font-bold mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
          Not Sure Where to Start?
        </h3>
        <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
          Tell us about your project and our equipment specialists will recommend the right combination of services.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/contact-specialist" className="btn-primary px-6 py-3 text-sm inline-flex items-center justify-center gap-2">
            Talk to a Specialist <ArrowRight size={16} />
          </Link>
          <Link to="/browse" className="btn-secondary px-6 py-3 text-sm inline-flex items-center justify-center gap-2 border-white/20 text-white hover:bg-white/10">
            Browse Equipment
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
