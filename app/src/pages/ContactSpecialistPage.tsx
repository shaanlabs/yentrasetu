import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bot, Send, Phone, Mail, MessageSquare, Headphones, CheckCircle, Zap, Clock } from 'lucide-react';

const FAQ_ITEMS = [
  { q: 'How do I list my machine?', a: 'Go to "Post a Listing", upload photos & documents. Our AI will verify and publish it in under 3 minutes.' },
  { q: 'How long does verification take?', a: 'Automated verification takes under 2 minutes. Edge cases (high-value, flagged photos) are reviewed within 4 hours.' },
  { q: 'Can I rent equipment without an operator?', a: 'Yes! When browsing rentals, filter by "Without Operator". You can also hire operators separately from our Operators directory.' },
  { q: 'What financing options are available?', a: 'Use our Loan Eligibility checker for instant pre-approval. We partner with leading NBFCs for equipment loans at competitive rates.' },
  { q: 'How are spare parts verified?', a: 'Parts listings include compatibility data, photos, and seller ratings. OEM parts are tagged separately.' },
  { q: 'Is there a dealer/bulk listing program?', a: 'Yes! Dealers can register for bulk upload tools, featured placement, and analytics. Visit our Dealer Program page.' },
];

export default function ContactSpecialistPage() {
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([
    { role: 'bot', text: 'Hi! 👋 I\'m YantraSetu\'s AI assistant. I can help you find machines, check prices, explain our inspection process, or connect you with a human specialist. What do you need?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulated bot responses
    setTimeout(() => {
      let reply = '';
      const lower = userMsg.toLowerCase();
      if (lower.includes('price') || lower.includes('cost') || lower.includes('rate')) {
        reply = 'Our AI pricing engine analyses make, model, year, hours, and condition to suggest fair market prices. Browse listings to see real-time prices, or tell me the machine you\'re interested in!';
      } else if (lower.includes('rent') || lower.includes('hire')) {
        reply = 'We have 55+ rental listings with flexible terms — daily, weekly, or monthly. Operators available. Check our Rental Fleet page for availability in your area.';
      } else if (lower.includes('inspect') || lower.includes('verify')) {
        reply = 'Every listing is AI-verified in under 2 minutes — photo analysis, document checks, and automated scoring. See our Inspection Standards page for details.';
      } else if (lower.includes('finance') || lower.includes('loan') || lower.includes('emi')) {
        reply = 'Get instant pre-approval via our Loan Eligibility page! We partner with HDFC, ICICI, and leading NBFCs. Approval typically takes 24 hours.';
      } else if (lower.includes('human') || lower.includes('person') || lower.includes('call') || lower.includes('phone')) {
        reply = 'Sure! You can reach our team at +91 80-4567-8900 (Mon–Sat, 9 AM – 6 PM) or WhatsApp at +91 98765-43210 for instant response.';
      } else if (lower.includes('part') || lower.includes('spare')) {
        reply = 'We have 55+ spare parts listings with compatibility data. Browse by category on our Spare Parts page. Need a specific part? Tell me the machine model!';
      } else {
        reply = 'I can help with machine searches, pricing, rentals, financing, inspections, and spare parts. If you need a human specialist, call +91 80-4567-8900 or I can connect you. What would you like to know?';
      }
      setChatMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#EDE8E0' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EDE8E0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#101214', textDecoration: 'none' }}>YantraSetu</Link>
            <span style={{ color: '#6F757C', fontSize: '14px' }}>/ Help & Support</span>
          </div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6F757C', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Bot size={40} color="#FF6A00" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '2rem', marginBottom: '12px' }}>
            Instant AI Support
          </h1>
          <p style={{ color: '#6F757C', fontSize: '15px', lineHeight: 1.7, maxWidth: '550px', margin: '0 auto' }}>
            Get answers in seconds from our AI assistant. Need a human? We'll connect you instantly.
          </p>
        </div>

        {/* Speed Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '32px',
        }}>
          {[
            { icon: Zap, label: 'AI Response', value: '< 1 sec' },
            { icon: Clock, label: 'Human Callback', value: '< 5 min' },
            { icon: Headphones, label: 'Avg Resolution', value: '< 10 min' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '10px', padding: '20px', textAlign: 'center',
              boxShadow: '0 1px 6px rgba(16,18,20,0.03)', border: '1px solid rgba(16,18,20,0.06)',
            }}>
              <s.icon size={20} color="#FF6A00" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1.1rem', color: '#101214' }}>{s.value}</p>
              <p style={{ color: '#6F757C', fontSize: '11px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Chat Widget */}
        <div style={{
          background: '#fff', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px',
          boxShadow: '0 4px 24px rgba(16,18,20,0.08)', border: '1px solid rgba(16,18,20,0.06)',
        }}>
          <div style={{ background: '#101214', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={20} color="#FF6A00" />
            <span style={{ color: '#fff', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '14px' }}>YantraSetu AI Assistant</span>
            <span style={{ marginLeft: 'auto', background: '#16a34a', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ color: '#16a34a', fontSize: '11px' }}>Online</span>
          </div>

          <div style={{ height: '320px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                padding: '12px 16px', borderRadius: '12px',
                background: msg.role === 'user' ? '#FF6A00' : '#f5f3ef',
                color: msg.role === 'user' ? '#fff' : '#101214',
                fontSize: '14px', lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div style={{
                alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '12px',
                background: '#f5f3ef', color: '#6F757C', fontSize: '14px',
              }}>
                Typing...
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #eee', padding: '12px 16px', display: 'flex', gap: '8px' }}>
            <input
              type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about machines, pricing, rentals, financing..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd',
                fontSize: '14px', outline: 'none',
              }}
            />
            <button onClick={handleSend} style={{
              padding: '10px 16px', background: '#FF6A00', color: '#fff', border: 'none',
              borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Quick Contact - still available */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px',
        }}>
          {[
            { icon: Phone, label: 'Call', value: '+91 80-4567-8900', action: 'tel:+918045678900', desc: 'Mon–Sat, 9–6 PM' },
            { icon: Mail, label: 'Email', value: 'support@yantrasetu.com', action: 'mailto:support@yantrasetu.com', desc: 'Reply in < 1 hour' },
            { icon: MessageSquare, label: 'WhatsApp', value: '+91 98765-43210', action: 'https://wa.me/919876543210', desc: 'Instant response' },
          ].map((item, i) => (
            <a key={i} href={item.action} style={{
              background: '#fff', borderRadius: '10px', padding: '20px', textDecoration: 'none', color: '#101214',
              boxShadow: '0 1px 6px rgba(16,18,20,0.03)', border: '1px solid rgba(16,18,20,0.06)',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px', background: '#FFF3EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <item.icon size={20} color="#FF6A00" />
              </div>
              <div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '13px' }}>{item.label}</p>
                <p style={{ color: '#FF6A00', fontSize: '12px', fontWeight: 600 }}>{item.value}</p>

                <p style={{ color: '#999', fontSize: '11px' }}>{item.desc}</p>
              </div>
            </a>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '16px' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQ_ITEMS.map((faq, i) => (
            <details key={i} style={{
              background: '#fff', borderRadius: '10px', padding: '0',
              boxShadow: '0 1px 6px rgba(16,18,20,0.03)', border: '1px solid rgba(16,18,20,0.06)',
              overflow: 'hidden',
            }}>
              <summary style={{
                padding: '16px 20px', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px',
                listStyle: 'none',
              }}>
                <CheckCircle size={16} color="#FF6A00" style={{ flexShrink: 0 }} />
                {faq.q}
              </summary>
              <div style={{ padding: '0 20px 16px 46px', color: '#6F757C', fontSize: '13px', lineHeight: 1.6 }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
