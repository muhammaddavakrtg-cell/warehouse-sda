import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function ClockCalendarCard() {
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateText = now.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  let zoneText = '';
  try {
    zoneText =
      new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' })
        .formatToParts(now)
        .find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    zoneText = '';
  }

  const firstDayIndex = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayIndex }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
  });

  const isTodayCell = (day: number) =>
    day === now.getDate() && view.month === now.getMonth() && view.year === now.getFullYear();

  const goMonth = (delta: number) => {
    setView((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToday = () => {
    const d = new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <section
      aria-label="Jam dan Kalender"
      className="max-w-xs ml-auto rounded-xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] overflow-hidden"
    >
      <div className="px-3.5 py-2.5 border-b border-[#CBD5E1] dark:border-[#374151] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-lg font-extrabold tabular-nums tracking-tight leading-tight">
            {timeText}
            {zoneText && (
              <span className="ml-1.5 text-[10px] font-semibold text-[#334155] dark:text-[#D1D5DB]">
                {zoneText}
              </span>
            )}
          </p>
          <p className="text-[11px] text-[#334155] dark:text-[#D1D5DB] truncate">{dateText}</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-[#3B82F6] flex items-center justify-center shrink-0">
          <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
      </div>

      <div className="p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            aria-label="Bulan sebelumnya"
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToday}
            title="Kembali ke bulan ini"
            className="text-xs font-bold capitalize hover:underline cursor-pointer"
          >
            {monthLabel}
          </button>
          <button
            type="button"
            onClick={() => goMonth(1)}
            aria-label="Bulan berikutnya"
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-[10px] font-semibold text-[#334155] dark:text-[#D1D5DB] py-0.5"
            >
              {d}
            </div>
          ))}
          {cells.map((day, idx) =>
            day === null ? (
              <div key={`empty-${idx}`} />
            ) : (
              <div
                key={day}
                className={`py-1 rounded text-[11px] tabular-nums ${
                  isTodayCell(day)
                    ? 'bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16] font-bold'
                    : 'text-[#0F172A] dark:text-[#F9FAFB] hover:bg-slate-100 dark:hover:bg-gray-800'
                }`}
              >
                {day}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}