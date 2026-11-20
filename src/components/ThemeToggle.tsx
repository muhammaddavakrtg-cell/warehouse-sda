import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  compact?: boolean;
}

export function ThemeToggle({ theme, onToggle, compact = false }: ThemeToggleProps) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
      className="inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#111827] text-[#0F172A] dark:text-[#F9FAFB] hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:focus-visible:ring-[#3B82F6] cursor-pointer whitespace-nowrap shrink-0"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          {!compact && <span className="text-xs font-semibold">Mode Terang</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-[#334155] shrink-0" aria-hidden="true" />
          {!compact && <span className="text-xs font-semibold">Mode Gelap</span>}
        </>
      )}
    </button>
  );
}
