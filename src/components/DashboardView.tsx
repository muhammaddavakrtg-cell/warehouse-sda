import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
  const [criticalOpen, setCriticalOpen] = useState(true);
  const [recentLogsOpen, setRecentLogsOpen] = useState(true);

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
          <p className="mt-1 text-xs text-[#334155] dark:text-[#D1D5DB]">QCODE aktif terdaftar</p>
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
            {formatNumber(lowStockItems.length)}
          </p>
          <p className="mt-1 text-xs text-[#334155] dark:text-[#D1D5DB]">Di bawah batas minimum</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateMaterials('HABIS')}
          className="text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] hover:border-[#B91C1C] dark:hover:border-[#F87171] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#334155] dark:text-[#D1D5DB]">
              Stok Habis
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#7F1D1D] dark:text-[#F87171] flex items-center justify-center shrink-0">
              <XOctagon className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-display font-extrabold tabular-nums tracking-tight text-[#B91C1C] dark:text-[#F87171]">
            {formatNumber(outOfStockItems.length)}
          </p>
          <p className="mt-1 text-xs text-[#334155] dark:text-[#D1D5DB]">Stok 0 tersedia</p>
        </button>

        <button
          type="button"
          onClick={onNavigateLogbook}
          className="text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] hover:border-[#15803D] dark:hover:border-[#4ADE80] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#334155] dark:text-[#D1D5DB]">
              Aktivitas Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
              <Activity className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-display font-extrabold tabular-nums tracking-tight">
            {formatNumber(todayLogs.length)}
          </p>
          <p className="mt-1 text-xs text-[#334155] dark:text-[#D1D5DB]">
            Transaksi masuk & keluar
          </p>
        </button>
      </section>

      <div className="space-y-6">
       <div className="space-y-6">
          <section
            aria-label="Material Kritis"
            className="rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#CBD5E1] dark:border-[#374151] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCriticalOpen((prev) => !prev)}
                aria-expanded={criticalOpen}
                className="flex-1 flex items-center justify-between gap-3 text-left cursor-pointer group"
              >
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold group-hover:text-[#1D4ED8] dark:group-hover:text-[#3B82F6] transition-colors">
                    Daftar Material Kritis ({formatNumber(criticalItems.length)})
                  </h2>
                  <p className="text-xs text-[#334155] dark:text-[#D1D5DB] mt-0.5">
                    Prioritas restock untuk item habis dan di bawah batas minimum
                  </p>
                </div>
                <span className="w-8 h-8 rounded-lg border border-[#CBD5E1] dark:border-[#374151] flex items-center justify-center shrink-0">
                  {criticalOpen ? (
                    <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  )}
                </span>
              </button>

              <button
              type="button"
              onClick={() => onNavigateMaterials('MENIPIS')}
              className="w-28 inline-flex items-center justify-end gap-1 text-xs font-bold text-[#1D4ED8] dark:text-[#3B82F6] hover:underline whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            </div>

            {criticalOpen && (
              <>
                {criticalItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D] dark:text-[#4ADE80] flex items-center justify-center">
                      <PackageCheck className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <p className="mt-3 font-display font-bold text-base">
                      Semua Stok Dalam Kondisi Aman
                    </p>
                    <p className="mt-1 text-sm text-[#334155] dark:text-[#D1D5DB]">
                      Tidak ada material yang habis atau berada di bawah batas minimum saat ini.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#CBD5E1] dark:divide-[#374151]">
                    {criticalItems.map((item) => {
                      const status = getStockStatus(item.currentStock, item.minStock);
                      return (
                        <div
                          key={item.id}
                          className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-semibold text-[#334155] dark:text-[#D1D5DB]">
                                {item.qcode}
                              </span>
                              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#374151]">
                                ·
                              </span>
                              <span className="text-xs text-[#334155] dark:text-[#D1D5DB] inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                                <span className="font-mono">{item.location}</span>
                              </span>
                              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#374151]">
                                ·
                              </span>
                              <span className="text-xs text-[#334155] dark:text-[#D1D5DB]">
                                {item.category}
                              </span>
                            </div>
                            <p className="mt-1 font-semibold text-sm sm:text-base truncate">
                              {item.name}
                            </p>
                            <div className="mt-2 flex items-center gap-3 flex-wrap">
                              <StockStatusBadge status={status} />
                              <span className="text-xs sm:text-sm font-medium tabular-nums text-[#334155] dark:text-[#D1D5DB]">
                                Tersedia:{' '}
                                <strong className="text-[#0F172A] dark:text-[#F9FAFB]">
                                  {formatNumber(item.currentStock)} {item.unit}
                                </strong>{' '}
                                / Min. {formatNumber(item.minStock)} {item.unit}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onQuickTransaction('MASUK', item.id)}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1D4ED8] text-white hover:bg-blue-800 dark:bg-[#3B82F6] dark:text-[#090D16] dark:hover:bg-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <ArrowDownLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Restock</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          <section
            aria-label="Aktivitas Terbaru"
            className="rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#CBD5E1] dark:border-[#374151] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setRecentLogsOpen((prev) => !prev)}
                aria-expanded={recentLogsOpen}
                className="flex-1 flex items-center justify-between gap-3 text-left cursor-pointer group"
              >
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold group-hover:text-[#1D4ED8] dark:group-hover:text-[#3B82F6] transition-colors">
                    Aktivitas Terbaru ({formatNumber(recentLogs.length)})
                  </h2>
                  <p className="text-xs text-[#334155] dark:text-[#D1D5DB] mt-0.5">
                    6 pergerakan stok terakhir di gudang
                  </p>
                </div>
                <span className="w-8 h-8 rounded-lg border border-[#CBD5E1] dark:border-[#374151] flex items-center justify-center shrink-0">
                  {recentLogsOpen ? (
                    <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  )}
                </span>
              </button>

              <button
              type="button"
              onClick={onNavigateLogbook}
              className="w-28 inline-flex items-center justify-end gap-1 text-xs font-bold text-[#1D4ED8] dark:text-[#3B82F6] hover:underline whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              <span>Logbook</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            </div>

            {recentLogsOpen && (
              <>
                {recentLogs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#334155] dark:text-[#D1D5DB]">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-60" aria-hidden="true" />
                    Belum ada aktivitas transaksi tercatat.
                  </div>
                ) : (
                  <div className="divide-y divide-[#CBD5E1] dark:divide-[#374151]">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <TransactionBadge type={log.type} />
                            <span className="font-mono text-xs tabular-nums text-[#334155] dark:text-[#D1D5DB]">
                              {formatShortTime(log.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 font-semibold text-sm truncate">{log.materialName}</p>
                          <p className="mt-0.5 text-xs text-[#334155] dark:text-[#D1D5DB] truncate">
                            {log.party} · {log.pic}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`font-mono text-sm font-bold tabular-nums ${
                              log.type === 'MASUK'
                                ? 'text-[#15803D] dark:text-[#4ADE80]'
                                : 'text-[#C2410C] dark:text-[#FB923C]'
                            }`}
                          >
                            {log.type === 'MASUK' ? '+' : '-'}
                            {formatNumber(log.quantity)} {log.materialUnit}
                          </p>
                          <p className="mt-0.5 font-mono text-xs tabular-nums text-[#334155] dark:text-[#D1D5DB]">
                            {formatNumber(log.stockBefore)} → {formatNumber(log.stockAfter)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        
      </div>
    </div>
  );
}