import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  isToday,
  parseISO,
  differenceInDays,
  startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateRangePickerProps {
  checkInDate: string;
  checkOutDate: string;
  onSelectRange: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  checkInDate,
  checkOutDate,
  onSelectRange,
  onClose,
}) => {
  const initialDate = checkInDate ? parseISO(checkInDate) : new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate));
  
  const [selectedStart, setSelectedStart] = useState<Date | null>(
    checkInDate ? parseISO(checkInDate) : null
  );
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(
    checkOutDate ? parseISO(checkOutDate) : null
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const nextMonth = addMonths(currentMonth, 1);
  const today = startOfDay(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleDateClick = (day: Date) => {
    if (isBefore(day, today)) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(day);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      if (isBefore(day, selectedStart)) {
        setSelectedStart(day);
      } else if (isSameDay(day, selectedStart)) {
        const nextDay = addMonths(day, 0);
        nextDay.setDate(day.getDate() + 1);
        setSelectedEnd(nextDay);
        onSelectRange(format(selectedStart, 'yyyy-MM-dd'), format(nextDay, 'yyyy-MM-dd'));
      } else {
        setSelectedEnd(day);
        onSelectRange(format(selectedStart, 'yyyy-MM-dd'), format(day, 'yyyy-MM-dd'));
      }
    }
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <div className="flex-1 min-w-[250px] sm:min-w-[270px]">
        {/* Month Title */}
        <div className="text-center font-heading font-normal text-white text-base tracking-wide py-2">
          {format(monthDate, 'MMMM yyyy')}
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center mb-1">
          {weekDays.map((d, i) => (
            <span key={i} className="text-[10px] font-medium text-slate-400 uppercase tracking-widest py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthDate);
            const isPast = isBefore(day, today);
            const isStartDate = selectedStart && isSameDay(day, selectedStart);
            const isEndDate = selectedEnd && isSameDay(day, selectedEnd);
            
            const effectiveEnd = selectedEnd || (selectedStart && hoverDate && isAfter(hoverDate, selectedStart) ? hoverDate : null);
            const isInRange = selectedStart && effectiveEnd && isAfter(day, selectedStart) && isBefore(day, effectiveEnd);

            if (!isCurrentMonth) {
              return <div key={idx} className="h-8 w-full" />;
            }

            return (
              <div
                key={idx}
                className={`relative flex items-center justify-center h-8 ${
                  isInRange ? 'bg-[#d8be8a]/15' : ''
                } ${isStartDate && effectiveEnd ? 'rounded-l-full bg-[#d8be8a]/15' : ''} ${
                  isEndDate ? 'rounded-r-full bg-[#d8be8a]/15' : ''
                }`}
                onMouseEnter={() => !selectedEnd && selectedStart && setHoverDate(day)}
              >
                <button
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDateClick(day)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-normal transition-all relative z-10 ${
                    isPast
                      ? 'text-slate-600 cursor-not-allowed opacity-30'
                      : isStartDate || isEndDate
                      ? 'bg-[#d8be8a] text-slate-950 font-semibold shadow-sm scale-105'
                      : isInRange
                      ? 'text-amber-100 hover:bg-[#d8be8a]/20'
                      : isToday(day)
                      ? 'border border-[#d8be8a]/50 text-amber-200 hover:bg-white/5'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const calculatedNights =
    selectedStart && selectedEnd
      ? differenceInDays(selectedEnd, selectedStart)
      : selectedStart && hoverDate && isAfter(hoverDate, selectedStart)
      ? differenceInDays(hoverDate, selectedStart)
      : 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 right-0 sm:left-auto sm:right-auto sm:w-[600px] max-w-[95vw] mt-2.5 p-4 sm:p-6 rounded-3xl bg-[#0d1420]/98 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 animate-scaleUp text-slate-100"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
        <div>
          <h3 className="font-heading font-normal text-base text-white">
            Select Dates
          </h3>
          <p className="text-[11px] text-slate-400 font-light">
            {selectedStart && !selectedEnd
              ? 'Select departure date'
              : 'Select your check-in & check-out dates'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {calculatedNights > 0 && (
            <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#d8be8a]/15 text-[#e5d2ac] border border-[#d8be8a]/25">
              {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between pt-3 pb-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isBefore(currentMonth, startOfMonth(today))}
          className="p-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed text-slate-300 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium hidden sm:inline-block">
          Select Arrival & Departure
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.08] text-slate-300 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendars Layout */}
      <div className="flex flex-col sm:flex-row gap-6 mt-2">
        {renderMonth(currentMonth)}
        <div className="hidden sm:block border-l border-white/[0.08]" />
        <div className="hidden sm:block flex-1">
          {renderMonth(nextMonth)}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 font-light truncate">
          {selectedStart ? (
            <span>
              <span className="text-white font-medium">{format(selectedStart, 'MMM d, yyyy')}</span>
              {selectedEnd && (
                <>
                  {' — '}
                  <span className="text-white font-medium">{format(selectedEnd, 'MMM d, yyyy')}</span>
                </>
              )}
            </span>
          ) : (
            'Minimum 1 night stay'
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedStart(null);
              setSelectedEnd(null);
            }}
            className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-slate-200 transition"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!selectedStart || !selectedEnd}
            onClick={() => {
              if (selectedStart && selectedEnd) {
                onSelectRange(
                  format(selectedStart, 'yyyy-MM-dd'),
                  format(selectedEnd, 'yyyy-MM-dd')
                );
                onClose();
              }
            }}
            className="px-4 py-1.5 rounded-xl bg-[#d8be8a] hover:bg-[#e4d0a6] disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-medium transition shadow-sm"
          >
            Apply Dates
          </button>
        </div>
      </div>
    </div>
  );
};
