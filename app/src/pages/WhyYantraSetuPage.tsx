import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import {
  Phone, Clock, IndianRupee, MapPin, CheckCircle, XCircle,
  Zap, Shield, ArrowRight, ArrowDown, Play, Timer,
  TrendingUp, Star, FileText, AlertTriangle, Users, Globe,
  Smartphone, Wrench, Search
} from 'lucide-react';

/* ── Animated counter hook ── */
function useCounter(target: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

/* ── Interactive demo: Phone Call vs App ── */
function BookingRace() {
  const [started, setStarted] = useState(false);
  const [phoneStep, setPhoneStep] = useState(0);
  const [appStep, setAppStep] = useState(0);
  const [appDone, setAppDone] = useState(false);
  const [phoneDone, setPhoneDone] = useState(false);

  const phoneSteps = [
    { text: 'Asking neighbor for a number...', time: 2000 },
    { text: 'Calling — no answer...', time: 1500 },
    { text: 'Calling 2nd number...', time: 1500 },
    { text: '"Machine busy, try next week"', time: 1500 },
    { text: 'Calling 3rd person...', time: 1500 },
    { text: 'Negotiating rate... ₹2,000/hr', time: 2000 },
    { text: '"I\'ll come tomorrow morning"', time: 1500 },
    { text: 'Tomorrow: 3 hours late...', time: 2000 },
    { text: 'Finally working! 😓', time: 0 },
  ];

  const appSteps = [
    { text: 'Searching nearby JCBs...', time: 600 },
    { text: '8 found! Cheapest: ₹1,100/hr ✓', time: 800 },
    { text: 'Selected — 4.7★ rated operator', time: 600 },
    { text: '⚡ Booked! Confirmation sent', time: 500 },
  ];

  const start = () => {
    setStarted(true);
    setPhoneStep(0);
    setAppStep(0);
    setAppDone(false);
    setPhoneDone(false);

    // Run phone steps slowly
    let phoneDelay = 0;
    phoneSteps.forEach((s, i) => {
      phoneDelay += s.time;
      setTimeout(() => {
        setPhoneStep(i + 1);
        if (i === phoneSteps.length - 1) setPhoneDone(true);
      }, phoneDelay);
    });

    // Run app steps fast
    let appDelay = 300;
    appSteps.forEach((s, i) => {
      appDelay += s.time;
      setTimeout(() => {
        setAppStep(i + 1);
        if (i === appSteps.length - 1) setAppDone(true);
      }, appDelay);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[#E9E3DA] overflow-hidden">
      {/* Header */}
      <div className="bg-[#101214] text-white p-5 text-center">
        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
          ⚡ The Race: Phone Call vs YantraSetu
        </h3>
        <p className="text-xs text-white/60">See which one books a JCB first</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-[#E9E3DA]">
        {/* Phone Call side */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Phone size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-600" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>PHONE CALL</p>
              <p className="text-[10px] text-[#6F757C]">The old way</p>
            </div>
          </div>
          <div className="space-y-2 min-h-[220px]">
            {started && phoneSteps.slice(0, phoneStep).map((s, i) => (
              <div key={i} className="flex items-start gap-2 animate-fade-in">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[8px] ${
                  i === phoneStep - 1 && !phoneDone ? 'bg-yellow-100 text-yellow-600' :
                  s.text.includes('no answer') || s.text.includes('busy') || s.text.includes('late') ? 'bg-red-100 text-red-500' :
                  'bg-green-100 text-green-600'
                }`}>
                  {i + 1}
                </span>
                <p className="text-[11px] text-[#6F757C]">{s.text}</p>
              </div>
            ))}
            {phoneDone && (
              <div className="mt-3 pt-3 border-t border-red-100">
                <p className="text-xs font-bold text-red-600">⏱ ~2 days · ₹2,000/hr · No protection</p>
              </div>
            )}
          </div>
        </div>

        {/* App side */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Zap size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-green-600" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>YANTRASETU</p>
              <p className="text-[10px] text-[#6F757C]">The new way</p>
            </div>
          </div>
          <div className="space-y-2 min-h-[220px]">
            {started && appSteps.slice(0, appStep).map((s, i) => (
              <div key={i} className="flex items-start gap-2 animate-fade-in">
                <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={10} />
                </span>
                <p className="text-[11px] text-[#101214] font-medium">{s.text}</p>
              </div>
            ))}
            {appDone && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs font-bold text-green-700">⚡ 2 minutes · ₹1,100/hr · Full protection</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {['Escrow', 'GST Invoice', 'GPS Track', '4hr Backup'].map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="p-4 bg-[#F9F7F4] border-t border-[#E9E3DA] text-center">
        {!started ? (
          <button onClick={start} className="px-8 py-3 bg-[#FF6A00] text-white font-bold rounded-xl text-sm hover:bg-[#e55f00] transition-all flex items-center gap-2 mx-auto shadow-lg shadow-[#FF6A00]/20" style={{ fontFamily: 'Sora, sans-serif' }}>
            <Play size={16} /> Start the Race
          </button>
        ) : appDone && !phoneDone ? (
          <p className="text-sm font-bold text-green-600 animate-pulse">
            ✅ YantraSetu finished! Phone call still going... ⏳
          </p>
        ) : appDone && phoneDone ? (
          <button onClick={() => { setStarted(false); setPhoneStep(0); setAppStep(0); setAppDone(false); setPhoneDone(false); }} className="px-6 py-2.5 bg-[#101214] text-white font-medium rounded-lg text-sm hover:bg-[#2a2e33] transition-colors">
            Run Again
          </button>
        ) : (
          <p className="text-xs text-[#6F757C] animate-pulse">Race in progress...</p>
        )}
      </div>
    </div>
  );
}

/* ── Scrolling pain point ticker ── */
function PainTicker() {
  const pains = [
    '₹5,000 lost waiting for a JCB that never came',
    'Operator had no license — accident on site',
    'Charged ₹1,800/hr when market rate is ₹1,100/hr',
    'Machine broke down — owner says "not my problem"',
    'No receipt — can\'t claim ₹18,000 GST credit',
    'Broker took ₹3,000 cut just for sharing a phone number',
    'Rain delayed project 2 days — still charged full rate',
  ];
  return (
    <div className="overflow-hidden py-3 bg-red-50 border-y border-red-200">
      <div className="flex gap-8 animate-scroll-x whitespace-nowrap">
        {[...pains, ...pains].map((p, i) => (
          <span key={i} className="text-xs text-red-600 flex items-center gap-2">
            <XCircle size={12} className="flex-shrink-0" /> {p}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function WhyYantraSetuPage() {
  const stat1 = useCounter(85, 1500);
  const stat2 = useCounter(13, 1500);
  const stat3 = useCounter(10, 1500);
  const stat4 = useCounter(4, 2000);

  return (
    <PageShell breadcrumb="Why YantraSetu" backTo="/" backLabel="Home">
      {/* ═══ Hero ═══ */}
      <div className="text-center mb-8 pt-4">
        <p className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          The problem no one is solving
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4" style={{ fontFamily: 'Sora, sans-serif', color: '#101214' }}>
          Booking a JCB in India<br />
          shouldn't take <span className="text-red-500 line-through decoration-2">2 days</span>
        </h1>
        <p className="text-lg text-[#6F757C] max-w-md mx-auto mb-6">
          It should take <strong className="text-[#FF6A00]">2 minutes</strong>.
        </p>
        <ArrowDown size={20} className="mx-auto text-[#6F757C] animate-bounce" />
      </div>

      {/* ═══ Pain ticker ═══ */}
      <div className="mb-10 -mx-4 sm:-mx-8">
        <PainTicker />
      </div>

      {/* ═══ The Race ═══ */}
      <div className="mb-14">
        <p className="text-center text-sm text-[#6F757C] mb-4">Don't take our word for it. <strong>See it yourself.</strong></p>
        <BookingRace />
      </div>

      {/* ═══ The Numbers ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14">
        {[
          { ref: stat1.ref, value: stat1.count, suffix: '%', label: 'Market is unorganized', sub: 'No platform, no records' },
          { ref: stat2.ref, value: stat2.count, prefix: '$', suffix: 'B', label: 'Market size', sub: 'India equipment rental' },
          { ref: stat3.ref, value: stat3.count, suffix: 'M+', label: 'Small contractors', sub: 'Who can\'t afford to buy' },
          { ref: stat4.ref, value: stat4.count, suffix: ' min', label: 'To book on YantraSetu', sub: 'vs 2-4 days traditional' },
        ].map((s, i) => (
          <div key={i} ref={s.ref} className="text-center p-5 bg-white rounded-xl shadow-sm border border-[#E9E3DA]">
            <p className="text-3xl sm:text-4xl font-bold text-[#FF6A00]" style={{ fontFamily: 'Sora, sans-serif' }}>
              {s.prefix}{s.value}{s.suffix}
            </p>
            <p className="text-xs font-bold text-[#101214] mt-1">{s.label}</p>
            <p className="text-[10px] text-[#6F757C]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ═══ What You Get (visual feature cards) ═══ */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
          What a phone call <span className="text-red-500">can't</span> give you
        </h2>
        <p className="text-sm text-[#6F757C] text-center mb-8">Every single one of these — built into YantraSetu</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Search, title: 'See 50+ machines near you', color: 'bg-blue-50 text-blue-600', ring: 'border-blue-200' },
            { icon: IndianRupee, title: 'AI tells you the fair price', color: 'bg-green-50 text-green-600', ring: 'border-green-200' },
            { icon: Shield, title: 'Escrow-protected deposit', color: 'bg-purple-50 text-purple-600', ring: 'border-purple-200' },
            { icon: Star, title: 'Verified & rated operators', color: 'bg-yellow-50 text-yellow-600', ring: 'border-yellow-200' },
            { icon: MapPin, title: 'GPS tracking of delivery', color: 'bg-red-50 text-red-500', ring: 'border-red-200' },
            { icon: Timer, title: 'Usage timer — pay for actual hours', color: 'bg-orange-50 text-orange-600', ring: 'border-orange-200' },
            { icon: FileText, title: 'GST invoice — save 18%', color: 'bg-teal-50 text-teal-600', ring: 'border-teal-200' },
            { icon: Wrench, title: 'Machine + operator package', color: 'bg-pink-50 text-pink-600', ring: 'border-pink-200' },
            { icon: AlertTriangle, title: '4-hour replacement guarantee', color: 'bg-amber-50 text-amber-600', ring: 'border-amber-200' },
          ].map(f => (
            <div key={f.title} className={`p-4 rounded-xl border ${f.ring} ${f.color} flex items-start gap-3 hover:scale-[1.02] transition-transform cursor-default`}>
              <f.icon size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-snug">{f.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ The Honest Risks ═══ */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
          Can this fail? <span className="text-[#FF6A00]">Yes.</span>
        </h2>
        <p className="text-sm text-[#6F757C] text-center mb-8">Here's what could go wrong — and what we're doing about it</p>

        <div className="space-y-3">
          {[
            {
              risk: '"Why would I use an app when I can just call someone?"',
              answer: 'You can call someone — and wait 2 days. Or book in 2 minutes with price comparison, verified operators, and escrow protection. We don\'t replace the phone — we give you what the phone can\'t.',
              severity: 'bg-red-500',
            },
            {
              risk: '"There are no machines listed in my area"',
              answer: 'We\'re starting city by city — Pune, Jaipur, Lucknow first. Going deep, not wide. 200+ machines per city before launch. If your area isn\'t covered yet, you\'ll know before you sign up.',
              severity: 'bg-orange-500',
            },
            {
              risk: '"Equipment owners don\'t use smartphones"',
              answer: 'WhatsApp works. Missed calls work. We meet people where they are — not where we wish they were. Field agents onboard owners in person. No app download required to list.',
              severity: 'bg-orange-500',
            },
            {
              risk: '"I don\'t trust paying online for a ₹50 lakh machine"',
              answer: 'You don\'t have to. Pay cash if you want. But your deposit sits in escrow — protected. Your agreement is digital — enforceable. Your invoice is GST-compliant — deductible. Trust builds when you see it work once.',
              severity: 'bg-yellow-500',
            },
          ].map((r, i) => (
            <details key={i} className="group bg-white rounded-xl shadow-sm border border-[#E9E3DA] overflow-hidden">
              <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#F9F7F4] transition-colors list-none">
                <span className={`w-2 h-2 rounded-full ${r.severity} flex-shrink-0`} />
                <p className="text-sm font-bold flex-1" style={{ fontFamily: 'Sora, sans-serif' }}>{r.risk}</p>
                <ArrowDown size={14} className="text-[#6F757C] group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-4 pb-4 pt-1 border-t border-[#E9E3DA]">
                <p className="text-sm text-[#6F757C] leading-relaxed">{r.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* ═══ Why the World Needs This ═══ */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
          Bigger than India
        </h2>
        <p className="text-sm text-[#6F757C] text-center mb-8">Every country builds. Every site needs machines. Nobody has solved this.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Globe, stat: '$1.5T', desc: 'Global equipment rental market with less than 20% digitized' },
            { icon: Users, stat: '10M+', desc: 'Small contractors who can\'t afford to buy, but need to rent daily' },
            { icon: TrendingUp, stat: '₹111L Cr', desc: 'India\'s infrastructure pipeline needs equipment — and people to run it' },
          ].map(w => (
            <div key={w.stat} className="text-center p-6 bg-gradient-to-b from-[#101214] to-[#1a1e22] rounded-2xl text-white">
              <w.icon size={28} className="mx-auto text-[#FF6A00] mb-3" />
              <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>{w.stat}</p>
              <p className="text-xs text-white/60 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <div className="bg-gradient-to-r from-[#FF6A00] to-[#e55500] rounded-2xl p-8 text-center text-white mb-4">
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
          Try it yourself
        </h2>
        <p className="text-sm text-white/80 mb-6">
          Browse real equipment. See real prices. Book in 2 minutes.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/browse?type=rent" className="px-6 py-3 bg-white text-[#FF6A00] font-bold rounded-xl text-sm hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg">
            <Search size={16} /> Find a JCB Near Me
          </Link>
          <Link to="/sell" className="px-6 py-3 bg-white/15 text-white font-semibold rounded-xl text-sm hover:bg-white/25 transition-colors border border-white/30">
            List Your Equipment
          </Link>
        </div>
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        @keyframes scroll-x {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scroll-x 30s linear infinite;
        }
      `}</style>
    </PageShell>
  );
}
