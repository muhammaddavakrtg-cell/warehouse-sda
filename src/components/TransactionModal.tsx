import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import type { Material, TransactionInput, TransactionType } from '../types/warehouse';

interface TransactionModalProps {
  open: boolean;
  materials: Material[];
  defaultMaterialId?: string;
  defaultType?: TransactionType;
  onClose: () => void;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  materials,
  defaultMaterialId,
  defaultType = 'inbound',
  onClose,
  onSubmit,
}) => {
  const [materialId, setMaterialId] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [quantity, setQuantity] = useState('1');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMaterialId(defaultMaterialId || materials[0]?.id || '');
      setType(defaultType);
      setQuantity('1');
      setReferenceNo('');
      setNotes('');
      setError(null);
    }
  }, [open, defaultMaterialId, defaultType, materials]);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === materialId) || null,
    [materials, materialId]
  );

  const qtyNum = Math.max(0, Math.floor(Number(quantity) || 0));
  const projectedStock = selectedMaterial
    ? type === 'inbound'
      ? selectedMaterial.current_stock + qtyNum
      : selectedMaterial.current_stock - qtyNum
    : 0;

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMaterial) {
      setError('Pilih material terlebih dahulu.');
      return;
    }
    if (qtyNum <= 0) {
      setError('Jumlah transaksi harus lebih dari 0.');
      return;
    }
    if (type === 'outbound' && qtyNum > selectedMaterial.current_stock) {
      setError(
        `Stok tidak mencukupi. Tersedia ${selectedMaterial.current_stock} ${selectedMaterial.unit}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        material_id: selectedMaterial.id,
        type,
        quantity: qtyNum,
        reference_no: referenceNo.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl bg-white border border-slate-200 p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 id="tx-modal-title" className="text-lg font-semibold text-slate-900">
              Catat Transaksi Stok
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Stok material di database akan langsung diperbarui secara real-time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Tutup modal transaksi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Segmented Inbound / Outbound selector */}
          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">Jenis Transaksi</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('inbound')}
                className={`min-h-[42px] rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  type === 'inbound'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-teal-700" />
                <span>Barang Masuk (Inbound)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('outbound')}
                className={`min-h-[42px] rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  type === 'outbound'
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-amber-700" />
                <span>Barang Keluar (Outbound)</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="tx-material" className="block text-xs font-medium text-slate-700 mb-1.5">
              Pilih Material
            </label>
            <select
              id="tx-material"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              disabled={materials.length === 0}
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {materials.length === 0 ? (
                <option value="">Belum ada master material</option>
              ) : (
                materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name} (Stok: {m.current_stock} {m.unit})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-qty" className="block text-xs font-medium text-slate-700 mb-1.5">
                Jumlah ({selectedMaterial?.unit || 'Unit'})
              </label>
              <input
                id="tx-qty"
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-mono tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tx-ref" className="block text-xs font-medium text-slate-700 mb-1.5">
                No. Referensi (SJ / PO / WO)
              </label>
              <input
                id="tx-ref"
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder={type === 'inbound' ? 'SJ-2026-0920' : 'WO-PROD-510'}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {selectedMaterial && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-xs tabular-nums">
              <span className="text-slate-600">Proyeksi perubahan stok</span>
              <div className="flex items-center gap-2 font-mono font-medium">
                <span className="text-slate-500">
                  {selectedMaterial.current_stock.toLocaleString('id-ID')}
                </span>
                <span className="text-slate-400" aria-hidden="true">→</span>
                <span
                  className={
                    projectedStock < 0
                      ? 'text-red-700 font-semibold'
                      : projectedStock < selectedMaterial.min_stock
                      ? 'text-amber-700 font-semibold'
                      : 'text-slate-900 font-semibold'
                  }
                >
                  {projectedStock.toLocaleString('id-ID')} {selectedMaterial.unit}
                </span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="tx-notes" className="block text-xs font-medium text-slate-700 mb-1.5">
              Catatan Operasional (Opsional)
            </label>
            <textarea
              id="tx-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Penerimaan vendor atau pengambilan untuk lini perakitan"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
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
              disabled={submitting || !selectedMaterial}
              className="min-h-[44px] rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
            >
              {submitting
                ? 'Memproses...'
                : type === 'inbound'
                ? 'Simpan Barang Masuk'
                : 'Simpan Barang Keluar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
