import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, IndianRupee, Calculator, Building2, CreditCard } from 'lucide-react';
import PageShell from '../components/PageShell';

interface FormData {
  fullName: string;
  businessType: string;
  annualRevenue: string;
  loanAmount: string;
  equipmentType: string;
  yearsInBusiness: string;
  existingEmi: string;
  creditScore: string;
}

interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  estimatedEmi: number | null;
  loanAmount: number;
  maxEligible: number;
}

const INITIAL_FORM: FormData = {
  fullName: '',
  businessType: '',
  annualRevenue: '',
  loanAmount: '',
  equipmentType: '',
  yearsInBusiness: '',
  existingEmi: '',
  creditScore: '',
};

const BUSINESS_TYPES = ['Individual', 'Partnership', 'Pvt Ltd', 'LLP'];
const EQUIPMENT_TYPES = ['Excavator', 'Crane', 'Loader', 'Dumper', 'Bulldozer', 'Earthmovers', 'Other'];
const CREDIT_SCORES = [
  { label: 'Excellent (750+)', value: 'excellent', min: 750 },
  { label: 'Good (700–749)', value: 'good', min: 700 },
  { label: 'Fair (650–699)', value: 'fair', min: 650 },
  { label: 'Poor (below 650)', value: 'poor', min: 0 },
];

const INTEREST_RATE = 10; // % per annum
const TENURE_YEARS = 5;

function calculateEmi(principal: number, ratePercent: number, years: number): number {
  const r = ratePercent / 12 / 100;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function matchEquipment(raw: string): string {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  const match = EQUIPMENT_TYPES.find(t => lower.includes(t.toLowerCase()));
  return match || (raw ? 'Other' : '');
}

export default function LoanEligibilityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefilled = useMemo(() => {
    const amount = searchParams.get('amount') || '';
    const equipment = matchEquipment(searchParams.get('equipment') || '');
    return { amount, equipment };
  }, [searchParams]);

  const [form, setForm] = useState<FormData>({
    ...INITIAL_FORM,
    loanAmount: prefilled.amount,
    equipmentType: prefilled.equipment,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const set = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    setResult(null);
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.businessType) e.businessType = 'Select a business type';
    if (!form.annualRevenue || Number(form.annualRevenue) <= 0) e.annualRevenue = 'Enter valid revenue';
    if (!form.loanAmount || Number(form.loanAmount) <= 0) e.loanAmount = 'Enter valid loan amount';
    if (!form.equipmentType) e.equipmentType = 'Select equipment type';
    if (!form.yearsInBusiness || Number(form.yearsInBusiness) < 0) e.yearsInBusiness = 'Enter valid years';
    if (form.existingEmi && Number(form.existingEmi) < 0) e.existingEmi = 'Enter valid EMI amount';
    if (!form.creditScore) e.creditScore = 'Select credit score range';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const checkEligibility = () => {
    if (!validate()) return;

    const revenue = Number(form.annualRevenue);
    const loan = Number(form.loanAmount);
    const years = Number(form.yearsInBusiness);
    const existingEmi = Number(form.existingEmi) || 0;
    const creditMin = CREDIT_SCORES.find(c => c.value === form.creditScore)?.min ?? 0;

    const reasons: string[] = [];
    const maxEligible = revenue * 5;
    const estimatedNewEmi = calculateEmi(loan, INTEREST_RATE, TENURE_YEARS);
    const monthlyIncome = revenue / 12;
    const totalEmi = existingEmi + estimatedNewEmi;
    const emiRatio = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 100;

    // Check 1: Revenue
    if (revenue < 500000) {
      reasons.push('Annual revenue must be at least ₹5,00,000');
    }

    // Check 2: Years in business
    if (years < 1) {
      reasons.push('Minimum 1 year of business operation required');
    }

    // Check 3: Loan amount vs revenue
    if (loan > maxEligible) {
      reasons.push(`Loan amount exceeds 5× annual revenue (max eligible: ${fmt(maxEligible)})`);
    }

    // Check 4: EMI-to-income ratio
    if (emiRatio >= 50) {
      reasons.push(`Total EMI burden (${Math.round(emiRatio)}%) exceeds 50% of monthly income`);
    }

    // Check 5: Credit score
    if (creditMin < 650) {
      reasons.push('Credit score below 650 — minimum "Fair" rating required');
    }

    setResult({
      eligible: reasons.length === 0,
      reasons,
      estimatedEmi: reasons.length === 0 ? estimatedNewEmi : null,
      loanAmount: loan,
      maxEligible,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #ddd',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fff',
    minHeight: '48px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'Sora, sans-serif',
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '6px',
    color: '#101214',
  };

  const errorStyle: React.CSSProperties = {
    color: '#e53e3e',
    fontSize: '12px',
    marginTop: '4px',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <PageShell breadcrumb="Loan Eligibility" backTo="/" backLabel="Home">
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Page title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '44px', height: '44px', background: '#FF6A00', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={22} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.6rem', margin: 0, lineHeight: 1.2 }}>
              Check Loan Eligibility
            </h1>
          </div>
          <p style={{ color: '#6F757C', fontSize: '14px', marginTop: '8px', lineHeight: 1.6 }}>
            Get an instant eligibility estimate for equipment financing. No documents needed — just fill in a few details below.
          </p>
        </div>

        {/* Form */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 24px rgba(16,18,20,0.06)', border: '1px solid rgba(16,18,20,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.fullName ? '#e53e3e' : '#ddd' }}
              />
              {errors.fullName && <p style={errorStyle}>{errors.fullName}</p>}
            </div>

            {/* Business Type */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} color="#FF6A00" /> Business Type
                </span>
              </label>
              <select
                value={form.businessType}
                onChange={e => set('businessType', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.businessType ? '#e53e3e' : '#ddd', cursor: 'pointer' }}
              >
                <option value="">Select type</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.businessType && <p style={errorStyle}>{errors.businessType}</p>}
            </div>

            {/* Annual Revenue */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IndianRupee size={14} color="#FF6A00" /> Annual Revenue (₹)
                </span>
              </label>
              <input
                type="number"
                placeholder="e.g. 1500000"
                value={form.annualRevenue}
                onChange={e => set('annualRevenue', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.annualRevenue ? '#e53e3e' : '#ddd' }}
                min={0}
              />
              {errors.annualRevenue && <p style={errorStyle}>{errors.annualRevenue}</p>}
            </div>

            {/* Loan Amount */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IndianRupee size={14} color="#FF6A00" /> Desired Loan Amount (₹)
                </span>
              </label>
              <input
                type="number"
                placeholder="e.g. 2500000"
                value={form.loanAmount}
                onChange={e => set('loanAmount', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.loanAmount ? '#e53e3e' : '#ddd' }}
                min={0}
              />
              {errors.loanAmount && <p style={errorStyle}>{errors.loanAmount}</p>}
            </div>

            {/* Equipment Type */}
            <div>
              <label style={labelStyle}>Equipment Type</label>
              <select
                value={form.equipmentType}
                onChange={e => set('equipmentType', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.equipmentType ? '#e53e3e' : '#ddd', cursor: 'pointer' }}
              >
                <option value="">Select equipment</option>
                {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.equipmentType && <p style={errorStyle}>{errors.equipmentType}</p>}
            </div>

            {/* Years in Business */}
            <div>
              <label style={labelStyle}>Years in Business</label>
              <input
                type="number"
                placeholder="e.g. 3"
                value={form.yearsInBusiness}
                onChange={e => set('yearsInBusiness', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.yearsInBusiness ? '#e53e3e' : '#ddd' }}
                min={0}
              />
              {errors.yearsInBusiness && <p style={errorStyle}>{errors.yearsInBusiness}</p>}
            </div>

            {/* Existing EMIs */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IndianRupee size={14} color="#FF6A00" /> Existing Monthly EMIs (₹)
                </span>
              </label>
              <input
                type="number"
                placeholder="0 if none"
                value={form.existingEmi}
                onChange={e => set('existingEmi', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.existingEmi ? '#e53e3e' : '#ddd' }}
                min={0}
              />
              {errors.existingEmi && <p style={errorStyle}>{errors.existingEmi}</p>}
            </div>

            {/* Credit Score */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={14} color="#FF6A00" /> Self-Reported Credit Score
                </span>
              </label>
              <select
                value={form.creditScore}
                onChange={e => set('creditScore', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.creditScore ? '#e53e3e' : '#ddd', cursor: 'pointer' }}
              >
                <option value="">Select range</option>
                {CREDIT_SCORES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.creditScore && <p style={errorStyle}>{errors.creditScore}</p>}
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={checkEligibility}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Calculator size={16} />
              Check Eligibility
            </button>
            <button
              onClick={() => { setForm(INITIAL_FORM); setErrors({}); setResult(null); }}
              className="btn-secondary"
              style={{ padding: '14px 24px' }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Result Card */}
        {result && (
          <div
            style={{
              marginTop: '28px',
              background: result.eligible ? '#f0fdf4' : '#fef2f2',
              border: `2px solid ${result.eligible ? '#22c55e' : '#ef4444'}`,
              borderRadius: '12px',
              padding: '32px',
              animation: 'fadeSlideIn 0.4s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              {result.eligible ? (
                <CheckCircle size={32} color="#22c55e" />
              ) : (
                <XCircle size={32} color="#ef4444" />
              )}
              <h2 style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: '1.4rem',
                color: result.eligible ? '#166534' : '#991b1b',
                margin: 0,
              }}>
                {result.eligible ? 'You\u2019re Likely Eligible!' : 'Not Eligible at This Time'}
              </h2>
            </div>

            {result.eligible && result.estimatedEmi !== null ? (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #dcfce7' }}>
                    <p style={{ fontSize: '12px', color: '#6F757C', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Loan Amount</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#101214' }}>{fmt(result.loanAmount)}</p>
                  </div>
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #dcfce7' }}>
                    <p style={{ fontSize: '12px', color: '#6F757C', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Est. Monthly EMI</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#FF6A00' }}>{fmt(result.estimatedEmi)}</p>
                  </div>
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #dcfce7' }}>
                    <p style={{ fontSize: '12px', color: '#6F757C', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Rate / Tenure</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#101214' }}>{INTEREST_RATE}% / {TENURE_YEARS}yr</p>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#6F757C', lineHeight: 1.6, marginBottom: '20px' }}>
                  This is an indicative estimate. Actual terms depend on documentation, lender evaluation, and equipment condition.
                </p>

                <button
                  className="btn-primary"
                  onClick={() => navigate('/browse')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  Browse Equipment
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: '#991b1b', fontWeight: 500, marginBottom: '12px' }}>
                  Based on the details provided, eligibility criteria were not met:
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
                  {result.reasons.map((r, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '8px 0',
                      borderBottom: i < result.reasons.length - 1 ? '1px solid rgba(239,68,68,0.15)' : 'none',
                      fontSize: '13px',
                      color: '#7f1d1d',
                    }}>
                      <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>✕</span>
                      {r}
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: '13px', color: '#6F757C', lineHeight: 1.6 }}>
                  You may still be eligible with different terms or through alternative financing programs.
                  Contact our team for personalised assistance.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info section */}
        <div style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {[
            { title: 'No Documents Needed', desc: 'This is a quick pre-check. Submit documents only after pre-approval.' },
            { title: 'Competitive Rates', desc: 'Starting from 10% p.a. with flexible tenure up to 5 years.' },
            { title: 'Fast Processing', desc: 'Get pre-approval within 24 hours of submitting your application.' },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#fff',
              borderLeft: '4px solid #FF6A00',
              padding: '20px 24px',
              borderRadius: '0 8px 8px 0',
              boxShadow: '0 2px 12px rgba(16,18,20,0.04)',
            }}>
              <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{item.title}</h4>
              <p style={{ fontSize: '13px', color: '#6F757C', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Animation keyframe */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236F757C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }
        input:focus, select:focus {
          border-color: #FF6A00 !important;
          box-shadow: 0 0 0 3px rgba(255,106,0,0.1);
        }
      `}</style>
    </PageShell>
  );
}
