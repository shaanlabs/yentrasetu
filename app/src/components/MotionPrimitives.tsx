import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

export function FadeIn({ children, delay = 0, direction = 'up', duration = 600, className = '', style }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    up: 'translateY(24px)', down: 'translateY(-24px)',
    left: 'translateX(24px)', right: 'translateX(-24px)', none: 'none',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface StaggerProps {
  children: ReactNode[];
  baseDelay?: number;
  stagger?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export function StaggerChildren({ children, baseDelay = 0, stagger = 80, direction = 'up', className = '' }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <FadeIn key={i} delay={baseDelay + i * stagger} direction={direction}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Glassmorphism card wrapper
export function GlassCard({ children, className = '', style, glow = false }: {
  children: ReactNode; className?: string; style?: CSSProperties; glow?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 20,
        boxShadow: glow
          ? '0 8px 32px rgba(255,106,0,0.10), 0 0 0 1px rgba(255,106,0,0.06)'
          : '0 4px 24px rgba(16,18,20,0.06), 0 0 0 1px rgba(16,18,20,0.03)',
        transition: 'box-shadow 0.3s, transform 0.3s',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Pulse dot for live indicators
export function PulseDot({ color = '#22c55e', size = 8 }: { color?: string; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: size, height: size, borderRadius: '50%', background: color,
        boxShadow: `0 0 0 0 ${color}`,
        animation: 'pulse-ring 2s infinite',
      }} />
      <style>{`@keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 ${color}66; } 70% { box-shadow: 0 0 0 6px ${color}00; } 100% { box-shadow: 0 0 0 0 ${color}00; } }`}</style>
    </span>
  );
}
