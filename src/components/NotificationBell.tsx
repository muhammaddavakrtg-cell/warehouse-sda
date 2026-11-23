import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, PackagePlus, Trash2, X, XOctagon } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  level: 'HABIS' | 'MENIPIS' | 'ADDED';
  createdAt?: number;
  dismissible?: boolean;
}

interface NotificationBellProps {
  items: NotificationItem[];
  onViewAll?: () => void;
  onDismissNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
}

const MAX_VISIBLE = 20;

export function NotificationBell({
  items,
  onViewAll,
  onDismissNotification,
  onClearAllNotifications,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const count = items.length;
  const visible = items.slice(0, MAX_VISIBLE);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `Notifikasi, ${count} pemberitahuan` : 'Notifikasi, tidak ada pemberitahuan'}
        aria-expanded={open}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold leading-4 text-center tabular-nums">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Daftar notifikasi"
          className="fixed left-3 right-3 top-[56px] sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-96 z-50 rounded-2xl border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#111827] shadow-xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-[#CBD5E1] dark:border-[#374151] flex items-center justify-between gap-2">
            <div>
              <p className="font-display text-sm font-bold">Notifikasi</p>
              <p className="text-[11px] text-[#334155] dark:text-[#D1D5DB]">
                {count > 0 ? `${count} pemberitahuan aktif` : 'Tidak ada pemberitahuan'}
              </p>
            </div>
            {count > 0 && onClearAllNotifications && (
              <button
                type="button"
                onClick={onClearAllNotifications}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#B91C1C] dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Hapus Semua</span>
              </button>
            )}
          </div>

          {count === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2
                className="w-8 h-8 mx-auto text-[#15803D] dark:text-[#4ADE80]"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-semibold">Semua aman & bersih</p>
              <p className="mt-0.5 text-xs text-[#334155] dark:text-[#D1D5DB]">
                Tidak ada notifikasi baru atau peringatan stok.
              </p>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-[#CBD5E1] dark:divide-[#374151]">
              {visible.map((item) => (
                <li key={item.id} className="px-4 py-3 flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.level === 'HABIS'
                        ? 'bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#7F1D1D] dark:text-[#F87171]'
                        : item.level === 'ADDED'
                          ? 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D] dark:text-[#4ADE80]'
                          : 'bg-[#FEF3C7] text-[#B45309] dark:bg-[#78350F] dark:text-[#FBBF24]'
                    }`}
                  >
                    {item.level === 'HABIS' ? (
                      <XOctagon className="w-4 h-4" aria-hidden="true" />
                    ) : item.level === 'ADDED' ? (
                      <PackagePlus className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-[#334155] dark:text-[#D1D5DB]">{item.description}</p>
                  </div>
                  {onDismissNotification && (
                    <button
                      type="button"
                      onClick={() => onDismissNotification(item.id)}
                      aria-label="Hapus notifikasi"
                      title="Hapus notifikasi"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
              {count > MAX_VISIBLE && (
                <li className="px-4 py-2.5 text-xs text-center text-[#334155] dark:text-[#D1D5DB]">
                  +{count - MAX_VISIBLE} pemberitahuan lainnya
                </li>
              )}
            </ul>
          )}

          {onViewAll && (
            <div className="p-2 border-t border-[#CBD5E1] dark:border-[#374151]">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onViewAll();
                }}
                className="w-full py-2 rounded-xl text-xs font-bold text-[#1D4ED8] dark:text-[#3B82F6] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Lihat Master Material
              </button>
            </div>
          )}
        </div>