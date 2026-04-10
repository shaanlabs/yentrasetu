import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, XCircle, FileText, Calendar, MapPin, Gauge } from 'lucide-react';
import PageShell from '../components/PageShell';

const SAMPLE_REPORT = {
  machine: 'Tata Hitachi EX200 LC',
  serial: 'THEX200-2021-MH-04582',
  inspectionDate: 'March 15, 2026',
  inspector: 'Rajiv Menon — Certified Assessor (IAQM Level 3)',
  location: 'Pune, Maharashtra',
  overallScore: 82,
  sections: [
    {
      name: 'Engine & Powertrain',
      score: 85,
      status: 'good',
      items: [
        { check: 'Engine oil pressure within range', status: 'pass' },
        { check: 'Coolant temperature normal', status: 'pass' },
        { check: 'Air filter condition', status: 'pass' },
        { check: 'Fuel system — no leaks', status: 'pass' },
        { check: 'Exhaust — no excessive smoke', status: 'pass' },
        { check: 'Turbocharger — minor wear', status: 'warn' },
      ],
    },
    {
      name: 'Hydraulics',
      score: 78,
      status: 'good',
      items: [
        { check: 'Boom cylinder — no leaks', status: 'pass' },
        { check: 'Arm cylinder — no leaks', status: 'pass' },
        { check: 'Bucket cylinder — minor seepage', status: 'warn' },
        { check: 'Hydraulic pump pressure OK', status: 'pass' },
        { check: 'Control valve response normal', status: 'pass' },
        { check: 'Hydraulic oil level and condition', status: 'pass' },
      ],
    },
    {
      name: 'Undercarriage',
      score: 72,
      status: 'fair',
      items: [
        { check: 'Track shoe wear — 35% remaining', status: 'warn' },
        { check: 'Track rollers — functional', status: 'pass' },
        { check: 'Sprocket teeth — moderate wear', status: 'warn' },
        { check: 'Idler condition', status: 'pass' },
        { check: 'Track tension', status: 'pass' },
      ],
    },
    {
      name: 'Cab & Safety',
      score: 90,
      status: 'good',
      items: [
        { check: 'Cabin glass — intact', status: 'pass' },
        { check: 'Seat & seatbelt — functional', status: 'pass' },
        { check: 'AC — cooling properly', status: 'pass' },
        { check: 'Instrument cluster — all gauges working', status: 'pass' },
        { check: 'Horn & lights — operational', status: 'pass' },
        { check: 'Fire extinguisher — present & charged', status: 'pass' },
      ],
    },
    {
      name: 'Documents & Compliance',
      score: 88,
      status: 'good',
      items: [
        { check: 'RC copy verified', status: 'pass' },
        { check: 'Insurance — valid till Dec 2026', status: 'pass' },
        { check: 'PUC certificate', status: 'pass' },
        { check: 'Fitness certificate', status: 'pass' },
        { check: 'Hypothecation — none', status: 'pass' },
      ],
    },
  ],
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'pass') return <CheckCircle size={16} className="text-green-600" />;
  if (status === 'warn') return <AlertTriangle size={16} className="text-amber-500" />;
  return <XCircle size={16} className="text-red-500" />;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 44, height: 44, borderRadius: '50%', fontWeight: 700, fontSize: 15,
      color: '#fff', background: color, fontFamily: 'JetBrains Mono, monospace',
    }}>
      {score}
    </span>
  );
}

export default function SampleReportPage() {
  return (
    <PageShell breadcrumb="Sample Report" backTo="/" backLabel="Home">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <FileText size={28} color="#FF6A00" />
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.8rem' }}>
            Sample Inspection Report
          </h1>
        </div>
        <p style={{ color: '#6F757C', fontSize: '14px', marginBottom: '32px' }}>
          This is what a typical YantraSetu inspection report looks like. Every verified listing on our platform includes a detailed assessment like this one.
        </p>

        {/* Machine Header Card */}
        <div style={{
          background: '#101214', borderRadius: '12px', padding: '32px', color: '#fff', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '8px' }}>
                {SAMPLE_REPORT.machine}
              </h2>
              <p style={{ color: '#999', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>
                S/N: {SAMPLE_REPORT.serial}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#aaa' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#FF6A00" /> {SAMPLE_REPORT.inspectionDate}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#FF6A00" /> {SAMPLE_REPORT.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Gauge size={14} color="#FF6A00" /> {SAMPLE_REPORT.inspector}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Overall</p>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 24, fontFamily: 'JetBrains Mono, monospace',
                background: 'linear-gradient(135deg, #FF6A00, #FF8C40)', color: '#fff',
              }}>
                {SAMPLE_REPORT.overallScore}
              </div>
              <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>/ 100</p>
            </div>
          </div>
        </div>

        {/* Inspection Sections */}
        {SAMPLE_REPORT.sections.map((section, si) => (
          <div key={si} style={{
            background: '#fff', borderRadius: '12px', padding: '24px 28px', marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(16,18,20,0.04)', border: '1px solid rgba(16,18,20,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem' }}>{section.name}</h3>
              <ScoreBadge score={section.score} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {section.items.map((item, ii) => (
                <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#fafaf8', borderRadius: '6px' }}>
                  <StatusIcon status={item.status} />
                  <span style={{ fontSize: '14px', color: item.status === 'pass' ? '#101214' : item.status === 'warn' ? '#92400e' : '#dc2626' }}>
                    {item.check}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6A00, #FF8C40)', borderRadius: '12px', padding: '32px', color: '#fff',
          textAlign: 'center', marginTop: '32px',
        }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '8px' }}>
            Every verified listing gets a report like this.
          </h3>
          <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '20px' }}>
            Browse machines with confidence — all inspections are done by certified assessors.
          </p>
          <Link to="/browse" style={{
            display: 'inline-block', padding: '12px 32px', background: '#101214', color: '#fff', borderRadius: '8px',
            fontWeight: 600, textDecoration: 'none', fontSize: '14px',
          }}>
            Browse Verified Machines
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
