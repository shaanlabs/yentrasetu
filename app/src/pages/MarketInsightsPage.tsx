import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsApi } from '../services/api';
import { useSEO } from '../hooks/useSEO';
import {
  TrendingUp, BarChart3, Loader2, ArrowUpRight, ArrowDownRight,
  Minus, Package, IndianRupee, Calendar, Layers
} from 'lucide-react';
import PageShell from '../components/PageShell';

const CATEGORIES = ['construction', 'mining', 'agriculture', 'industrial'];

export default function MarketInsightsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useSEO({
    title: 'Market Insights',
    description: 'Heavy equipment market trends, demand forecasting, and price analysis for India.',
  });

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [trends, setTrends] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trendsRes, forecastRes] = await Promise.all([
        analyticsApi.getMarketTrends(category || undefined, 6),
        analyticsApi.getDemandForecast(category || undefined).catch(() => null),
      ]);
      setTrends(trendsRes);
      setForecast(forecastRes);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const lbl = 'text-xs font-medium text-[#6F757C] uppercase tracking-wider';

  if (authLoading) {
    return (
      <PageShell breadcrumb="Market Insights" backTo="/" backLabel="Home">
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#FF6A00]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell breadcrumb="Market Insights" backTo="/" backLabel="Home">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#101214' }}
              className="flex items-center gap-2">
              <TrendingUp className="text-[#FF6A00]" size={24} /> Market Insights
            </h1>
            <p className="text-[#6F757C] text-sm mt-1">Price trends, demand forecasting, and supply-demand analysis.</p>
          </div>

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-[#EDE8E0] rounded-lg text-sm text-[#101214] focus:border-[#FF6A00] focus:outline-none shadow-sm min-h-[44px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-[#FF6A00]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Price Trends */}
            {trends?.priceTrends && (
              <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
                <h2 className="flex items-center gap-2 mb-4"
                  style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214' }}>
                  <IndianRupee size={18} className="text-[#FF6A00]" /> Price Trends
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Array.isArray(trends.priceTrends) && trends.priceTrends.length > 0 ? (
                    trends.priceTrends.slice(0, 6).map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-[#F9F7F4] rounded-lg border border-[#EDE8E0]">
                        <p className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                          {item.category || item.month || `Period ${i + 1}`}
                        </p>
                        <p className="text-xl font-bold text-[#101214] mt-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                          ₹{Number(item.avgPrice || item.avg || 0).toLocaleString('en-IN')}
                        </p>
                        {item.change !== undefined && (
                          <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                            item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-500' : 'text-[#6F757C]'
                          }`}>
                            {item.change > 0 ? <ArrowUpRight size={12} /> : item.change < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                            {Math.abs(item.change).toFixed(1)}%
                          </p>
                        )}
                        {item.count !== undefined && (
                          <p className="text-xs text-[#6F757C] mt-0.5">{item.count} listings</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6F757C] col-span-3">No price trend data available yet. Data will build as listings grow.</p>
                  )}
                </div>
              </div>
            )}

            {/* Demand by Category */}
            {trends?.demand && (
              <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
                <h2 className="flex items-center gap-2 mb-4"
                  style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214' }}>
                  <BarChart3 size={18} className="text-[#FF6A00]" /> Demand by Category
                </h2>
                <div className="space-y-3">
                  {Array.isArray(trends.demand) && trends.demand.length > 0 ? (
                    trends.demand.map((item: any, i: number) => {
                      const maxCount = Math.max(...trends.demand.map((d: any) => d.count || d.demand || 1));
                      const pct = Math.round(((item.count || item.demand || 0) / maxCount) * 100);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-[#101214] capitalize">{item.category}</span>
                            <span className="text-[#6F757C]">{item.count || item.demand || 0} listings</span>
                          </div>
                          <div className="h-2 bg-[#EDE8E0] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8C38] transition-all duration-500"
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[#6F757C]">No demand data available yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Supply-Demand Gaps */}
            {forecast?.gaps && Array.isArray(forecast.gaps) && forecast.gaps.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
                <h2 className="flex items-center gap-2 mb-4"
                  style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214' }}>
                  <Layers size={18} className="text-[#FF6A00]" /> Supply-Demand Gaps
                </h2>
                <p className="text-sm text-[#6F757C] mb-4">Categories where demand exceeds supply — opportunities to list.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {forecast.gaps.slice(0, 8).map((gap: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <Package size={18} className="text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#101214] capitalize">{gap.category || gap.subCategory}</p>
                        <p className="text-xs text-green-700">
                          {gap.demand || 'High'} demand, {gap.supply || 'Low'} supply
                          {gap.gapScore ? ` · Gap: ${gap.gapScore}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seasonal Patterns */}
            {forecast?.seasonal && Array.isArray(forecast.seasonal) && forecast.seasonal.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-5 sm:p-6">
                <h2 className="flex items-center gap-2 mb-4"
                  style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#101214' }}>
                  <Calendar size={18} className="text-[#FF6A00]" /> Seasonal Patterns
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {forecast.seasonal.map((item: any, i: number) => (
                    <div key={i} className="p-3 bg-[#F9F7F4] rounded-lg border border-[#EDE8E0] text-center">
                      <p className={lbl} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{item.month || item.season}</p>
                      <p className="text-lg font-bold text-[#101214] mt-1">{item.count || item.listings || 0}</p>
                      <p className="text-xs text-[#6F757C]">listings</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!trends?.priceTrends && !trends?.demand && !forecast?.gaps && (
              <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-12 text-center">
                <BarChart3 size={48} className="text-[#EDE8E0] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#101214] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Not enough data yet
                </h3>
                <p className="text-sm text-[#6F757C]">
                  Market insights will become available as more listings are created on the platform.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
