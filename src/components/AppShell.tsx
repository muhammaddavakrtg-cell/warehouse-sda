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
  PackageX,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { Material, StockLog, TransactionType } from '../types/warehouse';
import { BrandLogo } from './BrandLogo';
import { ClockCalendarCard } from './ClockCalendarCard';
import { NotificationBell, type NotificationItem } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { WarehouseAiAssistant } from './WarehouseAiAssistant';

export type NavTab =
  | 'dashboard'
  | 'materials'
  | 'depleted'
  | 'logbook'
  | 'users'
  | 'activity'
  | 'profile';

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
  onDismissNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  materials?: Material[];
  logs?: StockLog[];
  onQuickRestock?: (materialId: string) => void;
  children: ReactNode;
  avatarUrl?: string;
}

const NAV_ITEMS: { id: NavTab; label: string; mobileLabel: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Beranda', icon: LayoutDashboard },
  { id: 'materials', label: 'Master Material', mobileLabel: 'Material', icon: Boxes },
  { id: 'depleted', label: 'Material Habis', mobileLabel: 'Habis', icon: PackageX },
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
  avatarUrl,
  roleLabel,
  onLogout,
  notifications = [],
  onOpenNotifications,
  onDismissNotification,
  onClearAllNotifications,
  materials = [],
  logs = [],
  onQuickRestock,
  children,
}: AppShellProps) {
  const visibleNavItems = NAV_ITEMS.filter(
    (n) => n.id !== 'depleted' && ((n.id !== 'users' && n.id !== 'activity') || canManageUsers)
  );
  const depletedCount = materials.filter((m) => Number(m.currentStock) <= 0).length;
  const currentTitle = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'Dashboard';
  const userInitial = (userName || 'U').charAt(0).toUpperCase();
  const avatarNode = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={userName}
      className="w-9 h-9 rounded-full object-cover border border-[#CBD5E1] dark:border-[#374151] shrink-0"
    />
  ) : (
    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-[#3B82F6] flex items-center justify-center text-sm font-bold shrink-0">
      {userInitial}
    </div>
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === '1';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      } catch {
        /* abaikan jika penyimpanan browser tidak tersedia */
      }
      return next;
    });
  };

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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F9FAFB] flex flex-col">
      {/* Unified Top Header Bar */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#CBD5E1] dark:border-[#374151] flex items-center">
        {/* Bagian Kiri Header (Garis 3 Mobile + Logo & Nama Perusahaan) */}
        <div
          className={`h-full px-3 ${
            sidebarCollapsed ? 'lg:px-4 lg:w-[4.5rem]' : 'lg:px-5 lg:w-64'
          } lg:border-r lg:border-[#CBD5E1] lg:dark:border-[#374151] flex items-center gap-2.5 lg:gap-3 shrink-0 overflow-hidden transition-[width] duration-200`}
        >
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Buka Menu"
            className="lg:hidden w-9 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] flex items-center justify-center text-[#0F172A] dark:text-[#F9FAFB] active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <BrandLogo className="w-8 h-8 lg:w-10 lg:h-10" />

          <div
            className={`font-display text-xs lg:text-[15px] font-extrabold tracking-tight leading-tight ${
              sidebarCollapsed ? 'lg:hidden' : ''
            }`}
          >
            <span className="block">Inventory Material</span>
            <span className="block">SD Plant</span>
          </div>
        </div>

        {/* Bagian Kanan Header */}
        <div className="flex-1 h-full px-3 lg:px-8 flex items-center justify-end lg:justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            <h1 className="hidden lg:block font-display text-xl font-bold tracking-tight truncate">
              {currentTitle}
            </h1>

            <div className="relative flex items-center gap-1.5 shrink-0">
              <NotificationBell
                items={notifications}
                onViewAll={onOpenNotifications}
                onDismissNotification={onDismissNotification}
                onClearAllNotifications={onClearAllNotifications}
              />

              {activeTab === 'dashboard' && (
                <>
                  <button
                    type="button"
                    onClick={() => setCalendarOpen((prev) => !prev)}
                    aria-label="Buka Kalender"
                    title="Jam & Kalender"
                    className="hidden lg:flex w-9 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] items-center justify-center text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                  </button>

                  {calendarOpen && (
                    <div className="hidden lg:block absolute left-0 top-11 z-50 w-72 shadow-2xl">
                      <ClockCalendarCard />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenTransaction('MASUK')}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold bg-[#1D4ED8] text-white hover:bg-blue-800 dark:bg-[#3B82F6] dark:text-[#090D16] dark:hover:bg-blue-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar (bisa dilipat jadi ikon saja) */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:top-16 lg:bottom-0 lg:left-0 bg-white dark:bg-[#111827] border-r border-[#CBD5E1] dark:border-[#374151] z-20 transition-[width] duration-200 ${
          sidebarCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-64'
        }`}
      >
        <div className={`pt-3 flex ${sidebarCollapsed ? 'px-2 justify-center' : 'px-3'}`}>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Perluas menu' : 'Perkecil menu'}
            title={sidebarCollapsed ? 'Perluas menu' : 'Perkecil menu'}
            className={`h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] flex items-center text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap ${
              sidebarCollapsed
                ? 'w-9 justify-center'
                : 'w-full px-3.5 gap-3 justify-start text-sm font-semibold'
            }`}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Perkecil Menu</span>
              </>
            )}
          </button>
        </div>

        <nav
          className={`flex-1 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden ${
            sidebarCollapsed ? 'px-2' : 'px-3'
          }`}
          aria-label="Navigasi Utama"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`relative w-full flex items-center py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                    sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16]'
                      : 'text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-[#0F172A] dark:hover:text-[#F9FAFB]'
                  }`}
                >
                  <span className="flex items-center gap-3 whitespace-nowrap">
                    <Icon
                      className={sidebarCollapsed ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'}
                      aria-hidden="true"
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </span>
                  {item.id === 'materials' &&
                    criticalCount > 0 &&
                    (sidebarCollapsed ? (
                      <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-[#F59E0B] ring-2 ring-white dark:ring-[#111827]" />
                    ) : (
                      <span
                        className={`font-mono tabular-nums text-xs font-bold px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-white/20 text-white dark:bg-[#090D16]/20 dark:text-[#090D16]'
                            : 'bg-[#FEF3C7] text-[#B45309] dark:bg-[#78350F] dark:text-[#FBBF24]'
                        }`}
                      >
                        {criticalCount}
                      </span>
                    ))}
                </button>

                {item.id === 'materials' && (
                  <button
                    type="button"
                    onClick={() => onOpenTransaction('KELUAR')}
                    title={sidebarCollapsed ? 'Material Keluar' : undefined}
                    aria-label="Material Keluar"
                    className={`w-full flex items-center gap-3 py-2 rounded-xl text-sm font-semibold text-[#C2410C] dark:text-[#FB923C] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                      sidebarCollapsed ? 'justify-center px-0' : 'pl-9 pr-3.5'
                    }`}
                  >
                    <ArrowUpRight
                      className={sidebarCollapsed ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'}
                      aria-hidden="true"
                    />
                    {!sidebarCollapsed && <span>Material Keluar</span>}
                  </button>
                )}

                {item.id === 'materials' && (
                  <button
                    type="button"
                    onClick={() => onTabChange('depleted')}
                    title={sidebarCollapsed ? 'Material Habis' : undefined}
                    aria-label="Material Habis"
                    className={`relative w-full flex items-center py-2 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                      sidebarCollapsed ? 'justify-center px-0' : 'justify-between pl-9 pr-3.5'
                    } ${
                      activeTab === 'depleted'
                        ? 'bg-red-600 text-white'
                        : 'text-[#B91C1C] dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <PackageX
                        className={sidebarCollapsed ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'}
                        aria-hidden="true"
                      />
                      {!sidebarCollapsed && <span>Material Habis</span>}
                    </span>
                    {depletedCount > 0 &&
                      (sidebarCollapsed ? (
                        <span className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-[#111827]" />
                      ) : (
                        <span
                          className={`font-mono tabular-nums text-xs font-bold px-1.5 py-0.5 rounded ${
                            activeTab === 'depleted'
                              ? 'bg-white/20 text-white'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {depletedCount}
                        </span>
                      ))}
                  </button>
                )}

                {item.id === 'profile' && !sidebarCollapsed && (
                  <div className="pt-1">
                    <WarehouseAiAssistant
                      materials={materials}
                      logs={logs}
                      onQuickRestock={onQuickRestock}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div
          className={`border-t border-[#CBD5E1] dark:border-[#374151] ${
            sidebarCollapsed ? 'p-2' : 'p-4 space-y-3'
          }`}
        >
          {userName &&
            (sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                {avatarNode}
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
            ) : (
              <div className="flex items-center gap-3">
                {avatarNode}
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
            ))}
          {!sidebarCollapsed && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
        </div>
      </aside>

      {/* Mobile Left Drawer (Menu Garis 3) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-[#111827] border-r border-[#CBD5E1] dark:border-[#374151] flex flex-col z-10 shadow-2xl">
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#374151] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <BrandLogo className="w-9 h-9" />
                <div className="font-display text-sm font-extrabold tracking-tight leading-tight">
                  <span className="block">Inventory Material</span>
                  <span className="block">SD Plant</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup Menu"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-3 pt-3 pb-2 space-y-2 border-b border-[#CBD5E1] dark:border-[#374151] shrink-0">
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

              <button
                type="button"
                onClick={() => setMobileCalendarOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] text-xs font-semibold text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#1D4ED8] dark:text-[#3B82F6]" aria-hidden="true" />
                  <span>Jam & Kalender</span>
                </span>
                <span className="text-[11px] font-bold text-[#1D4ED8] dark:text-[#3B82F6]">
                  {mobileCalendarOpen ? 'Tutup' : 'Lihat'}
                </span>
              </button>

              {mobileCalendarOpen && (
                <div className="pt-1">
                  <ClockCalendarCard />
                </div>
              )}
            </div>

            <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto" aria-label="Menu Mobile">
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

                    {item.id === 'materials' && (
                      <button
                        type="button"
                        onClick={() => handleSelectTab('depleted')}
                        className={`w-full flex items-center justify-between pl-9 pr-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          activeTab === 'depleted'
                            ? 'bg-red-600 text-white'
                            : 'text-[#B91C1C] dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-950/30'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <PackageX className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>Material Habis</span>
                        </span>
                        {depletedCount > 0 && (
                          <span
                            className={`font-mono tabular-nums text-xs font-bold px-1.5 py-0.5 rounded ${
                              activeTab === 'depleted'
                                ? 'bg-white/20 text-white'
                                : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {depletedCount}
                          </span>
                        )}
                      </button>
                    )}

                    {item.id === 'profile' && (
                      <div className="pt-1">
                        <WarehouseAiAssistant
                          materials={materials}
                          logs={logs}
                          onQuickRestock={onQuickRestock}
                          onBeforeOpen={() => setMobileMenuOpen(false)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#CBD5E1] dark:border-[#374151] space-y-3 shrink-0">
              {userName && (
                <div className="flex items-center gap-3">
                  {avatarNode}
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
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 ${
          sidebarCollapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64'
        } flex flex-col min-w-0 transition-[padding] duration-200`}
      >
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 pb-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}