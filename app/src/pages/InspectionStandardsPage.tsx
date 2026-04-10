import { Link } from 'react-router-dom';
import { Shield, Zap, ScanLine, Bot, FileCheck, Camera, CheckCircle2, Cpu } from 'lucide-react';
import PageShell from '../components/PageShell';

const STANDARDS = [
  {
    icon: Bot,
    title: 'AI-Powered Instant Assessment',
    desc: 'Upload photos and our AI instantly grades engine condition, hydraulic health, undercarriage wear, and structural integrity — no waiting for a manual assessor.',
  },
  {
    icon: ScanLine,
    title: 'Automated Document Verification',
    desc: 'RC copy, insurance, PUC, fitness certificate, and hypothecation status are verified automatically against government records in under 60 seconds.',
  },
  {
    icon: Camera,
    title: 'Photo-Based Scoring',
    desc: 'Our vision AI analyses uploaded photos to detect rust, leaks, cracks, and wear patterns — generating a 0–100 condition score within minutes.',
  },
  {
    icon: Cpu,
    title: 'Smart Pricing Engine',
    desc: 'Machine learning models analyse make, model, year, hours, condition score, and regional demand to suggest a fair market price automatically.',
  },
  {
    icon: Zap,
    title: 'Instant Listing Approval',
    desc: 'Listings that pass automated checks go live immediately. No manual queue, no multi-day waiting period.',
  },
  {
    icon: Shield,
    title: 'Automated Fraud Detection',
    desc: 'Every listing is screened for duplicate images, suspicious pricing, and known fraud patterns using our ML pipeline — blocking bad actors before they reach buyers.',
  },
];

export default function InspectionStandardsPage() {
  return (
    <PageShell breadcrumb="Inspection Standards" backTo="/" backLabel="Home">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Zap size={40} color="#FF6A00" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '2rem', marginBottom: '12px' }}>
            Automated Inspection Standards
          </h1>
          <p style={{ color: '#6F757C', fontSize: '15px', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
            No waiting days for manual assessors. Our AI-powered pipeline verifies, scores, and approves listings in minutes — not days.
          </p>
        </div>

        {/* Speed Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6A00, #FF8C40)', borderRadius: '12px', padding: '28px 32px',
          color: '#fff', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '20px', marginBottom: '32px', textAlign: 'center',
        }}>
          {[
            { value: '< 2 min', label: 'Photo Analysis' },
            { value: '60 sec', label: 'Doc Verification' },
            { value: 'Instant', label: 'Listing Approval' },
            { value: '0 days', label: 'Wait Time' },
          ].map((s, i) => (
            <div key={i}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 800 }}>{s.value}</p>
              <p style={{ fontSize: '12px', opacity: 0.85 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Standards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {STANDARDS.map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '12px', padding: '28px',
              boxShadow: '0 2px 12px rgba(16,18,20,0.04)', border: '1px solid rgba(16,18,20,0.06)',
              display: 'flex', gap: '16px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '10px', background: '#FFF3EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <s.icon size={22} color="#FF6A00" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>{s.title}</h3>
                <p style={{ color: '#6F757C', fontSize: '13px', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Automated Flow */}
        <div style={{ background: '#101214', borderRadius: '12px', padding: '36px', color: '#fff', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '24px' }}>
            Automated Listing Pipeline
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { step: '1', title: 'Seller uploads photos & documents', time: 'Instant', icon: '📷' },
              { step: '2', title: 'AI analyses images, scores condition', time: '~90 sec', icon: '🤖' },
              { step: '3', title: 'Documents auto-verified against govt records', time: '~60 sec', icon: '✅' },
              { step: '4', title: 'Fair market price suggested by ML model', time: '~10 sec', icon: '💰' },
              { step: '5', title: 'Listing goes live with verified badge', time: 'Instant', icon: '🚀' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#FF6A00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px' }}>{item.icon} {item.title}</p>
                </div>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#16a34a',
                  background: 'rgba(22,163,106,0.15)', padding: '4px 10px', borderRadius: '20px',
                }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What We Still Check Manually */}
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '28px', marginBottom: '32px',
          border: '1px solid rgba(16,18,20,0.06)', boxShadow: '0 2px 12px rgba(16,18,20,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <FileCheck size={20} color="#FF6A00" />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '15px' }}>Edge Cases — Human Review</h3>
          </div>
          <p style={{ color: '#6F757C', fontSize: '13px', lineHeight: 1.6, marginBottom: '12px' }}>
            In rare cases (flagged images, unusual documents, or high-value listings above ₹1 Cr), a certified assessor reviews the AI's assessment within 4 hours.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['Flagged fraud patterns', 'Listings > ₹1 Crore', 'Unclear photos', 'Disputed documents'].map((tag, i) => (
              <span key={i} style={{
                padding: '6px 14px', background: '#FFF3EB', color: '#FF6A00', borderRadius: '20px',
                fontSize: '12px', fontWeight: 600,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/sample-report" style={{
            display: 'inline-block', padding: '14px 32px', background: '#FF6A00', color: '#fff',
            borderRadius: '8px', fontWeight: 600, textDecoration: 'none', fontSize: '14px', marginRight: '12px',
          }}>
            See a Sample Report
          </Link>
          <Link to="/browse" style={{
            display: 'inline-block', padding: '14px 32px', background: '#101214', color: '#fff',
            borderRadius: '8px', fontWeight: 600, textDecoration: 'none', fontSize: '14px',
          }}>
            Browse Verified Machines
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
