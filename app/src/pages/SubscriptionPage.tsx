import { useState, useEffect } from 'react';
import { subscriptionsApi } from '../services/api';
import { 
  Check, 
  Loader2, 
  ShieldCheck, 
  TrendingUp, 
  Globe 
} from 'lucide-react';
import PageShell from '../components/PageShell';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansData, subData] = await Promise.all([
        subscriptionsApi.getPlans(),
        subscriptionsApi.getMine()
      ]);
      setPlans(plansData.plans);
      setMySub(subData.subscription);
    } catch (err) {
      console.error('Failed to fetch subscription data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setSubmitting(planId);
    try {
      await subscriptionsApi.subscribe(planId);
      await fetchData();
      alert('Successfully subscribed! Your account limits have been updated.');
    } catch (err) {
      alert('Subscription failed. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your active subscription? You will revert to the Free tier.')) return;
    setLoading(true);
    try {
      await subscriptionsApi.cancel();
      await fetchData();
      alert('Subscription cancelled.');
    } catch (err) {
      alert('Cancellation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !plans.length) {
    return <PageShell breadcrumb="Subscriptions"><div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-[#FF6A00]" size={40} /></div></PageShell>;
  }

  return (
    <PageShell breadcrumb="Subscriptions" backTo="/" backLabel="Home">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', color: '#101214' }} className="mb-4">
            Powerful Plans for Every Business
          </h1>
          <p className="text-[#6F757C] text-lg max-w-2xl mx-auto">
            Choose the right plan to grow your machinery business. Reach more buyers, get verified, and manage your inventory with ease.
          </p>
        </div>

        {mySub && (
          <div className="mb-12 bg-white rounded-2xl p-8 border-2 border-[#FF6A00] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#FF6A00]/10 rounded-full flex items-center justify-center text-[#FF6A00]">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>Active Subscription: {mySub.plan.toUpperCase()}</h2>
                <p className="text-[#6F757C]">Expires on: {new Date(mySub.endDate).toLocaleDateString()}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs bg-[#E9E3DA] px-2 py-1 rounded font-mono uppercase text-[#101214]">
                    Listings: {mySub.maxListings === -1 ? 'Unlimited' : mySub.maxListings}
                  </span>
                  <span className="text-xs bg-[#E9E3DA] px-2 py-1 rounded font-mono uppercase text-[#101214]">
                    Featured: {mySub.featuredListings}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleCancel}
              className="px-6 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Cancel Subscription
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const isCurrent = mySub?.plan === plan.id;
            const isFree = plan.id === 'free';
            
            return (
              <div 
                key={plan.id}
                className={`bg-white rounded-2xl overflow-hidden border transition-all flex flex-col ${
                  isCurrent ? 'border-[#FF6A00] shadow-xl scale-105' : 'border-[#E9E3DA] hover:border-[#101214]/20'
                }`}
              >
                <div className="p-8 pb-0">
                  <span className="text-xs font-bold tracking-widest text-[#FF6A00] uppercase mb-4 block" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {plan.id}
                  </span>
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif' }}>₹{plan.price.toLocaleString()}</span>
                    <span className="text-[#6F757C]">/mo</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-grow">
                    <li className="flex items-start gap-3 text-sm text-[#101214]">
                      <Check size={18} className="text-green-500 shrink-0" />
                      <span>{plan.maxListings === -1 ? 'Unlimited' : plan.maxListings} Listings</span>
                    </li>
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-[#101214]">
                        <Check size={18} className="text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-8 pt-0 mt-auto">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || isFree || submitting === plan.id}
                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      isCurrent 
                        ? 'bg-green-500 text-white cursor-default' 
                        : isFree
                          ? 'bg-[#E9E3DA] text-[#6F757C] cursor-default'
                          : 'bg-[#101214] text-white hover:bg-[#FF6A00]'
                    }`}
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    {submitting === plan.id ? <Loader2 size={18} className="animate-spin" /> : null}
                    {isCurrent ? 'Current Plan' : isFree ? 'Default' : 'Choose Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-[#E9E3DA] pt-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E9E3DA] flex items-center justify-center mx-auto mb-4 text-[#FF6A00]">
              <TrendingUp size={24} />
            </div>
            <h4 className="font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Boost Sales</h4>
            <p className="text-sm text-[#6F757C]">Featured listings appear at the top of search results, getting 5x more views.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E9E3DA] flex items-center justify-center mx-auto mb-4 text-[#FF6A00]">
              <ShieldCheck size={24} />
            </div>
            <h4 className="font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Build Trust</h4>
            <p className="text-sm text-[#6F757C]">Growth and Enterprise plans include a Verified Seller badge to increase buyer confidence.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E9E3DA] flex items-center justify-center mx-auto mb-4 text-[#FF6A00]">
              <Globe size={24} />
            </div>
            <h4 className="font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Pan-India Reach</h4>
            <p className="text-sm text-[#6F757C]">Expand your business across India with our priority search visibility in all major cities.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
