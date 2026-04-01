import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: 'Terms of Service',
    id: 'terms',
    content: [
      {
        heading: '1. Acceptance of Terms',
        text: 'By accessing or using YantraSetu, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.',
      },
      {
        heading: '2. Platform Use',
        text: 'YantraSetu provides an online marketplace for buying, selling, and renting heavy construction equipment. All listings are subject to verification and must comply with applicable Indian laws and regulations.',
      },
      {
        heading: '3. User Accounts',
        text: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration. Accounts found violating our policies may be suspended or terminated.',
      },
      {
        heading: '4. Listings & Transactions',
        text: 'Sellers are responsible for the accuracy of their listings. YantraSetu facilitates connections between buyers and sellers but is not a party to transactions. All negotiations, payments, and deliveries are between the transacting parties.',
      },
      {
        heading: '5. Inspection Reports',
        text: 'Inspection reports are provided for informational purposes and represent the condition at the time of assessment. YantraSetu does not guarantee the condition of equipment post-inspection.',
      },
      {
        heading: '6. Limitation of Liability',
        text: 'YantraSetu is not liable for any direct, indirect, or consequential damages arising from the use of our platform or transactions facilitated through it.',
      },
    ],
  },
  {
    title: 'Privacy Policy',
    id: 'privacy',
    content: [
      {
        heading: '1. Information We Collect',
        text: 'We collect personal information you provide (name, email, phone, business details) and usage data (browsing activity, device info) to improve our services.',
      },
      {
        heading: '2. How We Use Your Information',
        text: 'Your information is used to provide and improve our services, process transactions, communicate with you, and ensure platform security. We do not sell your personal information to third parties.',
      },
      {
        heading: '3. Data Security',
        text: 'We implement industry-standard security measures to protect your information. However, no method of electronic transmission or storage is 100% secure.',
      },
      {
        heading: '4. Cookies',
        text: 'We use cookies and similar technologies to enhance your experience, analyse traffic, and for security purposes. You can manage cookie preferences through your browser settings.',
      },
      {
        heading: '5. Third-Party Services',
        text: 'We may share limited information with trusted partners for payment processing, logistics, and financing. These partners are bound by confidentiality agreements.',
      },
      {
        heading: '6. Your Rights',
        text: 'You may request access to, correction of, or deletion of your personal data by contacting support@yantrasetu.com. We will respond within 30 days.',
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#E9E3DA' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E9E3DA', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214', textDecoration: 'none' }}>YantraSetu</Link>
            <span style={{ color: '#6F757C', fontSize: '14px' }}>/ Legal</span>
          </div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6F757C', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Quick nav */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                padding: '10px 20px', borderRadius: '6px', fontSize: '14px',
                fontFamily: 'Sora, sans-serif', fontWeight: 600,
                background: '#fff', border: '1.5px solid #ddd', color: '#101214',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
            >
              {s.title}
            </a>
          ))}
        </div>

        {sections.map(section => (
          <div key={section.id} id={section.id} style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.6rem', marginBottom: '24px' }}>
              {section.title}
            </h2>
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '32px',
              boxShadow: '0 4px 24px rgba(16,18,20,0.06)', border: '1px solid rgba(16,18,20,0.06)',
            }}>
              {section.content.map((item, i) => (
                <div key={i} style={{ marginBottom: i < section.content.length - 1 ? '24px' : 0, paddingBottom: i < section.content.length - 1 ? '24px' : 0, borderBottom: i < section.content.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '15px', marginBottom: '8px', color: '#101214' }}>
                    {item.heading}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6F757C', lineHeight: 1.7 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p style={{ fontSize: '13px', color: '#6F757C', textAlign: 'center' }}>
          Last updated: March 2026. For questions, contact <a href="mailto:support@yantrasetu.com" style={{ color: '#FF6A00' }}>support@yantrasetu.com</a>
        </p>
      </div>
    </div>
  );
}
