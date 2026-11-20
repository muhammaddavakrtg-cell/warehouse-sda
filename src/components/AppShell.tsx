import type { ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  Plus,
} from 'lucide-react';
import type { TransactionType } from '../types/warehouse';
import { ThemeToggle } from './ThemeToggle';

export type NavTab = 'dashboard' | 'materials' | 'logbook';

interface AppShellProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenTransaction: (defaultType: TransactionType) => void;
  criticalCount: number;
  children: ReactNode;
}

const NAV_ITEMS: { id: NavTab; label: string; mobileLabel: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Beranda', icon: LayoutDashboard },
  { id: 'materials', label: 'Master Material', mobileLabel: 'Material', icon: Boxes },
  { id: 'logbook', label: 'Logbook Audit', mobileLabel: 'Logbook', icon: ClipboardList },
];

export function AppShell({
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  onOpenTransaction,
  criticalCount,
  children,
}: AppShellProps) {
  const currentTitle = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F9FAFB] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-[#111827] border-r border-[#CBD5E1] dark:border-[#374151] z-30">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[#CBD5E1] dark:border-[#374151]">
          <div className="w-9 h-9 rounded-xl bg-[#1D4ED8] dark:bg-[#3B82F6] text-white dark:text-[#090D16] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-extrabold tracking-tight whitespace-nowrap">
            GudangPro
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5" aria-label="Navigasi Utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16]'
                    : 'text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-[#0F172A] dark:hover:text-[#F9FAFB]'
                }`}
              >
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'materials' && criticalCount > 0 && (
                  <span
                    className={`font-mono tabular-nums text-xs font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-[#090D16]/20 dark:text-[#090D16]'
                        : 'bg-[#FEF3C7] text-[#B45309] dark:bg-[#78350F] dark:text-[#FBBF24]'
                    }`}
                  >
                    {criticalCount}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-5 mt-5 border-t border-[#CBD5E1] dark:border-[#374151] space-y-2">
            <p className="px-3.5 text-xs font-semibold text-[#334155] dark:text-[#D1D5DB]">
              Aksi Cepat Stok
            </p>
            <button
              type="button"
              onClick={() => onOpenTransaction('MASUK')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-[#86EFAC] bg-[#DCFCE7] text-[#15803D] hover:brightness-95 dark:border-[#166534] dark:bg-[#14532D] dark:text-[#4ADE80] transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Stok Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenTransaction('KELUAR')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C] hover:brightness-95 dark:border-[#9A3412] dark:bg-[#431407] dark:text-[#FB923C] transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Stok Keluar</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-[#CBD5E1] dark:border-[#374151]">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </aside>

      {/* Mobile Compact Sticky Top Bar (52px height) */}
      <header className="lg:hidden sticky top-0 z-30 h-[52px] px-4 flex items-center justify-between bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#CBD5E1] dark:border-[#374151]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] dark:bg-[#3B82F6] text-white dark:text-[#090D16] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-display font-bold text-base truncate">{currentTitle}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex h-16 px-8 items-center justify-between gap-8 bg-white dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#374151] sticky top-0 z-20">
          <h1 className="font-display text-xl font-bold tracking-tight truncate">
            {currentTitle}
          </h1>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenTransaction('MASUK')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#1D4ED8] text-white hover:bg-blue-800 dark:bg-[#3B82F6] dark:text-[#090D16] dark:hover:bg-blue-400 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 pb-24 lg:pb-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (60px height + safe area) */}
      <nav
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#CBD5E1] dark:border-[#374151] pb-safe"
      >
        <div className="grid grid-cols-4 h-[60px] items-center px-1">
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#1D4ED8] dark:text-[#3B82F6] font-bold'
                : 'text-[#334155] dark:text-[#D1D5DB] font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap">Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('materials')}
            className={`relative flex flex-col items-center justify-center min-h-[44px] rounded-xl transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'text-[#1D4ED8] dark:text-[#3B82F6] font-bold'
                : 'text-[#334155] dark:text-[#D1D5DB] font-medium'
            }`}
          >
            <Boxes className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap">Material</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTransaction('MASUK')}
            className="flex flex-col items-center justify-center min-h-[44px] mx-1 rounded-xl bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16] font-bold shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap">Catat</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('logbook')}
            className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl transition-colors cursor-pointer ${
              activeTab === 'logbook'
                ? 'text-[#1D4ED8] dark:text-[#3B82F6] font-bold'
                : 'text-[#334155] dark:text-[#D1D5DB] font-medium'
            }`}
          >
            <ClipboardList className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap">Logbook</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
