import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface UsageTimerProps {
  bookingId: string;
  machineName: string;
  dailyRate: number;
  onComplete?: (totalHours: number, totalCost: number) => void;
}

interface TimerSession {
  startTime: number;
  endTime?: number;
  pauseTime?: number;
  breaks: { start: number; end?: number }[];
}

export default function UsageTimer({ bookingId, machineName, dailyRate, onComplete }: UsageTimerProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [session, setSession] = useState<TimerSession | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds of actual work
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const hourlyRate = dailyRate / 8; // 8-hour working day

  // Load saved session
  useEffect(() => {
    const saved = localStorage.getItem(`ys_timer_${bookingId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed.session);
        setStatus(parsed.status);
        setElapsed(parsed.elapsed);
        setTotalBreakTime(parsed.totalBreakTime || 0);
      } catch {}
    }
  }, [bookingId]);

  // Save session on change
  useEffect(() => {
    if (session) {
      localStorage.setItem(`ys_timer_${bookingId}`, JSON.stringify({
        session, status, elapsed, totalBreakTime
      }));
    }
  }, [session, status, elapsed, totalBreakTime, bookingId]);

  // Timer tick
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const currentCost = Math.round((elapsed / 3600) * hourlyRate);

  const handleStart = () => {
    const now = Date.now();
    setSession({ startTime: now, breaks: [] });
    setStatus('running');
    setElapsed(0);
    setTotalBreakTime(0);
  };

  const handlePause = () => {
    if (!session) return;
    const now = Date.now();
    setSession(prev => ({
      ...prev!,
      breaks: [...prev!.breaks, { start: now }]
    }));
    setStatus('paused');
  };

  const handleResume = () => {
    if (!session) return;
    const now = Date.now();
    const lastBreak = session.breaks[session.breaks.length - 1];
    if (lastBreak && !lastBreak.end) {
      const breakDuration = Math.floor((now - lastBreak.start) / 1000);
      setTotalBreakTime(prev => prev + breakDuration);
      setSession(prev => ({
        ...prev!,
        breaks: prev!.breaks.map((b, i) =>
          i === prev!.breaks.length - 1 ? { ...b, end: now } : b
        )
      }));
    }
    setStatus('running');
  };

  const handleStop = () => {
    if (!session) return;
    const now = Date.now();

    // If paused, close the break
    if (status === 'paused') {
      const lastBreak = session.breaks[session.breaks.length - 1];
      if (lastBreak && !lastBreak.end) {
        const breakDuration = Math.floor((now - lastBreak.start) / 1000);
        setTotalBreakTime(prev => prev + breakDuration);
      }
    }

    setSession(prev => ({ ...prev!, endTime: now }));
    setStatus('completed');
    onComplete?.(elapsed / 3600, currentCost);
  };

  const progressPercent = Math.min(100, (elapsed / (8 * 3600)) * 100); // 8-hour day = 100%

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#EDE8E0] overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between ${
        status === 'running' ? 'bg-green-50 border-b border-green-200' :
        status === 'paused' ? 'bg-yellow-50 border-b border-yellow-200' :
        status === 'completed' ? 'bg-blue-50 border-b border-blue-200' :
        'bg-[#F9F7F4] border-b border-[#EDE8E0]'
      }`}>
        <div className="flex items-center gap-2">
          <Clock size={16} className={
            status === 'running' ? 'text-green-600 animate-pulse' :
            status === 'paused' ? 'text-yellow-600' :
            'text-[#6F757C]'
          } />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Usage Tracker
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          status === 'running' ? 'bg-green-100 text-green-700' :
          status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
          status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-[#EDE8E0] text-[#6F757C]'
        }`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          {status === 'idle' ? 'NOT STARTED' : status.toUpperCase()}
        </span>
      </div>

      <div className="p-5">
        {/* Machine info */}
        <p className="text-xs text-[#6F757C] mb-1">Tracking usage for</p>
        <p className="text-sm font-bold mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>{machineName}</p>

        {/* Timer display */}
        <div className="text-center mb-5">
          <p className={`text-4xl font-bold tracking-wider ${
            status === 'running' ? 'text-green-600' :
            status === 'paused' ? 'text-yellow-600' :
            'text-[#101214]'
          }`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {formatTime(elapsed)}
          </p>
          <p className="text-xs text-[#6F757C] mt-1">
            {status === 'running' && '⏱ Timer is running...'}
            {status === 'paused' && '⏸ Paused — break time not charged'}
            {status === 'completed' && '✅ Session completed'}
            {status === 'idle' && 'Start timer when machine begins work'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-[#6F757C] mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            <span>0h</span>
            <span>8h (full day)</span>
          </div>
          <div className="w-full h-2.5 bg-[#EDE8E0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                status === 'running' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                status === 'paused' ? 'bg-yellow-400' :
                'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center p-3 bg-[#F9F7F4] rounded-lg">
            <p className="text-[10px] text-[#6F757C] mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>HOURS</p>
            <p className="text-lg font-bold text-[#101214]">{(elapsed / 3600).toFixed(1)}</p>
          </div>
          <div className="text-center p-3 bg-[#F9F7F4] rounded-lg">
            <p className="text-[10px] text-[#6F757C] mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>BREAKS</p>
            <p className="text-lg font-bold text-[#6F757C]">{formatTime(totalBreakTime)}</p>
          </div>
          <div className="text-center p-3 bg-[#FF6A00]/5 rounded-lg border border-[#FF6A00]/20">
            <p className="text-[10px] text-[#FF6A00] mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>COST</p>
            <p className="text-lg font-bold text-[#FF6A00]">{formatPrice(currentCost)}</p>
          </div>
        </div>

        {/* Rate info */}
        <div className="flex items-center justify-between text-xs text-[#6F757C] mb-5 px-1">
          <span>Rate: {formatPrice(hourlyRate)}/hr ({formatPrice(dailyRate)}/day)</span>
          {session?.breaks.length ? (
            <span>{session.breaks.length} break{session.breaks.length > 1 ? 's' : ''} taken</span>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {status === 'idle' && (
            <button
              onClick={handleStart}
              className="flex-1 py-3.5 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              <Play size={18} /> Start Timer
            </button>
          )}

          {status === 'running' && (
            <>
              <button
                onClick={handlePause}
                className="flex-1 py-3.5 text-sm font-bold rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                <Pause size={18} /> Pause
              </button>
              <button
                onClick={handleStop}
                className="py-3.5 px-5 text-sm font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Square size={16} /> Stop
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className="flex-1 py-3.5 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                <Play size={18} /> Resume
              </button>
              <button
                onClick={handleStop}
                className="py-3.5 px-5 text-sm font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Square size={16} /> End
              </button>
            </>
          )}

          {status === 'completed' && (
            <div className="flex-1 py-3.5 text-sm font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center gap-2">
              <CheckCircle size={18} /> Session Complete — {(elapsed / 3600).toFixed(1)}h · {formatPrice(currentCost)}
            </div>
          )}
        </div>

        {/* Dispute notice */}
        {(status === 'running' || status === 'paused' || status === 'completed') && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <AlertTriangle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700">
              This timer provides <strong>digital proof</strong> of actual machine usage. Break times are not charged. 
              Both you and the equipment owner can see this record — eliminating billing disputes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
