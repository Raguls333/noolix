import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Last 7 days', getValue: () => ({ from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), to: new Date() }) },
  { label: 'Last 30 days', getValue: () => ({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }) },
  { label: 'Last 90 days', getValue: () => ({ from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), to: new Date() }) },
];

export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayText = value.from && value.to
    ? `${formatDate(value.from)} – ${formatDate(value.to)}`
    : 'Select date range';

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentMonth);

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (!value.from || (value.from && value.to)) {
      // Start new selection
      onChange({ from: selectedDate, to: null });
    } else {
      // Complete selection
      if (selectedDate < value.from) {
        onChange({ from: selectedDate, to: value.from });
      } else {
        onChange({ from: value.from, to: selectedDate });
      }
      setIsOpen(false);
    }
  };

  const handlePreset = (preset: typeof presets[0]) => {
    onChange(preset.getValue());
    setIsOpen(false);
  };

  const isDateInRange = (day: number) => {
    if (!value.from) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (!value.to) {
      return date.toDateString() === value.from.toDateString();
    }
    
    return date >= value.from && date <= value.to;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-left h-11 bg-white border-[#E5E7EB] hover:bg-[#F4F5F7] px-4"
      >
        <Calendar className="w-[18px] h-[18px] mr-2 text-[#6B7280]" />
        <span className="text-[14px] text-[#0F172A]">{displayText}</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-4 min-w-[320px]">
          {/* Presets */}
          <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-[#E5E7EB]">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className="px-3 py-2 text-[13px] text-[#4B5563] hover:bg-[#F4F5F7] rounded-lg transition-colors font-medium text-left"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 hover:bg-[#F4F5F7] rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#4B5563]" />
            </button>
            <div className="text-[14px] text-[#0F172A] font-medium">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 hover:bg-[#F4F5F7] rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#4B5563]" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-xs text-[#6B7280] font-medium py-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const inRange = isDateInRange(day);
              
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square flex items-center justify-center text-[13px] rounded-lg transition-colors ${
                    inRange
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-[#0F172A] hover:bg-[#F4F5F7]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
