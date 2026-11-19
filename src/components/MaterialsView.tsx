import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { MATERIAL_CATEGORIES, type Material } from '../types/warehouse';

interface MaterialsViewProps {
  materials: Material[];
  onAddMaterial: () => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => Promise<void>;
  onOpenTransaction: (materialId: string) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onOpenTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials.filter((m) => {
      const matchesQuery =
        !q ||
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      const isLow = m.current_stock < m.min_stock;
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'low' ? isLow : !isLow);
      return matchesQuery && matchesCat && matchesStatus;
    });
  }, [materials, search, categoryFilter, statusFilter]);

  const handleExportCSV = () => {
    const headers = ['Kode Barang', 'Nama Material', 'Kategori', 'Stok Saat Ini', 'Satuan', 'Batas Minimum'];
    const rows = filtered.map((m) => [
      m.code,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.category}"`,
      String(m.current_stock),
      m.unit,
      String(m.min_stock),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `master-material-gudangku-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDeleteMaterial(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama material..."
              className="w-full min-h-[42px] rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter kategori material"
            className="min-h-[42px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            {MATERIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'low', label: 'Menipis' },
                { id: 'ok', label: 'Aman' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatusFilter(opt.id)}
                className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="min-h-[42px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={onAddMaterial}
            className="min-h-[42px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Material</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-slate-900">Tidak ada material ditemukan</p>
          <p className="mt-1 text-xs text-slate-500">
            {materials.length === 0
              ? 'Mulai dengan menambahkan data master material pertama Anda.'
              : 'Coba ubah kata kunci pencarian atau filter kategori.'}
          </p>
          {materials.length === 0 && (
            <button
              type="button"
              onClick={onAddMaterial}
              className="mt-4 min-h-[42px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Material Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop High-Density Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
                    <th className="py-3 px-4">Kode Barang</th>
                    <th className="py-3 px-4">Nama Material</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Stok Saat Ini</th>
                    <th className="py-3 px-4 text-right">Batas Min</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.map((item) => {
                    const isLow = item.current_stock < item.min_stock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
                          {item.code}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {item.current_stock.toLocaleString('id-ID')}{' '}
                          <span className="font-sans font-normal text-xs text-slate-500">
                            {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                          {item.min_stock.toLocaleString('id-ID')} {item.unit}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Stok Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Stok Aman
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenTransaction(item.id)}
                              title="Catat Masuk / Keluar"
                              className="min-h-[34px] px-2.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>Mutasi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditMaterial(item)}
                              aria-label={`Ubah ${item.name}`}
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              aria-label={`Hapus ${item.name}`}
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Mobile Ergonomic Tap List */}
          <div className="md:hidden bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {filtered.map((item) => {
              const isLow = item.current_stock < item.min_stock;
              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <span className="font-mono">{item.code}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.category}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <p className="text-base font-bold font-mono text-slate-900">
                        {item.current_stock.toLocaleString('id-ID')} {item.unit}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        Min: {item.min_stock.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Stok Menipis
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Stok Aman
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenTransaction(item.id)}
                        className="min-h-[44px] px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                      >
                        Mutasi
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditMaterial(item)}
                        aria-label={`Ubah ${item.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Hapus ${item.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white border border-slate-200 p-6 shadow-xl">
            <h3 id="delete-modal-title" className="text-base font-semibold text-slate-900">
              Hapus Material?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Material <strong className="font-semibold text-slate-900">{deleteTarget.name}</strong> (
              <span className="font-mono text-xs">{deleteTarget.code}</span>) beserta riwayat mutasinya akan dihapus permanen.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
