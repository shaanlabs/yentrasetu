/**
 * IndiaHeatmap — SVG map showing equipment demand by Indian state.
 * Designed for Indian construction/rental market mentality:
 * "Mere area mein kya demand hai?" (What's the demand in my area?)
 */
import { useState } from 'react';

interface StateData {
  name: string;
  demand: number; // 0-100
  listings: number;
  avgPrice: number;
  hotCategory?: string;
}

interface Props {
  data: StateData[];
  onStateClick?: (state: StateData) => void;
  className?: string;
}

// Simplified India state paths (major states only for performance)
const STATES: Record<string, { d: string; cx: number; cy: number }> = {
  'Maharashtra': { d: 'M180,340 L220,320 240,340 260,360 240,390 210,400 180,380Z', cx: 215, cy: 360 },
  'Gujarat': { d: 'M140,290 L180,280 200,300 180,340 150,330 130,310Z', cx: 162, cy: 310 },
  'Rajasthan': { d: 'M140,200 L200,190 220,220 200,270 160,280 130,260 120,230Z', cx: 168, cy: 240 },
  'Uttar Pradesh': { d: 'M220,210 L280,200 310,220 300,260 260,270 230,250Z', cx: 268, cy: 235 },
  'Madhya Pradesh': { d: 'M200,270 L260,270 280,300 260,330 220,320 190,300Z', cx: 235, cy: 300 },
  'Karnataka': { d: 'M190,400 L230,390 250,410 240,450 210,460 185,440Z', cx: 218, cy: 425 },
  'Tamil Nadu': { d: 'M230,450 L260,430 280,450 270,490 240,500 225,475Z', cx: 252, cy: 468 },
  'Kerala': { d: 'M210,470 L225,475 230,510 215,530 200,510Z', cx: 216, cy: 498 },
  'Andhra Pradesh': { d: 'M240,380 L290,370 310,400 280,430 250,420Z', cx: 272, cy: 400 },
  'Telangana': { d: 'M240,350 L280,340 300,360 290,380 250,380Z', cx: 270, cy: 362 },
  'Punjab': { d: 'M190,150 L215,140 230,160 220,185 195,180Z', cx: 210, cy: 165 },
  'Haryana': { d: 'M195,180 L220,185 230,200 215,215 195,210Z', cx: 210, cy: 197 },
  'Bihar': { d: 'M310,230 L350,225 365,245 345,260 310,255Z', cx: 335, cy: 243 },
  'West Bengal': { d: 'M345,260 L370,250 380,280 375,320 355,310 340,285Z', cx: 360, cy: 285 },
  'Odisha': { d: 'M300,310 L340,300 360,320 345,350 310,345Z', cx: 330, cy: 325 },
  'Delhi': { d: 'M210,200 L220,195 225,205 215,210Z', cx: 217, cy: 203 },
};

function getHeatColor(demand: number): string {
  if (demand >= 80) return '#FF4500';
  if (demand >= 60) return '#FF6A00';
  if (demand >= 40) return '#FFB347';
  if (demand >= 20) return '#FFD699';
  return '#FFF0DB';
}

export default function IndiaHeatmap({ data, onStateClick, className = '' }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; state: StateData } | null>(null);

  const dataMap = new Map(data.map(d => [d.name, d]));

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg viewBox="100 120 310 430" style={{ width: '100%', height: '100%', minHeight: 320 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F9F7F4" />
            <stop offset="100%" stopColor="#EDE8E0" />
          </linearGradient>
        </defs>

        {Object.entries(STATES).map(([name, { d, cx, cy }]) => {
          const stateData = dataMap.get(name);
          const demand = stateData?.demand || 0;
          const isHovered = hovered === name;

          return (
            <g key={name}
              onMouseEnter={(e) => {
                setHovered(name);
                if (stateData) setTooltip({ x: e.clientX, y: e.clientY, state: stateData });
              }}
              onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              onClick={() => stateData && onStateClick?.(stateData)}
              style={{ cursor: stateData ? 'pointer' : 'default' }}
            >
              <path
                d={d}
                fill={getHeatColor(demand)}
                stroke={isHovered ? '#FF6A00' : '#C4B9A8'}
                strokeWidth={isHovered ? 2.5 : 1}
                style={{
                  transition: 'all 0.3s ease',
                  filter: isHovered ? 'url(#glow)' : 'none',
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
              {demand > 30 && (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: 8, fontWeight: 700, fill: demand > 60 ? '#fff' : '#333', fontFamily: 'IBM Plex Mono, monospace', pointerEvents: 'none' }}>
                  {demand}
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(115, 500)">
          <text style={{ fontSize: 8, fill: '#6F757C', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>DEMAND</text>
          {[0, 20, 40, 60, 80].map((v, i) => (
            <g key={v} transform={`translate(${i * 28 + 50}, -4)`}>
              <rect width={24} height={10} rx={2} fill={getHeatColor(v)} />
              <text y={20} x={12} textAnchor="middle" style={{ fontSize: 7, fill: '#6F757C' }}>{v}+</text>
            </g>
          ))}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 10,
          background: 'rgba(16,18,20,0.92)', backdropFilter: 'blur(8px)',
          color: '#fff', padding: '10px 14px', borderRadius: 12,
          fontSize: 12, zIndex: 1000, pointerEvents: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: 200,
        }}>
          <p style={{ fontWeight: 800, marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>{tooltip.state.name}</p>
          <p style={{ color: '#FF6A00', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>
            Demand: {tooltip.state.demand}/100
          </p>
          <p style={{ color: '#aaa', fontSize: 11 }}>{tooltip.state.listings} active listings</p>
          {tooltip.state.avgPrice > 0 && (
            <p style={{ color: '#aaa', fontSize: 11 }}>Avg: ₹{tooltip.state.avgPrice.toLocaleString('en-IN')}/day</p>
          )}
          {tooltip.state.hotCategory && (
            <p style={{ color: '#FFB347', fontSize: 11, marginTop: 2 }}>🔥 {tooltip.state.hotCategory}</p>
          )}
        </div>
      )}
    </div>
  );
}
