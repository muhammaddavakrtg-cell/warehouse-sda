import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import type {
  CreateMaterialInput,
  Material,
  MaterialUnit,
  UpdateMaterialInput,
} from '../types/warehouse';

interface MaterialFormModalProps {
  isOpen: boolean;
  editingMaterial: Material | null;
  onClose: () => void;
  onCreate: (input: CreateMaterialInput & {
    description?: string;
    entryDate?: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    input: UpdateMaterialInput & {
      description?: string;
      entryDate?: string;
      addedStock?: number;
    }
  ) => Promise<void>;
}

const UOM_OPTIONS: MaterialUnit[] = ['pcs', 'kg', 'roll', 'box', 'meter', 'liter', 'unit'];

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function MaterialFormModal({
  isOpen,
  editingMaterial,
  onClose,
  onCreate,
  onUpdate,
}: MaterialFormModalProps) {
  const [qcode, setQcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addedQty, setAddedQty] = useState<number>(1);
  const [entryDate, setEntryDate] = useState<string>(() => getTodayDateString());
  const [uom, setUom] = useState<MaterialUnit>('pcs');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingMaterial) {
        setQcode(editingMaterial.qcode);
        setName(editingMaterial.name);
        setDescription((editingMaterial as any).description ?? '');
        setAddedQty(0);
        setEntryDate(
          (editingMaterial as any).entryDate?.slice(0, 10) ||
            editingMaterial.createdAt?.slice(0, 10) ||
            getTodayDateString()
        );
        setUom(editingMaterial.unit);
      } else {
        setQcode('');
        setName('');
        setDescription('');
        setAddedQty(1);
        setEntryDate(getTodayDateString());
        setUom('pcs');
      }
      setErrorMsg('');
    }
  }, [isOpen, editingMaterial]);

  if (!isOpen) return null;

  const isEdit = Boolean(editingMaterial);
  const addedStockValue = Math.max(0, Number(addedQty) || 0);

  // Semua kolom wajib terisi sebelum tombol simpan/input aktif
  const isFormValid =
    qcode.trim().length > 0 &&
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    entryDate.trim().length > 0 &&
    Boolean(uom) &&
    (isEdit ? addedStockValue >= 0 : Number(addedQty) >= 1);

  const adjustAddedQty = (delta: number) => {
    setAddedQty((prev) => {
      const base = Number.isFinite(Number(prev)) ? Number(prev) : 0;
      return Math.max(isEdit ? 0 : 1, base + delta);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isFormValid) {
      setErrorMsg('Harap lengkapi semua kolom (qcode, Nama, Deskripsi, Jumlah, Tanggal, dan UoM).');
      return;
    }

    const qtyValue = Math.max(1, Number(addedQty) || 1);

    try {
      setIsSubmitting(true);
      if (editingMaterial) {
        await onUpdate(editingMaterial.id, {
          qcode: qcode.trim().toUpperCase(),
          name: name.trim(),
          category: editingMaterial.category || 'Raw Material',
          unit: uom,
          minStock: editingMaterial.minStock ?? 1,
          location: editingMaterial.location || '-',
          description: description.trim(),
          entryDate,
          addedStock: addedStockValue,
        });
      } else {
        await onCreate({
          qcode: qcode.trim().toUpperCase(),
          name: name.trim(),
          category: 'Raw Material',
          unit: uom,
          currentStock: qtyValue,
          minStock: 1,
          location: '-',
          description: description.trim(),
          entryDate,
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
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-gray-700" />
        </div>

        <div className="px-5 py-3 border-b border-[#CBD5E1] dark:border-[#374151] flex items-center justify-between gap-3">
          <h2 id="mat-modal-title" className="font-display text-base font-bold">
            {isEdit ? 'Edit Master Material / Restock' : 'Tambah Material Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* 1. qcode Material & 2. Nama Material */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="mat-qcode"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1"
              >
                qcode Material *
              </label>
              <input
                id="mat-qcode"
                type="text"
                required
                value={qcode}
                onChange={(e) => setQcode(e.target.value.toUpperCase())}
                placeholder="Contoh: QC-001"
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>

            <div>
              <label
                htmlFor="mat-name"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1"
              >
                Nama Material *
              </label>
              <input
                id="mat-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kabel NYM 3x2.5mm"
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>
          </div>

          {/* 3. Deskripsi Material */}
          <div>
            <label
              htmlFor="mat-description"
              className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1"
            >
              Deskripsi Material *
            </label>
            <textarea
              id="mat-description"
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan spesifikasi atau deskripsi material..."
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            />
          </div>

          {/* 4. Pengaturan stok */}
          {isEdit ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-[#334155] dark:text-[#D1D5DB] mb-1">
                  Stok Saat Ini
                </label>
                <div className="h-9 flex items-center justify-center rounded-lg border border-[#CBD5E1] dark:border-[#374151] bg-[#F1F5F9] dark:bg-[#090D16] font-mono text-xs font-bold tabular-nums">
                  {Number(editingMaterial?.currentStock) || 0} {uom}
                </div>
              </div>
              <div className="min-w-0">
                <label htmlFor="mat-added-qty" className="block text-[11px] font-bold text-[#334155] dark:text-[#D1D5DB] mb-1">
                  Tambah Stok *
                </label>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => adjustAddedQty(-1)} aria-label="Kurangi tambah stok" className="w-7 h-9 rounded-lg border border-[#CBD5E1] dark:border-[#374151] text-xs font-bold cursor-pointer">-</button>
                  <input
                    id="mat-added-qty"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={addedQty}
                    onChange={(e) => setAddedQty(Math.max(0, Number(e.target.value) || 0))}
                    className="min-w-0 w-full h-9 px-1 rounded-lg border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#090D16] text-center font-mono text-xs font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                  <button type="button" onClick={() => adjustAddedQty(1)} aria-label="Tambah stok" className="w-7 h-9 rounded-lg border border-[#CBD5E1] dark:border-[#374151] text-xs font-bold cursor-pointer">+</button>
                </div>
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-green-700 dark:text-green-400 mb-1">
                  Aktual Stok
                </label>
                <div className="h-9 flex items-center justify-center rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 font-mono text-xs font-bold text-green-700 dark:text-green-400 tabular-nums">
                  {(Number(editingMaterial?.currentStock) || 0) + addedStockValue} {uom}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="mat-added-qty" className="text-xs font-bold text-[#334155] dark:text-[#D1D5DB]">
                  Jumlah Material *
                </label>
                <button type="button" onClick={() => setAddedQty(1)} className="text-[11px] font-semibold text-[#15803D] dark:text-[#4ADE80] hover:underline cursor-pointer">
                  Reset ke 1
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => adjustAddedQty(-1)} aria-label="Kurangi 1" className="w-9 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-sm font-bold cursor-pointer">-</button>
                <input
                  id="mat-added-qty"
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={addedQty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAddedQty(Number.isFinite(val) ? Math.max(1, val) : 1);
                  }}
                  className="flex-1 h-9 px-3 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#090D16] text-center font-mono text-sm font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
                <button type="button" onClick={() => adjustAddedQty(1)} aria-label="Tambah 1" className="w-9 h-9 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-sm font-bold cursor-pointer">+</button>
              </div>
            </div>
          )}

          {/* 5. Tanggal Material masuk & 6. Unit of Measure (UoM) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="mat-entry-date"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1"
              >
                Tanggal Material Masuk *
              </label>
              <input
                id="mat-entry-date"
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>

            <div>
              <label
                htmlFor="mat-uom"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1"
              >
                Unit of Measure (UoM) *
              </label>
              <select
                id="mat-uom"
                required
                value={uom}
                onChange={(e) => setUom(e.target.value as MaterialUnit)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              >
                {UOM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-2.5 rounded-xl text-xs font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5] dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#991B1B]"
            >
              {errorMsg}
            </div>
          )}

          {/* Tombol Input Material (Hijau) - hanya aktif jika semua kolom terisi */}
          <div className="pt-1 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 rounded-xl text-sm font-bold border border-[#CBD5E1] dark:border-[#374151] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-[42px] px-4 rounded-xl text-sm font-bold bg-[#15803D] text-white hover:bg-green-800 dark:bg-[#16A34A] dark:text-white dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEdit
                    ? 'Simpan Perubahan'
                    : 'Input Material'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}