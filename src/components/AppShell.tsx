import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  Boxes,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  UserRound,
  Users,
} from 'lucide-react';
import type { TransactionType } from '../types/warehouse';
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
  const labelCls = canManageUsers ? 'text-[10px]' : 'text-[11px]';
  const userInitial = (userName || 'U').charAt(0).toUpperCase();

  const handleLogoutClick = () => {
    if (!onLogout) return;
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F9FAFB] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-[#111827] border-r border-[#CBD5E1] dark:border-[#374151] z-30">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[#CBD5E1] dark:border-[#374151]">
          <img
            src="public/krt.png"
            alt="Logo Perusahaan"
            className="w-9 h-9 rounded-xl object-contain shrink-0"
          />
          <span className="font-display text-lg font-extrabold tracking-tight whitespace-nowrap truncate">
            Inventory SDA
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
      {/* Mobile Compact Sticky Top Bar (52px height) */}
      <header className="lg:hidden sticky top-0 z-30 h-[52px] px-4 flex items-center justify-between bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#CBD5E1] dark:border-[#374151]">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/logo.png"
            alt="Logo Perusahaan"
            className="w-8 h-8 rounded-lg object-contain shrink-0"
          />
          <span className="font-display font-bold text-base truncate">{currentTitle}</span>
          {activeTab === 'dashboard' && (
            <NotificationBell items={notifications} onViewAll={onOpenNotifications} />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {userName && (
            <div className="text-right leading-tight min-w-0 max-w-[88px]">
              <p className="text-[11px] font-bold truncate">{userName}</p>
              <p className="text-[10px] font-semibold text-[#1D4ED8] dark:text-[#3B82F6] truncate">
                {roleLabel}
              </p>
            </div>
          )}
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
            <img
              src="/logo.png"
              alt="Logo Perusahaan"
              className="w-8 h-8 rounded-lg object-contain shrink-0"
            />
            <h1 className="font-display text-xl font-bold tracking-tight truncate">
              {currentTitle}
            </h1>
            {activeTab === 'dashboard' && (
              <NotificationBell items={notifications} onViewAll={onOpenNotifications} />
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
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 pb-24 lg:pb-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (60px height + safe area) */}
      <nav
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#CBD5E1] dark:border-[#374151] pb-safe"
      >
        <div
          className={`grid ${canManageUsers ? 'grid-cols-7' : 'grid-cols-5'} h-[60px] items-center px-1`}
        >
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
            <span className={`${labelCls} mt-0.5 leading-none whitespace-nowrap`}>Beranda</span>
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
            <span className={`${labelCls} mt-0.5 leading-none whitespace-nowrap`}>Material</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTransaction('MASUK')}
            className="flex flex-col items-center justify-center min-h-[44px] mx-1 rounded-xl bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16] font-bold shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span className={`${labelCls} mt-0.5 leading-none whitespace-nowrap`}>Catat</span>
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
            <span className={`${labelCls} mt-0.5 leading-none whitespace-nowrap`}>Logbook</span>
          </button>

          {canManageUsers && (
            <button
              type="button"
              onClick={() => onTabChange('users')}
              className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'text-[#1D4ED8] dark:text-[#3B82F6] font-bold'
                  : 'text-[#334155] dark:text-[#D1D5DB] font-medium'
              }`}
            >
              <Users className="w-5 h-5" aria-hidden="true" />
              <span className={`${labelCls} mt-0.5 leading-none whitespace-nowrap`}>User</span>
            </button>
          )}

          {canManageUsers && (
            <button
              type="button"
              onClick={() => onTabChange('activity')}
              className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl transition-colors cursor-pointer ${
                activeTab === 'activity'
                  ? 'text-[#1D4ED8] dark:text-[#3B82F6] font-bold'
                  : 'text-[#334155] dark:text-[#D1D5DB] font-medium'
              }`}
            >
              <History className="w-5 h-5" aria-hidden="true" />
              <span className={`${labelCls} mt-0.5 leading-none whitespace-nowrap`}>Log</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'text-[#1D4ED8] dark:text-[#3B82F6] font-bold'
                : 'text-[#334155] dark:text-[#D1D5DB] font-medium'
            }`}
          >
            <UserRound className="w-5 h-5" aria-hidden="true" />
            <span className={`${labelCls} mt-0.5 leading-none whitespace-nowrap`}>Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}