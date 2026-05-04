import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/PageShell';
import { fleetApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { chatsApi } from '../services/api';
import {
  MapPin, Star, Shield, Package,
  CheckCircle, XCircle, Loader2, Target,
  Sparkles, Phone, TrendingDown
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   AUTO-SEGMENT DETECTION
   System figures out user type from profile — no manual pick
   ══════════════════════════════════════════════════════════ */
function detectSegment(user: any): string {
  if (!user) return 'individual';
  const t = (user.userType || '').toLowerCase();
  if (t === 'admin' || t === 'super_admin') return 'enterprise';
  if (user.gstNumber && user.companyName) return 'contractor';
  if (user.companyName) return 'contractor';
  // Could add: check booking history for volume
  return 'individual';
}

const MACHINES = [
  { id: 'jcb', label: 'JCB', sub: 'Backhoe Loader', icon: '🚜' },
  { id: 'excavator', label: 'Excavator', sub: 'Mini / Standard', icon: '⛏️' },
  { id: 'dumper', label: 'Dumper', sub: 'Tipper Truck', icon: '🚛' },
  { id: 'roller', label: 'Roller', sub: 'Road Compactor', icon: '🛞' },
  { id: 'crane', label: 'Crane', sub: 'Mobile / Tower', icon: '🏗️' },
  { id: 'bulldozer', label: 'Bulldozer', sub: 'Dozer', icon: '🚧' },
  { id: 'loader', label: 'Loader', sub: 'Wheel / Skid', icon: '🔄' },
  { id: 'concrete_mixer', label: 'Mixer', sub: 'Concrete / Transit', icon: '🧱' },
  { id: 'generator', label: 'Generator', sub: 'DG Set', icon: '⚡' },
  { id: 'grader', label: 'Grader', sub: 'Motor Grader', icon: '🛤️' },
  { id: 'paver', label: 'Paver', sub: 'Asphalt', icon: '🛣️' },
  { id: 'hydra', label: 'Hydra', sub: 'Pick & Carry', icon: '🦾' },
];

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function FleetOptimizerPage() {
  const { user } = useAuth();
  const segment = detectSegment(user);
  const navigate = useNavigate();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<string[]>([]);
  const [city, setCity] = useState(user?.city || '');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const [addedOwners, setAddedOwners] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const search = async () => {
    if (!selected.length) return;
    setLoading(true); setResults(null);
    try {
      const today = new Date();
      const end = new Date(today.getTime() + days * 86400000);
      const data = await fleetApi.optimize({
        machineTypes: selected, days,
        city: city || undefined, segment: segment as any,
        startDate: today.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      });
      setResults(data);
      setExpandedIdx(0);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (e: any) { alert(e.message || 'Search failed'); }
    finally { setLoading(false); }
  };

  const contactOwner = async (opt: any) => {
    if (!user) {
      alert("Please login to contact the owner.");
      return;
    }
    setAddedOwners(p => new Set([...p, opt.ownerId]));
    try {
      await chatsApi.startOrGet(opt.ownerId, 'rent', opt.matchedMachines[0]?.id);
      navigate('/chats');
    } catch (e: any) {
      alert(e.message || "Failed to start chat.");
    }
  };

  const S = { // style tokens
    card: { background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' as const },
    label: { fontSize: 10, fontWeight: 700 as const, color: '#8A8F98', letterSpacing: 1, textTransform: 'uppercase' as const, fontFamily: 'IBM Plex Mono, monospace' },
    mono: { fontFamily: 'IBM Plex Mono, monospace' },
    sora: { fontFamily: 'Sora, sans-serif' },
    accent: '#FF6A00',
    bg: '#F5F3EF',
  };

  return (
    <PageShell breadcrumb="Fleet Optimizer">
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px 120px' }}>

        {/* ═══ HERO ═══ */}
        <div style={{
          background: 'linear-gradient(145deg, #0F1114 0%, #1B1F24 50%, #2A1A0E 100%)',
          borderRadius: 24, padding: '32px 28px', marginBottom: 28, color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.15) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,106,0,0.15)', padding: '5px 12px', borderRadius: 20, marginBottom: 16 }}>
              <Sparkles size={12} color={S.accent} />
              <span style={{ fontSize: 11, fontWeight: 600, color: S.accent }}>AI-Powered Fleet Matching</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, ...S.sora, margin: '0 0 8px', lineHeight: 1.2 }}>
              Build Your Fleet.<br />
              <span style={{ color: S.accent }}>One Owner. Zero Conflicts.</span>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6, maxWidth: 480 }}>
              Pick the machines you need — we find the best single owner who has everything, 
              so nobody fights on your site.
            </p>
          </div>
        </div>

        {/* ═══ MACHINE SELECTOR ═══ */}
        <div style={{ ...S.card, padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={S.label}>What do you need?</span>
            {selected.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: S.accent, ...S.mono }}>
                {selected.length} selected
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {MACHINES.map(m => {
              const on = selected.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggle(m.id)} style={{
                  padding: '12px 10px', borderRadius: 14,
                  border: `2px solid ${on ? S.accent : 'rgba(0,0,0,0.06)'}`,
                  background: on ? `${S.accent}08` : '#FAFAF8',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  position: 'relative',
                }}>
                  {on && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={11} color="#fff" />
                    </div>
                  )}
                  <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{m.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: on ? S.accent : '#1A1D21', display: 'block' }}>{m.label}</span>
                  <span style={{ fontSize: 10, color: '#8A8F98' }}>{m.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ LOCATION + DAYS + SEARCH ═══ */}
        <div style={{ ...S.card, padding: '18px 22px', marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <span style={{ ...S.label, display: 'block', marginBottom: 6 }}>Location</span>
              <div style={{ position: 'relative' }}>
                <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8A8F98' }} />
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="City or area"
                  style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.08)', fontSize: 14, outline: 'none', background: '#FAFAF8', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <span style={{ ...S.label, display: 'block', marginBottom: 6 }}>Days</span>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FAFAF8', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <button onClick={() => setDays(Math.max(1, days - 1))} style={{ width: 38, height: 42, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#8A8F98' }}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: 800, ...S.mono }}>{days}</span>
                <button onClick={() => setDays(days + 1)} style={{ width: 38, height: 42, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#8A8F98' }}>+</button>
              </div>
            </div>
          </div>

          <button onClick={search} disabled={!selected.length || loading} style={{
            width: '100%', marginTop: 16, padding: '14px', borderRadius: 14, border: 'none',
            background: selected.length ? `linear-gradient(135deg, ${S.accent}, #E05500)` : '#D1D5DB',
            color: '#fff', fontSize: 15, fontWeight: 700, ...S.sora,
            cursor: selected.length ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: selected.length ? '0 8px 24px rgba(255,106,0,0.25)' : 'none',
            transition: 'all 0.2s',
          }}>
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Searching Fleets...</>
              : <><Target size={18} /> Find Best Fleet</>}
          </button>
        </div>

        {/* ═══ RESULTS ═══ */}
        <div ref={resultsRef}>
          {results && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { v: results.fleetOptions?.length || 0, l: 'Fleet Options', c: S.accent },
                  { v: results.totalOwnersFound || 0, l: 'Owners', c: '#3b82f6' },
                  { v: results.totalMachinesFound || 0, l: 'Machines', c: '#8b5cf6' },
                ].map((s, i) => (
                  <div key={i} style={{ ...S.card, padding: '16px 14px', textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 800, color: s.c, margin: 0, ...S.mono }}>{s.v}</p>
                    <p style={{ fontSize: 10, color: '#8A8F98', margin: '2px 0 0', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace' }}>{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Fleet Cards */}
              {(results.fleetOptions || []).length === 0 ? (
                <div style={{ ...S.card, padding: '48px 24px', textAlign: 'center' }}>
                  <XCircle size={44} color="#EF4444" style={{ marginBottom: 14, opacity: 0.7 }} />
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', ...S.sora }}>No Complete Fleets Found</h3>
                  <p style={{ fontSize: 13, color: '#8A8F98', maxWidth: 340, margin: '0 auto' }}>
                    No single owner has all your machines in this area. Try fewer machine types or a different city.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {results.fleetOptions.map((opt: any, idx: number) => {
                    const open = expandedIdx === idx;
                    const added = addedOwners.has(opt.ownerId);
                    const isBest = idx === 0;
                    return (
                      <div key={opt.ownerId} style={{
                        ...S.card,
                        border: isBest ? `2px solid ${S.accent}` : '1px solid rgba(0,0,0,0.06)',
                        boxShadow: isBest ? '0 4px 24px rgba(255,106,0,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        {/* Ribbon */}
                        {opt.recommended && (
                          <div style={{
                            padding: '5px 16px',
                            background: opt.recommended === 'Best Match' ? `linear-gradient(90deg, ${S.accent}, #E05500)`
                              : opt.recommended === 'Budget Pick' ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                              : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                            color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
                          }}>
                            {opt.recommended}
                          </div>
                        )}

                        {/* Header row */}
                        <div onClick={() => setExpandedIdx(open ? -1 : idx)}
                          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center' }}>

                          {/* Score circle */}
                          <div style={{
                            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                            background: `conic-gradient(${S.accent} ${opt.score * 360}deg, #F0EDE8 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: S.accent, ...S.mono }}>{Math.round(opt.score * 100)}</span>
                            </div>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 3px', ...S.sora, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {opt.ownerCompany || opt.ownerName}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: '#8A8F98', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <MapPin size={10} /> {opt.ownerCity || '—'}
                              </span>
                              {opt.ownerRating > 0 && (
                                <span style={{ fontSize: 11, color: '#8A8F98', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Star size={10} fill="#FACC15" color="#FACC15" /> {opt.ownerRating.toFixed(1)}
                                </span>
                              )}
                              {opt.isVerified && (
                                <span style={{ fontSize: 10, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                                  <Shield size={10} /> Verified
                                </span>
                              )}
                            </div>
                            {/* Fleet match bar */}
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#F0EDE8', overflow: 'hidden' }}>
                                <div style={{ width: `${opt.completeness}%`, height: '100%', borderRadius: 3, background: opt.completeness === 100 ? '#22c55e' : '#FACC15', transition: 'width 0.5s' }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: opt.completeness === 100 ? '#22c55e' : '#D97706', ...S.mono }}>
                                {opt.completeness}%
                              </span>
                            </div>
                          </div>

                          {/* Price */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: 20, fontWeight: 800, color: '#1A1D21', margin: 0, ...S.mono }}>
                              {fmt(opt.pricing.totalCost)}
                            </p>
                            <p style={{ fontSize: 10, color: '#8A8F98', margin: '2px 0 0' }}>
                              {fmt(opt.pricing.perDayCost)}/day
                            </p>
                            {opt.pricing.bundleDiscount > 0 && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4,
                                fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#F0FDF4',
                                padding: '2px 8px', borderRadius: 6,
                              }}>
                                <TrendingDown size={10} /> Save {fmt(opt.pricing.bundleDiscount)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expanded */}
                        {open && (
                          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            {/* Machines */}
                            <div style={{ padding: '16px 20px' }}>
                              <span style={{ ...S.label, display: 'block', marginBottom: 10 }}>
                                Matched {opt.matchedMachines.length}/{selected.length} machines
                              </span>
                              {opt.matchedMachines.map((m: any) => (
                                <div key={m.id} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '10px 14px', background: '#FAFAF8', borderRadius: 12, marginBottom: 6,
                                }}>
                                  <div>
                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{m.make} {m.model}</span>
                                    <span style={{ fontSize: 10, color: '#8A8F98', display: 'block' }}>
                                      {m.matchedType} · {m.year} · {m.condition}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: 14, fontWeight: 800, ...S.mono }}>{fmt(m.dailyRate)}<span style={{ fontSize: 10, fontWeight: 400, color: '#8A8F98' }}>/d</span></span>
                                </div>
                              ))}
                              {opt.unmatchedTypes.length > 0 && (
                                <div style={{ padding: '8px 12px', background: '#FEF2F2', borderRadius: 10, marginTop: 4 }}>
                                  <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                                    Missing: {opt.unmatchedTypes.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Price breakdown */}
                            <div style={{ padding: '0 20px 16px' }}>
                              <div style={{ background: '#FAFAF8', borderRadius: 14, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8A8F98', marginBottom: 5 }}>
                                  <span>{opt.matchedMachines.length} machines × {days}d</span><span>{fmt(opt.pricing.subtotal)}</span>
                                </div>
                                {opt.pricing.bundleDiscount > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 5 }}>
                                    <span>Fleet discount</span><span>−{fmt(opt.pricing.bundleDiscount)}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8A8F98', marginBottom: 5 }}>
                                  <span>Platform (5%)</span><span>{fmt(opt.pricing.platformFee)}</span>
                                </div>
                                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 14, fontWeight: 800 }}>Total</span>
                                  <span style={{ fontSize: 16, fontWeight: 800, color: S.accent, ...S.mono }}>{fmt(opt.pricing.totalCost)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
                              <button onClick={() => contactOwner(opt)} disabled={added} style={{
                                flex: 1, padding: '13px', borderRadius: 14, border: 'none',
                                background: added ? '#22c55e' : S.accent, color: '#fff',
                                fontSize: 14, fontWeight: 700, ...S.sora, cursor: added ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: added ? 'none' : '0 4px 16px rgba(255,106,0,0.2)',
                              }}>
                                {added ? <><CheckCircle size={16}/> Contacted</> : <><Package size={16}/> Message Owner</>}
                              </button>
                              {opt.ownerPhone && (
                                <a href={`tel:${opt.ownerPhone}`} style={{
                                  padding: '13px 16px', borderRadius: 14,
                                  border: '1.5px solid rgba(0,0,0,0.08)', background: '#fff',
                                  display: 'flex', alignItems: 'center', gap: 6, color: '#1A1D21',
                                  fontSize: 13, fontWeight: 600, textDecoration: 'none',
                                }}>
                                  <Phone size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );
}
