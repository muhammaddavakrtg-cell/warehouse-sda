import { useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Boxes,
  CalendarDays,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { TransactionType } from '../types/warehouse';
import { ClockCalendarCard } from './ClockCalendarCard';
import { NotificationBell, type NotificationItem } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

export type NavTab = 'dashboard' | 'materials' | 'logbook' | 'users' | 'activity' | 'profile';

interface AppShellProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenTransaction: (defaultType: TransactionType) => void;
  criticalCount: number;
  canEdit?: boolean;
  canManageUsers?: boolean;
  userName?: string;
  roleLabel?: string;
  onLogout?: () => void;
  notifications?: NotificationItem[];
  onOpenNotifications?: () => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: NavTab; label: string; mobileLabel: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Beranda', icon: LayoutDashboard },
  { id: 'materials', label: 'Master Material', mobileLabel: 'Material', icon: Boxes },
  { id: 'logbook', label: 'Logbook Audit', mobileLabel: 'Logbook', icon: ClipboardList },
  { id: 'users', label: 'Kelola User', mobileLabel: 'User', icon: Users },
  { id: 'activity', label: 'Log Aktivitas', mobileLabel: 'Log', icon: History },
  { id: 'profile', label: 'Profil Saya', mobileLabel: 'Profil', icon: UserRound },
];

export function AppShell({
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  onOpenTransaction,
  criticalCount,
  canManageUsers = false,
  userName,
  roleLabel,
  onLogout,
  notifications = [],
  onOpenNotifications,
  children,
}: AppShellProps) {
  const visibleNavItems = NAV_ITEMS.filter(
    (n) => (n.id !== 'users' && n.id !== 'activity') || canManageUsers
  );
  const currentTitle = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'Dashboard';
  const userInitial = (userName || 'U').charAt(0).toUpperCase();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    if (!onLogout) return;
    setMobileMenuOpen(false);
    onLogout();
  };

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F9FAFB] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-[#111827] border-r border-[#CBD5E1] dark:border-[#374151] z-30">
        <div className="min-h-16 py-3 px-5 flex items-center gap-3 border-b border-[#CBD5E1] dark:border-[#374151]">
          <img
            src="/logo.png"
            alt="Logo Perusahaan"
            className="w-10 h-10 rounded-xl object-contain shrink-0"
          />
          <span className="font-display text-base font-extrabold tracking-tight leading-snug break-words">
            Inventory Material SD Plant
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5" aria-label="Navigasi Utama">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="space-y-1">
                <button
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

                {item.id === 'materials' && (
                  <button
                    type="button"
                    onClick={() => onOpenTransaction('KELUAR')}
                    className="w-full flex items-center gap-3 pl-9 pr-3.5 py-2 rounded-xl text-sm font-semibold text-[#C2410C] dark:text-[#FB923C] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors duration-150 cursor-pointer whitespace-nowrap"
                  >
                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Material Keluar</span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#CBD5E1] dark:border-[#374151] space-y-3">
          {userName && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-[#3B82F6] flex items-center justify-center text-sm font-bold shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{userName}</p>
                <p className="text-xs font-semibold text-[#1D4ED8] dark:text-[#3B82F6] truncate">
                  Level: {roleLabel}
                </p>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  aria-label="Keluar"
                  title="Keluar"
                  className="w-9 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] flex items-center justify-center text-[#B91C1C] dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </aside>
      {/* Mobile Left Drawer (Menu Garis 3) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] h-full bg-white dark:bg-[#111827] border-r border-[#CBD5E1] dark:border-[#374151] flex flex-col z-10 shadow-2xl">
            <div className="h-14 px-4 flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#374151]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="public/logo.png"
                  alt="Logo Perusahaan"
                  className="w-8 h-8 rounded-lg object-contain shrink-0"
                />
                <span className="font-display text-base font-extrabold tracking-tight truncate">
                  Nama Perusahaan
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup Menu"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-3 pt-4 pb-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTransaction('MASUK');
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#1D4ED8] text-white hover:bg-blue-800 dark:bg-[#3B82F6] dark:text-[#090D16] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Catat Transaksi</span>
              </button>
            </div>

            <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto" aria-label="Menu Mobile">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16]'
                          : 'text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800'
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

                    {item.id === 'materials' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenTransaction('KELUAR');
                        }}
                        className="w-full flex items-center gap-3 pl-9 pr-3.5 py-2 rounded-xl text-sm font-semibold text-[#C2410C] dark:text-[#FB923C] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Material Keluar</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#CBD5E1] dark:border-[#374151] space-y-3">
              {userName && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-[#3B82F6] flex items-center justify-center text-sm font-bold shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{userName}</p>
                    <p className="text-xs font-semibold text-[#1D4ED8] dark:text-[#3B82F6] truncate">
                      Level: {roleLabel}
                    </p>
                  </div>
                </div>
              )}
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Compact Sticky Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 px-3 flex items-center justify-between gap-2 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#CBD5E1] dark:border-[#374151]">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Buka Menu"
            className="w-9 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] flex items-center justify-center text-[#0F172A] dark:text-[#F9FAFB] active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <img
            src="public/logo.png"
            alt="Logo Perusahaan"
            className="w-7 h-7 rounded-lg object-contain shrink-0"
          />

          <div className="min-w-0 leading-tight">
            <p className="font-display text-xs font-extrabold tracking-tight truncate">
              Inventory Material SD Plant
            </p>
            <p className="text-[11px] font-semibold text-[#334155] dark:text-[#D1D5DB] truncate">
              {currentTitle}
            </p>
          </div>

          {activeTab === 'dashboard' && (
            <div className="relative flex items-center gap-1 shrink-0">
              <NotificationBell items={notifications} onViewAll={onOpenNotifications} />
              <button
                type="button"
                onClick={() => setCalendarOpen((prev) => !prev)}
                aria-label="Buka Kalender"
                title="Jam & Kalender"
                className="w-8 h-8 rounded-lg border border-[#CBD5E1] dark:border-[#374151] flex items-center justify-center text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <CalendarDays className="w-4 h-4" aria-hidden="true" />
              </button>

              {calendarOpen && (
                <div className="fixed left-4 right-4 top-16 z-50 max-w-xs mx-auto shadow-2xl">
                  <ClockCalendarCard />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenTransaction('MASUK')}
            aria-label="Catat Transaksi"
            className="inline-flex items-center gap-1 px-2.5 h-9 rounded-xl text-xs font-bold bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16] active:scale-95 transition-transform cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Catat</span>
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
          {onLogout && (
            <button
              type="button"
              onClick={handleLogoutClick}
              aria-label="Keluar"
              title="Keluar"
              className="w-9 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] flex items-center justify-center text-[#B91C1C] dark:text-[#F87171] active:scale-95 transition-transform cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex h-16 px-8 items-center justify-between gap-8 bg-white dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#374151] sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-display text-xl font-bold tracking-tight truncate">
              {currentTitle}
            </h1>
            {activeTab === 'dashboard' && (
              <div className="relative flex items-center gap-1.5">
                <NotificationBell items={notifications} onViewAll={onOpenNotifications} />
                <button
                  type="button"
                  onClick={() => setCalendarOpen((prev) => !prev)}
                  aria-label="Buka Kalender"
                  title="Jam & Kalender"
                  className="w-9 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] flex items-center justify-center text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4" aria-hidden="true" />
                </button>

                {calendarOpen && (
                  <div className="absolute left-0 top-11 z-50 w-72 shadow-2xl">
                    <ClockCalendarCard />
                  </div>
                )}
              </div>
            )}
          </div>

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
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 pb-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}