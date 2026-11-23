import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  MapPin,
  PackageCheck,
  XOctagon,
} from 'lucide-react';
import type { Material, StockLog, StockStatus, TransactionType } from '../types/warehouse';
import {
  formatNumber,
  formatShortTime,
  getStockStatus,
  isToday,
  sortMaterialsByUrgency,
} from '../utils/warehouse';
import { ClockCalendarCard } from './ClockCalendarCard';
import { StockStatusBadge, TransactionBadge } from './StatusBadge';

interface DashboardViewProps {
  materials: Material[];
  logs: StockLog[];
  isLoading: boolean;
  canEdit?: boolean;
  onQuickTransaction: (type: TransactionType, materialId?: string) => void;
  onNavigateMaterials: (statusFilter?: StockStatus | 'ALL') => void;
  onNavigateLogbook: () => void;
}

export function DashboardView({
  materials,
  logs,
  isLoading,
  onQuickTransaction,
  onNavigateMaterials,
  onNavigateLogbook,
}: DashboardViewProps) {
  const totalMaterials = materials.length;
  const lowStockItems = materials.filter(
    (m) => getStockStatus(m.currentStock, m.minStock) === 'MENIPIS'
  );
  const outOfStockItems = materials.filter(
    (m) => getStockStatus(m.currentStock, m.minStock) === 'HABIS'
  );
  const todayLogs = logs.filter((l) => isToday(l.createdAt));

  const criticalItems = sortMaterialsByUrgency(
    materials.filter((m) => getStockStatus(m.currentStock, m.minStock) !== 'AMAN')
  );

  const recentLogs = logs.slice(0, 6);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151]"
            />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Quick Actions (Thumb-Zone Priority) */}
      <section className="grid grid-cols-2 gap-3 lg:hidden" aria-label="Aksi Cepat Transaksi">
        <button
          type="button"
          onClick={() => onQuickTransaction('MASUK')}
          className="flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-xl font-bold text-sm border border-[#86EFAC] bg-[#DCFCE7] text-[#15803D] dark:border-[#166534] dark:bg-[#14532D] dark:text-[#4ADE80] active:scale-[0.98] transition-transform cursor-pointer"
        >
          <ArrowDownLeft className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Stok Masuk</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickTransaction('KELUAR')}
          className="flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-xl font-bold text-sm border border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C] dark:border-[#9A3412] dark:bg-[#431407] dark:text-[#FB923C] active:scale-[0.98] transition-transform cursor-pointer"
        >
          <ArrowUpRight className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Stok Keluar</span>
        </button>
      </section>

      {/* KPI Cards Grid */}
      <section aria-label="Ringkasan KPI Gudang" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateMaterials('ALL')}
          className="text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] hover:border-[#1D4ED8] dark:hover:border-[#3B82F6] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#334155] dark:text-[#D1D5DB]">
              Total Material
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-[#3B82F6] flex items-center justify-center shrink-0">
              <Boxes className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-display font-extrabold tabular-nums tracking-tight">
            {formatNumber(totalMaterials)}
          </p>
          <p className="mt-1 text-xs text-[#334155] dark:text-[#D1D5DB]">SKU aktif terdaftar</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateMaterials('MENIPIS')}
          className="text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] hover:border-[#B45309] dark:hover:border-[#FBBF24] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#334155] dark:text-[#D1D5DB]">
              Perlu Restock
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#B45309] dark:bg-[#78350F] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-display font-extrabold tabular-nums tracking-tight text-[#B45309] dark:text-[#FBBF24]">