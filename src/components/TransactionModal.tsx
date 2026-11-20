import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import type { Material, StockTransactionInput, TransactionType } from '../types/warehouse';
import { formatNumber } from '../utils/warehouse';

interface TransactionModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  initialMaterialId?: string;
  materials: Material[];
  onClose: () => void;
  onSubmit: (payload: StockTransactionInput) => Promise<void>;
}

export function TransactionModal({
  isOpen,
  initialType,
  initialMaterialId,
  materials,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [materialId, setMaterialId] = useState<string>(initialMaterialId || '');
  const [materialSearch, setMaterialSearch] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [party, setParty] = useState('');
  const [pic, setPic] = useState('Staf Gudang');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setMaterialId(initialMaterialId || materials[0]?.id || '');
      setMaterialSearch('');
      setQuantity(1);
      setParty('');
      setPic('Staf Gudang');
      setNotes('');
      setErrorMsg('');
    }
  }, [isOpen, initialType, initialMaterialId, materials]);

  const filteredMaterials = useMemo(() => {
    const q = materialSearch.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q)
    );
  }, [materials, materialSearch]);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === materialId) || null,
    [materials, materialId]
  );

  if (!isOpen) return null;

  const projectedStock = selectedMaterial
    ? type === 'MASUK'
      ? selectedMaterial.currentStock + quantity
      : selectedMaterial.currentStock - quantity
    : 0;

  const isNegativeStock = selectedMaterial !== null && type === 'KELUAR' && projectedStock < 0;
  const isInvalidQty = !Number.isFinite(quantity) || quantity <= 0;

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => {
      const next = (Number.isFinite(prev) ? prev : 0) + delta;
      return Math.max(1, next);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedMaterial) {
      setErrorMsg('Pilih material terlebih dahulu.');
      return;
    }
    if (isInvalidQty) {
      setErrorMsg('Jumlah harus lebih besar dari 0.');
      return;
    }
    if (isNegativeStock) {
      setErrorMsg(
        `Stok tidak mencukupi. Tersedia ${selectedMaterial.currentStock} ${selectedMaterial.unit}.`
      );
      return;
    }
    if (!party.trim()) {
      setErrorMsg(
        type === 'MASUK' ? 'Sumber / Supplier wajib diisi.' : 'Pemohon / Proyek wajib diisi.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        materialId: selectedMaterial.id,
        type,
        quantity,
        party: party.trim(),
        pic: pic.trim() || 'Staf Gudang',
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses transaksi stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] shadow-2xl overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#CBD5E1] dark:border-[#374151] flex items-center justify-between gap-4">
          <h2 id="tx-modal-title" className="font-display text-lg font-bold">
            Catat Pergerakan Stok
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Segmented Type Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#374151]">
            <button
              type="button"
              onClick={() => setType('MASUK')}
              className={`flex items-center justify-center gap-2 min-h-[44px] rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                type === 'MASUK'
                  ? 'bg-[#15803D] text-white dark:bg-[#4ADE80] dark:text-[#090D16]'
                  : 'text-[#334155] dark:text-[#D1D5DB] hover:text-[#0F172A] dark:hover:text-[#F9FAFB]'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Stok Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => setType('KELUAR')}
              className={`flex items-center justify-center gap-2 min-h-[44px] rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                type === 'KELUAR'
                  ? 'bg-[#C2410C] text-white dark:bg-[#FB923C] dark:text-[#090D16]'
                  : 'text-[#334155] dark:text-[#D1D5DB] hover:text-[#0F172A] dark:hover:text-[#F9FAFB]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Stok Keluar</span>
            </button>
          </div>

          {/* Fast Material Search + Selector */}
          <div className="space-y-2">
            <label
              htmlFor="tx-material-select"
              className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB]"
            >
              Pilih Material
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#334155] dark:text-[#D1D5DB] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setMaterialSearch(val);
                  const firstMatch = materials.find(
                    (m) =>
                      m.name.toLowerCase().includes(val.toLowerCase()) ||
                      m.sku.toLowerCase().includes(val.toLowerCase())
                  );
                  if (firstMatch) setMaterialId(firstMatch.id);
                }}
                placeholder="Ketik SKU atau nama material untuk cari cepat..."
                className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
            </div>

            <select
              id="tx-material-select"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
            >
              {filteredMaterials.length === 0 ? (
                <option value="">Tidak ada material yang cocok</option>
              ) : (
                filteredMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.sku}] {m.name} (Stok: {m.currentStock} {m.unit})
                  </option>
                ))
              )}
            </select>

            {selectedMaterial && (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#374151] text-xs">
                <span className="inline-flex items-center gap-1 font-mono text-[#334155] dark:text-[#D1D5DB]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {selectedMaterial.location}
                </span>
                <span className="font-mono font-bold tabular-nums">
                  Stok Saat Ini: {formatNumber(selectedMaterial.currentStock)}{' '}
                  {selectedMaterial.unit}
                </span>
              </div>
            )}
          </div>

          {/* Quantity + Quick Increment Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="tx-qty"
                className="text-xs font-bold text-[#334155] dark:text-[#D1D5DB]"
              >
                Jumlah ({selectedMaterial?.unit ?? 'unit'})
              </label>
              <button
                type="button"
                onClick={() => setQuantity(1)}
                className="text-xs font-semibold text-[#1D4ED8] dark:text-[#3B82F6] hover:underline cursor-pointer"
              >
                Reset ke 1
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustQuantity(-1)}
                aria-label="Kurangi 1"
                className="min-w-[48px] min-h-[48px] rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-lg font-bold hover:bg-slate-200 dark:hover:bg-gray-800 cursor-pointer"
              >
                -1
              </button>
              <input
                id="tx-qty"
                type="number"
                min={1}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="flex-1 min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#090D16] text-center font-mono text-xl font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
              <button
                type="button"
                onClick={() => adjustQuantity(1)}
                aria-label="Tambah 1"
                className="min-w-[48px] min-h-[48px] rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-lg font-bold hover:bg-slate-200 dark:hover:bg-gray-800 cursor-pointer"
              >
                +1
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 5, 10].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => adjustQuantity(inc)}
                  className="min-h-[44px] rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-sm font-bold hover:border-[#1D4ED8] dark:hover:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>

          {/* Live Stock Projection & Negative Stock Validation */}
          {selectedMaterial && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${
                isNegativeStock
                  ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#991B1B]'
                  : 'bg-[#F8FAFC] text-[#0F172A] border-[#CBD5E1] dark:bg-[#090D16] dark:text-[#F9FAFB] dark:border-[#374151]'
              }`}
            >
              <span className="font-semibold flex items-center gap-1.5">
                {isNegativeStock && <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />}
                <span>{isNegativeStock ? 'Stok Tidak Cukup!' : 'Proyeksi Stok Akhir'}</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {formatNumber(selectedMaterial.currentStock)} → {formatNumber(projectedStock)}{' '}
                {selectedMaterial.unit}
              </span>
            </div>
          )}

          {/* Contextual Party & PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-party"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                {type === 'MASUK' ? 'Sumber / Supplier *' : 'Pemohon / Proyek *'}
              </label>
              <input
                id="tx-party"
                type="text"
                required
                value={party}
                onChange={(e) => setParty(e.target.value)}
                placeholder={type === 'MASUK' ? 'Contoh: PT Sinar Baja' : 'Contoh: Tim Maintenance'}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label
                htmlFor="tx-pic"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                Penanggung Jawab (PIC)
              </label>
              <input
                id="tx-pic"
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="Nama staf gudang"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-notes"
              className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
            >
              Catatan / No. Surat Jalan (Opsional)
            </label>
            <textarea
              id="tx-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: PO #2026-881 atau kebutuhan perbaikan jalur A"
              className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl text-xs font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5] dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#991B1B]"
            >
              {errorMsg}
            </div>
          )}

          {/* Footer Submit */}
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
              disabled={isSubmitting || isNegativeStock || isInvalidQty || !selectedMaterial}
              className={`flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                type === 'MASUK'
                  ? 'bg-[#15803D] text-white hover:bg-green-800 dark:bg-[#4ADE80] dark:text-[#090D16] dark:hover:bg-green-300'
                  : 'bg-[#C2410C] text-white hover:bg-orange-800 dark:bg-[#FB923C] dark:text-[#090D16] dark:hover:bg-orange-300'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : type === 'MASUK'
                    ? 'Simpan Stok Masuk'
                    : 'Simpan Stok Keluar'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
