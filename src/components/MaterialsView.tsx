import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Edit3,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type {
  Material,
  MaterialCategory,
  StockStatus,
  TransactionType,
} from '../types/warehouse';
import { formatNumber, getStockStatus, sortMaterialsByUrgency } from '../utils/warehouse';
import { StockStatusBadge } from './StatusBadge';

interface MaterialsViewProps {
  materials: Material[];
  statusFilter: StockStatus | 'ALL';
  onStatusFilterChange: (status: StockStatus | 'ALL') => void;
  onAddMaterial: () => void;
  onEditMaterial: (material: Material) => void;
  onQuickTransaction: (type: TransactionType, materialId: string) => void;
}

const CATEGORIES: ('ALL' | MaterialCategory)[] = [
  'ALL',
  'Elektrikal',
  'Mekanikal',
  'Packaging',
  'Safety & APD',
  'Raw Material',
  'Consumable',
];

const STATUS_TABS: { id: StockStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'AMAN', label: 'Stok Aman' },
  { id: 'MENIPIS', label: 'Menipis' },
  { id: 'HABIS', label: 'Habis' },
];

export function MaterialsView({
  materials,
  statusFilter,
  onStatusFilterChange,
  onAddMaterial,
  onEditMaterial,
  onQuickTransaction,
}: MaterialsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MaterialCategory>('ALL');

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = materials.filter((item) => {
      const status = getStockStatus(item.currentStock, item.minStock);
      if (statusFilter !== 'ALL' && status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (q) {
        const match =
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
    return sortMaterialsByUrgency(list);
  }, [materials, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Toolbar: Search, Category, Status & Add Button */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#334155] dark:text-[#D1D5DB] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU, nama material, atau lokasi rak..."
              aria-label="Cari material"
              className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm text-[#0F172A] dark:text-[#F9FAFB] placeholder:text-slate-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-200 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | MaterialCategory)}
            aria-label="Filter kategori material"
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm font-medium text-[#0F172A] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </option>
            ))}
          </select>

          {/* Add Material CTA */}
          <button
            type="button"
            onClick={onAddMaterial}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold bg-[#1D4ED8] text-white hover:bg-blue-800 dark:bg-[#3B82F6] dark:text-[#090D16] dark:hover:bg-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Tambah Material</span>
          </button>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Filter status stok"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#374151]"
          >
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => onStatusFilterChange(tab.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16]'
                      : 'text-[#334155] dark:text-[#D1D5DB] hover:text-[#0F172A] dark:hover:text-[#F9FAFB]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs font-medium text-[#334155] dark:text-[#D1D5DB] tabular-nums">
            Menampilkan <strong className="text-[#0F172A] dark:text-[#F9FAFB]">{filteredMaterials.length}</strong> dari{' '}
            {materials.length} material
          </p>
        </div>
      </div>

      {/* Empty State */}
      {filteredMaterials.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-gray-800 text-[#334155] dark:text-[#D1D5DB] flex items-center justify-center">
            <Boxes className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="mt-3 font-display font-bold text-base">Material Tidak Ditemukan</p>
          <p className="mt-1 text-sm text-[#334155] dark:text-[#D1D5DB]">
            Coba ubah kata kunci pencarian atau reset filter kategori dan status stok.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
              onStatusFilterChange('ALL');
            }}
            className="mt-4 inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold border border-[#CBD5E1] dark:border-[#374151] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (Zero Horizontal Scroll) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredMaterials.map((item) => {
              const status = getStockStatus(item.currentStock, item.minStock);
              return (
                <article
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-[#334155] dark:text-[#D1D5DB] flex-wrap">
                        <span className="font-mono font-semibold">{item.sku}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3" aria-hidden="true" />
                          {item.location}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display font-bold text-base leading-snug">
                        {item.name}
                      </h3>
                    </div>
                    <StockStatusBadge status={status} />
                  </div>

                  <div className="flex items-baseline justify-between py-2.5 px-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#374151]">
                    <div>
                      <span className="text-xs text-[#334155] dark:text-[#D1D5DB]">Stok Saat Ini</span>
                      <p className="text-xl font-display font-extrabold tabular-nums">
                        {formatNumber(item.currentStock)}{' '}
                        <span className="text-sm font-semibold text-[#334155] dark:text-[#D1D5DB]">
                          {item.unit}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#334155] dark:text-[#D1D5DB]">Batas Min.</span>
                      <p className="text-sm font-mono font-bold tabular-nums">
                        {formatNumber(item.minStock)} {item.unit}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onQuickTransaction('MASUK', item.id)}
                      className="inline-flex items-center justify-center gap-1 min-h-[44px] px-2 rounded-xl text-xs font-bold border border-[#86EFAC] bg-[#DCFCE7] text-[#15803D] dark:border-[#166534] dark:bg-[#14532D] dark:text-[#4ADE80] cursor-pointer"
                    >
                      <ArrowDownLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Masuk</span>
                    </button>
                    <button
                      type="button"
                      disabled={item.currentStock <= 0}
                      onClick={() => onQuickTransaction('KELUAR', item.id)}
                      className="inline-flex items-center justify-center gap-1 min-h-[44px] px-2 rounded-xl text-xs font-bold border border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C] dark:border-[#9A3412] dark:bg-[#431407] dark:text-[#FB923C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Keluar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditMaterial(item)}
                      className="inline-flex items-center justify-center gap-1 min-h-[44px] px-2 rounded-xl text-xs font-bold border border-[#CBD5E1] dark:border-[#374151] text-[#0F172A] dark:text-[#F9FAFB] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop Interactive Data Table */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-xs font-bold text-[#334155] dark:text-[#D1D5DB]">
                    <th className="py-3.5 px-4 whitespace-nowrap">SKU</th>
                    <th className="py-3.5 px-4">Material & Kategori</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Lokasi Rak</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Stok Saat Ini</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Min. Stok</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1] dark:divide-[#374151] text-sm">
                  {filteredMaterials.map((item) => {
                    const status = getStockStatus(item.currentStock, item.minStock);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold whitespace-nowrap">
                          {item.sku}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#334155] dark:text-[#D1D5DB]">
                            {item.category} · Satuan {item.unit}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap text-[#334155] dark:text-[#D1D5DB]">
                          {item.location}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                          {formatNumber(item.currentStock)}{' '}
                          <span className="text-xs font-normal text-[#334155] dark:text-[#D1D5DB]">
                            {item.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap text-[#334155] dark:text-[#D1D5DB]">
                          {formatNumber(item.minStock)} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StockStatusBadge status={status} />
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onQuickTransaction('MASUK', item.id)}
                              title="Catat Stok Masuk"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#86EFAC] bg-[#DCFCE7] text-[#15803D] hover:brightness-95 dark:border-[#166534] dark:bg-[#14532D] dark:text-[#4ADE80] cursor-pointer"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Masuk</span>
                            </button>
                            <button
                              type="button"
                              disabled={item.currentStock <= 0}
                              onClick={() => onQuickTransaction('KELUAR', item.id)}
                              title="Catat Stok Keluar"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C] hover:brightness-95 dark:border-[#9A3412] dark:bg-[#431407] dark:text-[#FB923C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Keluar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditMaterial(item)}
                              aria-label={`Edit ${item.name}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#CBD5E1] dark:border-[#374151] text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-[#0F172A] dark:hover:text-[#F9FAFB] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
