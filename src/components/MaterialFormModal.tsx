import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import type {
  CreateMaterialInput,
  Material,
  MaterialCategory,
  MaterialUnit,
  UpdateMaterialInput,
} from '../types/warehouse';

interface MaterialFormModalProps {
  isOpen: boolean;
  editingMaterial: Material | null;
  onClose: () => void;
  onCreate: (input: CreateMaterialInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateMaterialInput) => Promise<void>;
}

const CATEGORY_OPTIONS: MaterialCategory[] = [
  'Elektrikal',
  'Mekanikal',
  'Packaging',
  'Safety & APD',
  'Raw Material',
  'Consumable',
];

const UNIT_OPTIONS: MaterialUnit[] = ['pcs', 'kg', 'roll', 'box', 'meter', 'liter', 'unit'];

export function MaterialFormModal({
  isOpen,
  editingMaterial,
  onClose,
  onCreate,
  onUpdate,
}: MaterialFormModalProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Elektrikal');
  const [unit, setUnit] = useState<MaterialUnit>('pcs');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(10);
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingMaterial) {
        setSku(editingMaterial.sku);
        setName(editingMaterial.name);
        setCategory(editingMaterial.category);
        setUnit(editingMaterial.unit);
        setCurrentStock(editingMaterial.currentStock);
        setMinStock(editingMaterial.minStock);
        setLocation(editingMaterial.location);
      } else {
        setSku('');
        setName('');
        setCategory('Elektrikal');
        setUnit('pcs');
        setCurrentStock(0);
        setMinStock(10);
        setLocation('');
      }
      setErrorMsg('');
    }
  }, [isOpen, editingMaterial]);

  if (!isOpen) return null;

  const isEdit = Boolean(editingMaterial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!sku.trim() || !name.trim() || !location.trim()) {
      setErrorMsg('Kode SKU, Nama Material, dan Lokasi Rak wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingMaterial) {
        await onUpdate(editingMaterial.id, {
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          category,
          unit,
          minStock: Math.max(0, Number(minStock) || 0),
          location: location.trim(),
        });
      } else {
        await onCreate({
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          category,
          unit,
          currentStock: Math.max(0, Number(currentStock) || 0),
          minStock: Math.max(0, Number(minStock) || 0),
          location: location.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan data material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mat-modal-title"
    >
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] shadow-2xl overflow-hidden">
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-gray-700" />
        </div>

        <div className="px-5 py-3.5 border-b border-[#CBD5E1] dark:border-[#374151] flex items-center justify-between gap-4">
          <h2 id="mat-modal-title" className="font-display text-lg font-bold">
            {isEdit ? 'Edit Master Material' : 'Tambah Material Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="mat-sku"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                Kode / SKU *
              </label>
              <input
                id="mat-sku"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="ELK-KBL-01"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label
                htmlFor="mat-location"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                Lokasi Rak *
              </label>
              <input
                id="mat-location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Rak A1-04"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="mat-name"
              className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
            >
              Nama Material *
            </label>
            <input
              id="mat-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kabel NYM 3x2.5mm Eterna"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="mat-category"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                Kategori
              </label>
              <select
                id="mat-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="mat-unit"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                Satuan
              </label>
              <select
                id="mat-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as MaterialUnit)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="mat-stock"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                {isEdit ? 'Stok Saat Ini (Terkunci)' : 'Stok Awal'}
              </label>
              <input
                id="mat-stock"
                type="number"
                min={0}
                disabled={isEdit}
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-sm font-bold tabular-nums disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
              {isEdit && (
                <p className="mt-1 text-[11px] text-[#334155] dark:text-[#D1D5DB]">
                  Ubah stok melalui menu Stok Masuk / Keluar.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="mat-min"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                Batas Minimum (Min. Stock)
              </label>
              <input
                id="mat-min"
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl text-xs font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5] dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#991B1B]"
            >
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 rounded-xl text-sm font-bold border border-[#CBD5E1] dark:border-[#374151] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl text-sm font-bold bg-[#1D4ED8] text-white hover:bg-blue-800 dark:bg-[#3B82F6] dark:text-[#090D16] dark:hover:bg-blue-400 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
