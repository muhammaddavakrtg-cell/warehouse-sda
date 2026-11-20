import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types/warehouse';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const styles =
          toast.variant === 'success'
            ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/30 dark:bg-[#14532D] dark:text-[#4ADE80] dark:border-[#4ADE80]/30'
            : toast.variant === 'error'
              ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/30 dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#F87171]/30'
              : 'bg-white text-[#0F172A] border-[#CBD5E1] dark:bg-[#111827] dark:text-[#F9FAFB] dark:border-[#374151]';

        const Icon =
          toast.variant === 'success'
            ? CheckCircle2
            : toast.variant === 'error'
              ? AlertCircle
              : Info;

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-150 ${styles}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
