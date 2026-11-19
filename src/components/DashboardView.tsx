import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';
import type { Material, MaterialTransaction } from '../types/warehouse';
import { TransactionChart } from './TransactionChart';

interface DashboardViewProps {
  materials: Material[];
  transactions: MaterialTransaction[];
  onQuickRestock: (materialId: string) => void;
  onNavigate: (tab: 'dashboard' | 'materials' | 'transactions') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  materials,
  transactions,
  onQuickRestock,
  onNavigate,
}) => {
  const stats = useMemo(() => {
    const totalTypes = materials.length;
    const totalStock = materials.reduce((sum, m) => sum + m.current_stock, 0);
    const categoriesCount = new Set(materials.map((m) => m.category)).size;
    const lowStockItems = materials
      .filter((m) => m.current_stock < m.min_stock)
      .sort((a, b) => a.current_stock - a.min_stock - (b.current_stock - b.min_stock));

    const todayStr = new Date().toDateString();
    const todayTx = transactions.filter((t) => new Date(t.created_at).toDateString() === todayStr);
    const todayInbound = todayTx.filter((t) => t.type === 'inbound').length;
    const todayOutbound = todayTx.filter((t) => t.type === 'outbound').length;

    return {
      totalTypes,
      totalStock,
      categoriesCount,
      lowStockItems,
      todayCount: todayTx.length,
      todayInbound,
      todayOutbound,
    };
  }, [materials, transactions]);

  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Jenis Material</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {stats.totalTypes.toLocaleString('id-ID')}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Tersebar di {stats.categoriesCount} kategori aktif
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Stok Gudang</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {stats.totalStock.toLocaleString('id-ID')}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">Akumulasi seluruh unit tersedia</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Stok Di Bawah Batas Min</p>
          <p
            className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${
              stats.lowStockItems.length > 0 ? 'text-red-700' : 'text-teal-700'
            }`}
          >
            {stats.lowStockItems.length.toLocaleString('id-ID')}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {stats.lowStockItems.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Perlu pengisian ulang
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Semua material aman
              </span>
            )}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Transaksi Hari Ini</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {stats.todayCount.toLocaleString('id-ID')}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {stats.todayInbound} masuk · {stats.todayOutbound} keluar
          </p>
        </div>
      </div>

      {/* Main Analytics + Low Stock Alert Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <TransactionChart transactions={transactions} />
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Peringatan Stok Menipis</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Material dengan stok saat ini di bawah batas minimum
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('materials')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Kelola</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.lowStockItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <PackageCheck className="w-10 h-10 text-teal-700 mb-3" />
              <p className="text-sm font-medium text-slate-900">Tidak ada peringatan stok</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Seluruh material saat ini memenuhi atau melebihi ambang batas minimum.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 flex-1">
              {stats.lowStockItems.slice(0, 6).map((item) => {
                const deficit = item.min_stock - item.current_stock;
                return (
                  <li
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 tabular-nums">
                        <span className="font-mono">{item.code}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-red-700 font-medium font-mono">
                          {item.current_stock} / {item.min_stock} {item.unit}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Kurang {deficit}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onQuickRestock(item.id)}
                      className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + Restock
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Mutasi Stok Terbaru</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Riwayat pencatatan barang masuk dan keluar secara real-time
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Semua Transaksi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Belum ada transaksi tercatat. Mulai dengan mencatat transaksi barang masuk atau keluar.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === 'inbound'
                        ? 'bg-teal-50 text-teal-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {tx.type === 'inbound' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {tx.material_name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 truncate tabular-nums">
                      <span className="font-mono">{tx.material_code}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{tx.reference_no || '-'}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {new Date(tx.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 tabular-nums">
                  <p
                    className={`text-sm font-semibold font-mono ${
                      tx.type === 'inbound' ? 'text-teal-700' : 'text-amber-700'
                    }`}
                  >
                    {tx.type === 'inbound' ? '+' : '-'}
                    {tx.quantity.toLocaleString('id-ID')} {tx.unit}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Stok: {tx.stock_before} → {tx.stock_after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
