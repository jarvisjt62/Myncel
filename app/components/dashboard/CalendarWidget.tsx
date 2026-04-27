'use client';

import { useEffect, useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'work_order' | 'maintenance';
  status: string;
  machineName?: string;
}

interface CalendarData {
  [date: string]: CalendarEvent[];
}

export default function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function fetchCalendarData() {
      try {
        const response = await fetch(`/api/dashboard/calendar?year=${year}&month=${month + 1}`);
        if (!response.ok) throw new Error('Failed to fetch calendar data');
        const data = await response.json();
        setEvents(data.events || {});
      } catch (err) {
        console.error('Calendar fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendarData();
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateKey);
    setSelectedEvents(events[dateKey] || []);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const getEventTypeColor = (type: string) => {
    return type === 'work_order' ? 'bg-blue-500' : 'bg-emerald-500';
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events[dateKey] || [];
      const hasEvents = dayEvents.length > 0;
      const selected = selectedDate === dateKey;
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-10 w-full rounded-lg flex flex-col items-center justify-center relative transition-all
            ${isToday(day) ? 'bg-[#635bff] text-white font-bold' : ''}
            ${selected && !isToday(day) ? 'bg-[var(--bg-surface-2)] ring-2 ring-[#635bff]' : ''}
            ${!isToday(day) && !selected ? 'hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]' : ''}
          `}
        >
          <span className="text-sm">{day}</span>
          {hasEvents && (
            <div className="flex gap-0.5 mt-0.5">
              {dayEvents.slice(0, 3).map((event, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${getEventTypeColor(event.type)}`}
                ></div>
              ))}
            </div>
          )}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Maintenance Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-[var(--text-primary)] min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="h-6 bg-[var(--bg-surface-2)] rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-10 bg-[var(--bg-surface-2)] rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="h-6 text-center text-xs text-[var(--text-muted)] font-medium">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-[var(--text-muted)]">Work Orders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-[var(--text-muted)]">Maintenance</span>
            </div>
          </div>

          {/* Selected date events */}
          {selectedDate && selectedEvents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-2 rounded-lg text-sm ${
                      event.type === 'work_order' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                  >
                    <p className="text-[var(--text-primary)] font-medium truncate">{event.title}</p>
                    {event.machineName && (
                      <p className="text-[var(--text-muted)] text-xs">{event.machineName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}