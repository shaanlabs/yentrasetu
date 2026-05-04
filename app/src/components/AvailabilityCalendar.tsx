import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface AvailabilityCalendarProps {
  /** Dates that are already booked (YYYY-MM-DD format) */
  bookedDates?: string[];
  /** Called when user selects a date range */
  onSelect?: (start: string, end: string) => void;
  /** Compact mode for listing cards */
  compact?: boolean;
}

export default function AvailabilityCalendar({ bookedDates = [], onSelect, compact = false }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectStart, setSelectStart] = useState<string | null>(null);
  const [selectEnd, setSelectEnd] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    if (d >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(d);
    }
  };

  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const formatDate = (day: number) => {
    const d = new Date(year, month, day);
    return d.toISOString().split('T')[0];
  };

  const isBooked = (day: number) => bookedDates.includes(formatDate(day));
  const isPast = (day: number) => new Date(year, month, day) < today;

  const isInRange = (day: number) => {
    if (!selectStart || !selectEnd) return false;
    const d = formatDate(day);
    return d >= selectStart && d <= selectEnd;
  };

  const isStart = (day: number) => formatDate(day) === selectStart;
  const isEnd = (day: number) => formatDate(day) === selectEnd;

  const handleDayClick = (day: number) => {
    if (isPast(day) || isBooked(day)) return;
    const dateStr = formatDate(day);

    if (!selectStart || (selectStart && selectEnd)) {
      setSelectStart(dateStr);
      setSelectEnd(null);
    } else {
      if (dateStr < selectStart) {
        setSelectStart(dateStr);
      } else {
        // Check for booked dates in range
        const hasBookedInRange = bookedDates.some(bd => bd > selectStart && bd < dateStr);
        if (hasBookedInRange) {
          setSelectStart(dateStr);
          setSelectEnd(null);
        } else {
          setSelectEnd(dateStr);
          onSelect?.(selectStart, dateStr);
        }
      }
    }
  };

  // Count available days this month
  const availableDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter(d => !isPast(d) && !isBooked(d)).length;
  const bookedThisMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter(d => isBooked(d)).length;

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={compact ? '' : 'bg-white rounded-xl shadow-sm border border-[#EDE8E0] p-4 sm:p-5'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
            {compact ? 'Availability' : 'Equipment Availability'}
          </h3>
          {!compact && (
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> {availableDays} available
              </span>
              {bookedThisMonth > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> {bookedThisMonth} booked
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-[#EDE8E0] rounded-lg transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium text-[#101214] min-w-[120px] text-center" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {monthName}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-[#EDE8E0] rounded-lg transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-[#6F757C] py-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for first week offset */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const past = isPast(day);
          const booked = isBooked(day);
          const inRange = isInRange(day);
          const start = isStart(day);
          const end = isEnd(day);
          const isToday = new Date(year, month, day).toDateString() === new Date().toDateString();

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={past || booked}
              className={`h-8 rounded-lg text-xs font-medium transition-all relative
                ${past ? 'text-[#EDE8E0] cursor-not-allowed' : ''}
                ${booked ? 'bg-red-100 text-red-400 cursor-not-allowed line-through' : ''}
                ${!past && !booked && !inRange ? 'text-[#101214] hover:bg-[#FF6A00]/10 hover:text-[#FF6A00]' : ''}
                ${inRange && !start && !end ? 'bg-[#FF6A00]/10 text-[#FF6A00]' : ''}
                ${start ? 'bg-[#FF6A00] text-white rounded-r-none' : ''}
                ${end ? 'bg-[#FF6A00] text-white rounded-l-none' : ''}
                ${start && end ? 'rounded-lg' : ''}
                ${isToday && !inRange ? 'ring-1 ring-[#FF6A00] ring-inset' : ''}
              `}
            >
              {day}
              {booked && (
                <X size={8} className="absolute top-0.5 right-0.5 text-red-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected range info */}
      {selectStart && selectEnd && (
        <div className="mt-3 pt-3 border-t border-[#EDE8E0] flex items-center justify-between">
          <span className="text-xs text-[#6F757C]">
            Selected: <strong className="text-[#101214]">{selectStart}</strong> → <strong className="text-[#101214]">{selectEnd}</strong>
          </span>
          <span className="text-xs font-bold text-[#FF6A00]">
            {Math.ceil((new Date(selectEnd).getTime() - new Date(selectStart).getTime()) / 86400000)} days
          </span>
        </div>
      )}

      {/* Legend */}
      {!compact && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#EDE8E0]">
          <span className="flex items-center gap-1.5 text-[10px] text-[#6F757C]">
            <span className="w-3 h-3 rounded bg-green-50 border border-green-200 flex items-center justify-center"><Check size={8} className="text-green-500" /></span>
            Available
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#6F757C]">
            <span className="w-3 h-3 rounded bg-red-100"></span> Booked
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#6F757C]">
            <span className="w-3 h-3 rounded bg-[#FF6A00]"></span> Selected
          </span>
        </div>
      )}
    </div>
  );
}
