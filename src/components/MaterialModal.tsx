import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  type Material,
  type MaterialInput,
} from '../types/warehouse';

interface MaterialModalProps {
  open: boolean;
  initialMaterial: Material | null;
  onClose: () => void;
  onSave: (input: MaterialInput, id?: string) => Promise<void>;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  open,
  initialMaterial,
  onClose,
  onSave,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(MATERIAL_CATEGORIES[0]);
  const [currentStock, setCurrentStock] = useState('0');
  const [unit, setUnit] = useState<string>(MATERIAL_UNITS[0]);
  const [minStock, setMinStock] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialMaterial) {
        setCode(initialMaterial.code);
        setName(initialMaterial.name);
        setCategory(initialMaterial.category);
        setCurrentStock(String(initialMaterial.current_stock));
        setUnit(initialMaterial.unit);
        setMinStock(String(initialMaterial.min_stock));
      } else {
        setCode('');
        setName('');
        setCategory(MATERIAL_CATEGORIES[0]);
        setCurrentStock('0');
        setUnit(MATERIAL_UNITS[0]);
        setMinStock('10');
      }
      setError(null);
    }
  }, [open, initialMaterial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const stockNum = Number(currentStock);
    const minNum = Number(minStock);

    if (!code.trim() || !name.trim()) {
      setError('Kode barang dan nama material wajib diisi.');
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0 || Number.isNaN(minNum) || minNum < 0) {
      setError('Stok saat ini dan batas minimum tidak boleh bernilai negatif.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          category,
          current_stock: Math.floor(stockNum),
          unit,
          min_stock: Math.floor(minNum),
        },
        initialMaterial?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data material.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-modal-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl bg-white border border-slate-200 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 id="material-modal-title" className="text-lg font-semibold text-slate-900">
              {initialMaterial ? 'Ubah Data Material' : 'Tambah Material Baru'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Lengkapi master data SKU gudang beserta batas minimum peringatan stok.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mat-code" className="block text-xs font-medium text-slate-700 mb-1.5">
                Kode Barang (SKU)
              </label>
              <input
                id="mat-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MAT-AL-001"
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="mat-category" className="block text-xs font-medium text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                id="mat-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {MATERIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mat-name" className="block text-xs font-medium text-slate-700 mb-1.5">
              Nama Material
            </label>
            <input
              id="mat-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Plat Aluminium 6061 (2mm)"
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="mat-stock" className="block text-xs font-medium text-slate-700 mb-1.5">
                Stok Saat Ini
              </label>
              <input
                id="mat-stock"
                type="number"
                min={0}
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="mat-unit" className="block text-xs font-medium text-slate-700 mb-1.5">
                Satuan
              </label>
              <select
                id="mat-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {MATERIAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mat-min" className="block text-xs font-medium text-slate-700 mb-1.5">
                Batas Minimum
              </label>
              <input
                id="mat-min"
                type="number"
                min={0}
                required
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : initialMaterial ? 'Simpan Perubahan' : 'Simpan Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
