import { useEffect, useState } from 'react';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function ClockCalendarCard() {
  const [now, setNow] = useState(() => new Date());

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

  return (
    <section
      aria-label="Jam dan Logo Perusahaan"
      className="max-w-xs ml-auto rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] overflow-hidden"
    >
      {/* Jam & Tanggal */}
      <div className="px-4 py-3 border-b border-[#CBD5E1] dark:border-[#374151] flex items-center justify-between gap-2">
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
      </div>

      {/* Area Logo (Pengganti Kalender) */}
      <div className="p-6 flex flex-col items-center justify-center text-center space-y-2.5">
        <img
          src="/logo.png"
          alt="Logo Perusahaan"
          className="w-24 h-24 object-contain rounded-2xl"
        />
        <div>
          <p className="font-display text-sm font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">
            Nama Perusahaan
          </p>
          <p className="text-[11px] text-[#334155] dark:text-[#D1D5DB]">
            Warehouse Management System
          </p>
        </div>
      </div>
    </section>
  );
}