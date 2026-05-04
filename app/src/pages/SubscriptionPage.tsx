import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';
import {
  Check, X, Loader2, ShieldCheck, TrendingUp, Globe, Crown, Sparkles,
  Zap, Star, ArrowRight, CreditCard, Smartphone, Building2, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import PageShell from '../components/PageShell';

interface PlanFeature {
  name: string;
  detail: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  maxListings: number;
  featuredListings: number;
  photosPerListing?: number;
  description?: string;
  features: PlanFeature[] | string[];
  gstAmount?: number;
  totalAmount?: number;
}

// Comparison table rows
const COMPARISON_ROWS = [
  { label: 'Active Listings', key: 'maxListings', format: (v: number) => v === -1 ? 'Unlimited' : `${v}` },
  { label: 'Photos per Listing', key: 'photosPerListing', format: (v: number) => `${v}` },
  { label: 'Featured Listings', key: 'featuredListings', format: (v: number) => v === 0 ? '—' : `${v}` },
  { label: 'Verified Badge', check: (p: Plan) => ['growth', 'enterprise', 'starter'].includes(p.id) && p.id !== 'free' },
  { label: 'Priority Support', check: (p: Plan) => p.id !== 'free' },
  { label: 'Enhanced Search', check: (p: Plan) => p.id !== 'free' },
  { label: 'Priority Search', check: (p: Plan) => p.id === 'growth' || p.id === 'enterprise' },
  { label: 'Dedicated Account Manager', check: (p: Plan) => p.id === 'growth' || p.id === 'enterprise' },
  { label: 'AI Price Intelligence', check: (p: Plan) => p.id === 'growth' || p.id === 'enterprise' },
  { label: 'Demand Forecasting', check: (p: Plan) => p.id === 'growth' || p.id === 'enterprise' },
  { label: 'Analytics', values: { free: '—', starter: 'Basic', growth: 'Advanced', enterprise: 'Custom Dashboard' } },
  { label: 'Bulk Upload', check: (p: Plan) => p.id === 'enterprise' },
  { label: 'API Access', check: (p: Plan) => p.id === 'enterprise' },
  { label: 'Multi-user Access', check: (p: Plan) => p.id === 'enterprise' },
  { label: 'White-glove Onboarding', check: (p: Plan) => p.id === 'enterprise' },
  { label: 'Invoice & GST Integration', check: (p: Plan) => p.id === 'enterprise' },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useSEO({
    title: 'Subscription Plans',
    description: 'Choose the right plan to grow your machinery business on YantraSetu.',
  });

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansData = await subscriptionsApi.getPlans();
      setPlans(plansData.plans || []);

      // Only fetch subscription if authenticated
      if (isAuthenticated) {
        try {
          const subData = await subscriptionsApi.getMine();
          setMySub(subData.subscription || null);
        } catch {
          setMySub(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
      // Fallback plan data when API is unreachable
      if (plans.length === 0) {
        setPlans([
          {
            id: 'free', name: 'Free', price: 0, maxListings: 3,
            featuredListings: 0, photosPerListing: 5,
            description: 'Get started with basic listing capabilities.',
            features: ['Up to 3 active listings', '5 photos per listing', 'Basic search visibility', 'Community support', 'Standard analytics'],
          },
          {
            id: 'starter', name: 'Starter', price: 999, maxListings: 15,
            featuredListings: 2, photosPerListing: 15,
            description: 'For individual sellers and small operators.',
            features: ['Up to 15 active listings', '15 photos per listing', '2 featured listings', 'Verified badge', 'Enhanced search ranking', 'Priority support', 'Basic analytics dashboard'],
          },
          {
            id: 'growth', name: 'Growth', price: 2999, maxListings: 50,
            featuredListings: 10, photosPerListing: 30,
            description: 'For growing dealers and fleet operators.',
            features: ['Up to 50 active listings', '30 photos per listing', '10 featured listings', 'AI price intelligence', 'Demand forecasting', 'Priority search placement', 'Dedicated account manager', 'Advanced analytics'],
          },
          {
            id: 'enterprise', name: 'Enterprise', price: 9999, maxListings: -1,
            featuredListings: 50, photosPerListing: 50,
            description: 'For large dealers and enterprise fleets.',
            features: ['Unlimited listings', '50 photos per listing', '50 featured listings', 'All AI features', 'API access', 'Multi-user access', 'Custom analytics dashboard', 'White-glove onboarding', 'Invoice & GST integration', 'Bulk upload tools'],
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (planId === 'free') return;

    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedPlan) return;
    setPaymentLoading(true);
    try {
      await subscriptionsApi.subscribe(selectedPlan);
      setShowPayment(false);
      setSelectedPlan(null);
      await fetchData();
      alert('🎉 Successfully subscribed! Your account has been upgraded.');
    } catch (err: any) {
      alert(err.message || 'Subscription failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel? You will revert to the Free tier.')) return;
    setLoading(true);
    try {
      await subscriptionsApi.cancel();
      await fetchData();
      alert('Subscription cancelled.');
    } catch {
      alert('Cancellation failed.');
    } finally {
      setLoading(false);
    }
  };

  const planIcons: Record<string, any> = {
    free: Zap,
    starter: Star,
    growth: TrendingUp,
    enterprise: Crown,
  };

  const planColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    free: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', gradient: 'from-gray-400 to-gray-500' },
    starter: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600' },
    growth: { bg: 'bg-[#FF6A00]/5', text: 'text-[#FF6A00]', border: 'border-[#FF6A00]', gradient: 'from-[#FF6A00] to-[#FF8C38]' },
    enterprise: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-300', gradient: 'from-purple-500 to-purple-700' },
  };

  // Helper to get feature name (handles both string and object features)
  const getFeatureName = (feature: string | PlanFeature): string => {
    if (typeof feature === 'string') return feature;
    return feature.name;
  };

  const getFeatureDetail = (feature: string | PlanFeature): string | null => {
    if (typeof feature === 'string') return null;
    return feature.detail;
  };

  if (loading && !plans.length) {
    return (
      <PageShell breadcrumb="Plans">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-[#FF6A00]" size={40} />
        </div>
      </PageShell>
    );
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  // Show only first N features, rest hidden behind "Show more"
  const VISIBLE_FEATURES = 5;

  return (
    <PageShell breadcrumb="Plans" backTo="/" backLabel="Home">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6A00]/10 rounded-full mb-6">
            <Sparkles size={16} className="text-[#FF6A00]" />
            <span className="text-xs font-bold text-[#FF6A00] uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              AI-Recommended Plans
            </span>
          </div>
          <h1
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', color: '#101214' }}
            className="mb-4"
          >
            Powerful Plans for Every Business
          </h1>
          <p className="text-[#6F757C] text-lg max-w-2xl mx-auto">
            Choose the right plan to grow your machinery business. Reach more buyers, get verified, and access AI-powered insights.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {mySub && (
          <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#FF6A00] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#FF6A00]/10 rounded-full flex items-center justify-center text-[#FF6A00]">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Active: {mySub.plan?.toUpperCase()} Plan
                </h2>
                <p className="text-[#6F757C] text-sm">
                  Valid until {new Date(mySub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="flex gap-3 mt-2">
                  <span className="text-xs bg-[#EDE8E0] px-2 py-1 rounded font-mono uppercase text-[#101214]">
                    {mySub.maxListings === -1 ? '∞' : mySub.maxListings} Listings
                  </span>
                  <span className="text-xs bg-[#EDE8E0] px-2 py-1 rounded font-mono uppercase text-[#101214]">
                    {mySub.featuredListings} Featured
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="px-6 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium min-h-[44px]"
            >
              Cancel Plan
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = mySub?.plan === plan.id;
            const isFree = plan.id === 'free';
            const isPopular = plan.id === 'growth';
            const color = planColors[plan.id] || planColors.free;
            const Icon = planIcons[plan.id] || Zap;
            const isExpanded = expandedPlan === plan.id;
            const features = plan.features || [];
            const hasMoreFeatures = features.length > VISIBLE_FEATURES;
            const visibleFeatures = isExpanded ? features : features.slice(0, VISIBLE_FEATURES);

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl overflow-hidden border-2 transition-all flex flex-col ${
                  isCurrent ? 'border-[#FF6A00] shadow-xl' :
                  isPopular ? 'border-[#FF6A00]/50 shadow-lg' :
                  'border-[#EDE8E0] hover:border-[#101214]/20 hover:shadow-md'
                }`}
              >
                {/* Popular badge */}
                {isPopular && !isCurrent && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#FF6A00] to-[#FF8C38] text-white text-center py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      <Sparkles size={12} /> AI Recommended
                    </span>
                  </div>
                )}

                <div className={`p-6 sm:p-8 pb-0 ${isPopular && !isCurrent ? 'pt-12' : ''}`}>
                  {/* Plan icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color.bg}`}>
                    <Icon size={24} className={color.text} />
                  </div>

                  <span className="text-xs font-bold tracking-widest text-[#6F757C] uppercase mb-2 block" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {plan.name}
                  </span>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && <span className="text-[#6F757C] text-sm">/mo</span>}
                  </div>

                  {plan.price > 0 && (
                    <p className="text-[10px] text-[#6F757C] mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      + 18% GST = ₹{plan.totalAmount?.toLocaleString() || Math.round(plan.price * 1.18).toLocaleString()}/mo
                    </p>
                  )}

                  {/* Plan description */}
                  {plan.description && (
                    <p className="text-xs text-[#6F757C] mb-4 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  {/* Features list */}
                  <ul className="space-y-2.5 mb-4 flex-grow">
                    {visibleFeatures.map((feature, idx) => (
                      <li key={idx} className="group">
                        <div className="flex items-start gap-2.5 text-sm text-[#101214]">
                          <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-medium text-[13px] leading-tight">{getFeatureName(feature)}</span>
                            {getFeatureDetail(feature) && (
                              <p className="text-[11px] text-[#9CA0A5] mt-0.5 leading-snug">
                                {getFeatureDetail(feature)}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Show more / less toggle */}
                  {hasMoreFeatures && (
                    <button
                      onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#FF6A00] hover:text-[#e55f00] mb-4 transition-colors"
                    >
                      {isExpanded ? (
                        <>Show less <ChevronUp size={12} /></>
                      ) : (
                        <>{features.length - VISIBLE_FEATURES} more features <ChevronDown size={12} /></>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-6 sm:p-8 pt-0 mt-auto">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || isFree || submitting === plan.id}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm min-h-[48px] ${
                      isCurrent
                        ? 'bg-green-500 text-white cursor-default'
                        : isFree
                          ? 'bg-[#EDE8E0] text-[#6F757C] cursor-default'
                          : `bg-gradient-to-r ${color.gradient} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`
                    }`}
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    {submitting === plan.id ? <Loader2 size={18} className="animate-spin" /> : null}
                    {isCurrent ? '✓ Current Plan' : isFree ? 'Default' : 'Choose Plan'}
                    {!isCurrent && !isFree && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compare All Plans Toggle */}
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#EDE8E0] rounded-xl
                       text-sm font-bold text-[#101214] hover:border-[#FF6A00]/40 hover:shadow-md transition-all"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            <Info size={16} className="text-[#FF6A00]" />
            {showComparison ? 'Hide Comparison Table' : 'Compare All Plans in Detail'}
            {showComparison ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Full Comparison Table */}
        {showComparison && (
          <div className="mt-8 bg-white rounded-2xl border-2 border-[#EDE8E0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9F7F4]">
                    <th className="text-left p-4 font-bold text-[#101214] min-w-[200px]" style={{ fontFamily: 'Sora, sans-serif' }}>
                      Feature
                    </th>
                    {plans.map(p => {
                      const color = planColors[p.id] || planColors.free;
                      return (
                        <th key={p.id} className="text-center p-4 min-w-[140px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-xs font-bold uppercase tracking-wider ${color.text}`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                              {p.name}
                            </span>
                            <span className="text-[#101214] font-extrabold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
                              {p.price === 0 ? 'Free' : `₹${p.price.toLocaleString()}`}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={row.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="p-4 font-medium text-[#101214] border-t border-[#EDE8E0]/60">
                        {row.label}
                      </td>
                      {plans.map(p => {
                        let content: React.ReactNode;

                        if (row.key) {
                          const val = (p as any)[row.key];
                          content = (
                            <span className="font-semibold text-[#101214]">
                              {row.format?.(val) ?? val}
                            </span>
                          );
                        } else if (row.values) {
                          const val = (row.values as any)[p.id];
                          content = val === '—' ? (
                            <span className="text-[#C5C9CE]">—</span>
                          ) : (
                            <span className="font-medium text-[#101214]">{val}</span>
                          );
                        } else if (row.check) {
                          const has = row.check(p);
                          content = has ? (
                            <div className="inline-flex items-center justify-center w-6 h-6 bg-green-50 rounded-full">
                              <Check size={14} className="text-green-500" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-50 rounded-full">
                              <X size={14} className="text-[#C5C9CE]" />
                            </div>
                          );
                        }

                        return (
                          <td key={p.id} className="p-4 text-center border-t border-[#EDE8E0]/60">
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && selectedPlanData && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowPayment(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                Subscribe to {selectedPlanData.name}
              </h3>
              <p className="text-sm text-[#6F757C] mb-6">Select payment method to continue</p>

              {/* Amount Summary */}
              <div className="bg-[#F9F7F4] rounded-lg p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6F757C]">Plan Price</span>
                  <span className="font-medium">₹{selectedPlanData.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F757C]">GST (18%)</span>
                  <span className="font-medium">₹{selectedPlanData.gstAmount?.toLocaleString() || Math.round(selectedPlanData.price * 0.18).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-[#EDE8E0] pt-2 font-bold">
                  <span>Total</span>
                  <span className="text-[#FF6A00]">₹{selectedPlanData.totalAmount?.toLocaleString() || Math.round(selectedPlanData.price * 1.18).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 mb-6">
                {[
                  { id: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm', icon: Smartphone },
                  { id: 'card', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
                  { id: 'netbanking', label: 'Net Banking', desc: 'SBI, HDFC, ICICI & more', icon: Building2 },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === m.id ? 'border-[#FF6A00] bg-[#FF6A00]/5' : 'border-[#EDE8E0] hover:border-[#101214]/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      paymentMethod === m.id ? 'bg-[#FF6A00] text-white' : 'bg-[#EDE8E0] text-[#6F757C]'
                    }`}>
                      <m.icon size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.label}</p>
                      <p className="text-xs text-[#6F757C]">{m.desc}</p>
                    </div>
                    {paymentMethod === m.id && (
                      <div className="ml-auto w-5 h-5 bg-[#FF6A00] rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-3.5 border border-[#EDE8E0] rounded-xl text-sm font-medium hover:bg-[#EDE8E0] transition-colors min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentConfirm}
                  disabled={paymentLoading}
                  className="flex-1 py-3.5 bg-[#FF6A00] text-white rounded-xl text-sm font-bold hover:bg-[#e55f00] transition-colors flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {paymentLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {paymentLoading ? 'Processing...' : `Pay ₹${selectedPlanData.totalAmount?.toLocaleString() || Math.round(selectedPlanData.price * 1.18).toLocaleString()}`}
                </button>
              </div>

              <p className="text-[10px] text-[#6F757C] text-center mt-4" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                Demo mode • No real charges • Instant activation
              </p>
            </div>
          </div>
        )}

        {/* Bottom Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#EDE8E0] pt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#EDE8E0] flex items-center justify-center mx-auto mb-4 text-[#FF6A00]">
              <TrendingUp size={24} />
            </div>
            <h4 className="font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>5× More Views</h4>
            <p className="text-sm text-[#6F757C]">Featured listings appear at the top of search results with AI-optimized positioning.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#EDE8E0] flex items-center justify-center mx-auto mb-4 text-[#FF6A00]">
              <Sparkles size={24} />
            </div>
            <h4 className="font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>AI-Powered Insights</h4>
            <p className="text-sm text-[#6F757C]">Get AI price predictions, market analysis, and listing optimization recommendations.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#EDE8E0] flex items-center justify-center mx-auto mb-4 text-[#FF6A00]">
              <Globe size={24} />
            </div>
            <h4 className="font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Pan-India Reach</h4>
            <p className="text-sm text-[#6F757C]">Priority search visibility across all major Indian cities and regions.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
