'use client';

import { useEffect, useState, useRef } from 'react';

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
  const [draggedEvent, setDraggedEvent] = useState<{ event: CalendarEvent; fromDate: string } | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchEvents();
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleDateClick = (day: number) => {
    const dateKey = getDateKey(day);
    setSelectedDate(dateKey);
    setSelectedEvents(events[dateKey] || []);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent, fromDate: string) => {
    e.stopPropagation();
    setDraggedEvent({ event, fromDate });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  };

  const handleDrop = async (e: React.DragEvent, toDateKey: string) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!draggedEvent || draggedEvent.fromDate === toDateKey) {
      setDraggedEvent(null);
      return;
    }

    setRescheduling(true);
    setRescheduleMsg(null);

    try {
      const res = await fetch('/api/dashboard/calendar/reschedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draggedEvent.event.id,
          type: draggedEvent.event.type,
          newDate: toDateKey,
        }),
      });

      if (res.ok) {
        // Update local state
        setEvents(prev => {
          const updated = { ...prev };
          // Remove from old date
          if (updated[draggedEvent.fromDate]) {
            updated[draggedEvent.fromDate] = updated[draggedEvent.fromDate].filter(
              ev => ev.id !== draggedEvent.event.id
            );
            if (updated[draggedEvent.fromDate].length === 0) {
              delete updated[draggedEvent.fromDate];
            }
          }
          // Add to new date
          const movedEvent = { ...draggedEvent.event, date: toDateKey };
          if (!updated[toDateKey]) updated[toDateKey] = [];
          updated[toDateKey] = [...updated[toDateKey], movedEvent];
          return updated;
        });
        setRescheduleMsg({ text: '✓ Rescheduled', ok: true });
        if (selectedDate === draggedEvent.fromDate) {
          setSelectedDate(toDateKey);
          setSelectedEvents([...(events[toDateKey] || []), { ...draggedEvent.event, date: toDateKey }]);
        }
      } else {
        setRescheduleMsg({ text: 'Failed to reschedule', ok: false });
      }
    } catch {
      setRescheduleMsg({ text: 'Failed to reschedule', ok: false });
    } finally {
      setDraggedEvent(null);
      setRescheduling(false);
      setTimeout(() => setRescheduleMsg(null), 2500);
    }
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(day);
      const dayEvents = events[dateKey] || [];
      const hasEvents = dayEvents.length > 0;
      const selected = selectedDate === dateKey;
      const isDragOver = dragOverDate === dateKey;
      const today = isToday(day);

      days.push(
        <div
          key={day}
          onDragOver={(e) => handleDragOver(e, dateKey)}
          onDrop={(e) => handleDrop(e, dateKey)}
          className="relative"
        >
          <button
            onClick={() => handleDateClick(day)}
            className={`h-9 w-full rounded-lg flex flex-col items-center justify-center relative transition-all text-sm
              ${today ? 'bg-[#635bff] text-white font-bold' : ''}
              ${selected && !today ? 'bg-[var(--bg-surface-2)] ring-2 ring-[#635bff]' : ''}
              ${isDragOver && !today ? 'bg-[#635bff]/20 ring-2 ring-[#635bff]/50 scale-105' : ''}
              ${!today && !selected && !isDragOver ? 'hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]' : ''}
            `}
          >
            <span>{day}</span>
            {hasEvents && (
              <div className="flex gap-0.5 mt-0.5">
                {dayEvents.slice(0, 3).map((event, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full ${event.type === 'work_order' ? 'bg-blue-400' : 'bg-emerald-400'} ${today ? 'bg-white/70' : ''}`}
                  />
                ))}
              </div>
            )}
          </button>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Maintenance Calendar</h3>
          {draggedEvent && (
            <span className="text-[10px] text-[#635bff] bg-[#635bff]/10 px-2 py-0.5 rounded-full animate-pulse">
              Drop to reschedule
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-medium text-[var(--text-primary)] min-w-[90px] text-center">
            {monthNames[month].slice(0, 3)} {year}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {rescheduleMsg && (
        <div className={`text-xs px-3 py-1.5 rounded-lg mb-3 text-center font-medium ${rescheduleMsg.ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
          {rescheduleMsg.text}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-9 bg-[var(--bg-surface-2)] rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((day) => (
              <div key={day} className="h-6 text-center text-[10px] text-[var(--text-muted)] font-medium flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[10px] text-[var(--text-muted)]">Work Orders</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-[var(--text-muted)]">Maintenance</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] ml-auto opacity-60">Drag to reschedule</span>
          </div>

          {/* Selected date events (with drag handles) */}
          {selectedDate && selectedEvents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h4>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event, selectedDate)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-grab active:cursor-grabbing select-none ${
                      event.type === 'work_order'
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                  >
                    <svg className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] font-medium truncate">{event.title}</p>
                      {event.machineName && (
                        <p className="text-[var(--text-muted)] text-[10px] truncate">{event.machineName}</p>
                      )}
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      event.type === 'work_order' ? 'bg-blue-500/20 text-blue-600' : 'bg-emerald-500/20 text-emerald-600'
                    }`}>
                      {event.type === 'work_order' ? 'WO' : 'PM'}
                    </span>
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