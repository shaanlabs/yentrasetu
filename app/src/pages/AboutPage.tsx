import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#E9E3DA' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E9E3DA', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214', textDecoration: 'none' }}>YantraSetu</Link>
            <span style={{ color: '#6F757C', fontSize: '14px' }}>/ About & Contact</span>
          </div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6F757C', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* About */}
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '2rem', marginBottom: '16px' }}>
          About YantraSetu
        </h1>
        <p style={{ color: '#6F757C', fontSize: '15px', lineHeight: 1.8, marginBottom: '24px' }}>
          YantraSetu is India's dedicated marketplace for heavy construction equipment. We connect contractors,
          dealers, and rental companies to buy, sell, and rent verified excavators, cranes, loaders, and trucks
          across the country.
        </p>
        <p style={{ color: '#6F757C', fontSize: '15px', lineHeight: 1.8, marginBottom: '40px' }}>
          Every listing on YantraSetu includes detailed photos, ownership documents, and inspection reports from
          certified assessors — so you can make decisions with confidence. From financing assistance to nationwide
          delivery coordination, we handle the complexities so you can focus on your project.
        </p>

        {/* Mission cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {[
            { title: 'Verified Listings', desc: 'Every machine inspected and documented by certified assessors.' },
            { title: 'Nationwide Reach', desc: 'Active across 18+ states with 40+ inspection hubs.' },
            { title: 'Fast Financing', desc: 'Pre-approval within 24 hours through our lending partners.' },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#fff', borderLeft: '4px solid #FF6A00', padding: '20px 24px',
              borderRadius: '0 8px 8px 0', boxShadow: '0 2px 12px rgba(16,18,20,0.04)',
            }}>
              <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{item.title}</h4>
              <p style={{ fontSize: '13px', color: '#6F757C', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '20px' }}>
          Contact Us
        </h2>
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '32px',
          boxShadow: '0 4px 24px rgba(16,18,20,0.06)', border: '1px solid rgba(16,18,20,0.06)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Mail size={20} color="#FF6A00" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Email</p>
                <p style={{ fontSize: '14px', color: '#6F757C' }}>support@yantrasetu.com</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Phone size={20} color="#FF6A00" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Phone</p>
                <p style={{ fontSize: '14px', color: '#6F757C' }}>+91 80-4567-8900</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <MapPin size={20} color="#FF6A00" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Office</p>
                <p style={{ fontSize: '14px', color: '#6F757C' }}>Bengaluru, Karnataka, India</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Clock size={20} color="#FF6A00" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Hours</p>
                <p style={{ fontSize: '14px', color: '#6F757C' }}>Mon–Sat, 9 AM – 6 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
