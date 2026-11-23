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
  onSubmit: (payload: StockTransactionInput & {
    transactionDate?: string;
    description?: string;
  }) => Promise<void>;
}

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
  const [usageArea, setUsageArea] = useState('');
  const [transactionDate, setTransactionDate] = useState<string>(() => getTodayDateString());
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === materialId) || null,
    [materials, materialId]
  );

  useEffect(() => {
    if (isOpen) {
      const targetMat =
        materials.find((m) => m.id === initialMaterialId) || materials[0] || null;
      setType(initialType);
      setMaterialId(targetMat?.id || '');
      setMaterialSearch('');
      setQuantity(1);
      setParty('');
      setUsageArea('');
      setTransactionDate(getTodayDateString());
      setDescription((targetMat as any)?.description ?? '');
      setErrorMsg('');
    }
  }, [isOpen, initialType, initialMaterialId, materials]);

  useEffect(() => {
    if (!isOpen) return;
    if (type === 'KELUAR') {
      setDescription((selectedMaterial as any)?.description ?? '');
    }
  }, [isOpen, type, selectedMaterial]);

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

  if (!isOpen) return null;

  const unitLabel = selectedMaterial?.unit ?? 'unit';
  const rawQty = Number(quantity);
  const safeQty = Number.isFinite(rawQty) && rawQty >= 1 ? rawQty : 1;
  const currentStock = selectedMaterial ? Number(selectedMaterial.currentStock ?? 0) : 0;

  // Nilai aktual hasil penambahan (MASUK) atau pengurangan (KELUAR) dari stok saat ini dan jumlah
  const actualStockValue =
    type === 'MASUK' ? currentStock + safeQty : currentStock - safeQty;

  const isNegativeStock = selectedMaterial !== null && type === 'KELUAR' && actualStockValue < 0;
  const isInvalidQty = !Number.isFinite(rawQty) || rawQty < 1;

  const stockStatusNote =
    actualStockValue === 1
      ? { text: 'Perlu restock', className: 'text-[#B45309] dark:text-[#FBBF24]' }
      : actualStockValue > 1
        ? { text: 'Stok aman', className: 'text-[#15803D] dark:text-[#4ADE80]' }
        : { text: 'Stok habis', className: 'text-[#B91C1C] dark:text-[#F87171]' };

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => {
      const currentVal = Number.isFinite(Number(prev)) ? Number(prev) : 1;
      const next = currentVal + delta;
      if (type === 'KELUAR' && selectedMaterial) {
        const maxTake = Math.max(1, Number(selectedMaterial.currentStock ?? 0));
        return Math.min(maxTake, Math.max(1, next));
      }
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
      setErrorMsg('Jumlah minimum adalah 1.');
      return;
    }
    if (isNegativeStock) {
      setErrorMsg(
        `Stok tidak mencukupi. Tersedia ${currentStock} ${selectedMaterial.unit}.`
      );
      return;
    }
    if (type === 'KELUAR' && !party.trim()) {
      setErrorMsg('Nama pengambil wajib diisi.');
      return;
    }
    if (type === 'KELUAR' && !usageArea.trim()) {
      setErrorMsg('Area penggunaan wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        materialId: selectedMaterial.id,
        type,
        quantity: safeQty,
        party: type === 'MASUK' ? 'Stok Masuk' : party.trim(),
        pic: type === 'KELUAR' ? usageArea.trim() : 'Gudang',
        notes: description.trim(),
        transactionDate,
        description: description.trim(),
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
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] shadow-2xl overflow-hidden">
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-gray-700" />
        </div>

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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
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
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#374151] text-xs">
                <span className="inline-flex items-center gap-1 font-mono text-[#334155] dark:text-[#D1D5DB]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {selectedMaterial.location}
                </span>
                <span className="font-mono font-bold tabular-nums">
                  Stok Saat Ini: {formatNumber(currentStock)} {unitLabel}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            {/* Kiri: Stok Saat Ini (tetap tidak bisa diklik) */}
            <div>
              <label
                htmlFor="tx-current-stock"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                Stok Saat Ini
              </label>
              <input
                id="tx-current-stock"
                type="text"
                disabled
                readOnly
                tabIndex={-1}
                value={`${formatNumber(currentStock)} ${unitLabel}`}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-slate-100 dark:bg-gray-800/80 text-center font-mono text-sm font-bold tabular-nums opacity-75 cursor-not-allowed select-none pointer-events-none"
              />
            </div>

            {/* Tengah: Stok yang Akan Masuk / Diambil */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="tx-qty"
                  className="text-xs font-bold text-[#334155] dark:text-[#D1D5DB]"
                >
                  {type === 'MASUK'
                    ? `Stok yang Akan Masuk (${unitLabel})`
                    : `Stok yang Akan Diambil (${unitLabel})`}
                </label>
                <button
                  type="button"
                  onClick={() => setQuantity(1)}
                  className="text-[11px] font-semibold text-[#1D4ED8] dark:text-[#3B82F6] hover:underline cursor-pointer"
                >
                  Min 1
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustQuantity(-1)}
                  aria-label="Kurangi 1"
                  className="w-10 min-h-[44px] rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-base font-bold hover:bg-slate-200 dark:hover:bg-gray-800 cursor-pointer shrink-0"
                >
                  -
                </button>
                <input
                  id="tx-qty"
                  type="number"
                  min={1}
                  max={type === 'KELUAR' && selectedMaterial ? Math.max(1, currentStock) : undefined}
                  step="any"
                  value={quantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) {
                      setQuantity(1);
                      return;
                    }
                    if (type === 'KELUAR' && selectedMaterial) {
                      setQuantity(Math.min(Math.max(1, currentStock), Math.max(1, val)));
                    } else {
                      setQuantity(Math.max(1, val));
                    }
                  }}
                  className="w-full min-w-0 min-h-[44px] px-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#090D16] text-center font-mono text-base font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
                />
                <button
                  type="button"
                  onClick={() => adjustQuantity(1)}
                  aria-label="Tambah 1"
                  className="w-10 min-h-[44px] rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] font-mono text-base font-bold hover:bg-slate-200 dark:hover:bg-gray-800 cursor-pointer shrink-0"
                >
                  +
                </button>
              </div>

              <p className={`mt-1 text-[11px] font-semibold ${stockStatusNote.className}`}>
                {stockStatusNote.text}
              </p>
            </div>

            {/* Kanan: Nilai aktual penambahan / pengurangan dari stok saat ini dan jumlah */}
            <div>
              <label
                htmlFor="tx-actual-result"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                {type === 'MASUK' ? 'Total Stok Aktual' : 'Sisa Stok Aktual'}
              </label>
              <input
                id="tx-actual-result"
                type="text"
                disabled
                readOnly
                tabIndex={-1}
                value={`${formatNumber(actualStockValue)} ${unitLabel}`}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-slate-100 dark:bg-gray-800/80 text-center font-mono text-sm font-extrabold tabular-nums opacity-90 cursor-not-allowed select-none pointer-events-none"
              />
            </div>
          </div>

          {selectedMaterial && isNegativeStock && (
            <div
              role="alert"
              className="p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#991B1B]"
            >
              <span className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Stok Tidak Cukup!</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                Tersedia {formatNumber(currentStock)} {unitLabel}
              </span>
            </div>
          )}

          {type === 'MASUK' ? (
            <div>
              <label
                htmlFor="tx-date-in"
                className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
              >
                Tanggal Material Masuk *
              </label>
              <input
                id="tx-date-in"
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="tx-taker-name"
                  className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
                >
                  Nama Pengambil *
                </label>
                <input
                  id="tx-taker-name"
                  type="text"
                  required
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  placeholder="Contoh: Dava"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label
                  htmlFor="tx-usage-area"
                  className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
                >
                  Area Penggunaan *
                </label>
                <input
                  id="tx-usage-area"
                  type="text"
                  required
                  value={usageArea}
                  onChange={(e) => setUsageArea(e.target.value)}
                  placeholder="Contoh: SDM / SDA"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label
                  htmlFor="tx-date-out"
                  className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
                >
                  Tanggal Material Keluar *
                </label>
                <input
                  id="tx-date-out"
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="tx-description"
              className="block text-xs font-bold text-[#334155] dark:text-[#D1D5DB] mb-1.5"
            >
              Deskripsi Material
            </label>
            <textarea
              id="tx-description"
              rows={2}
              value={description}
              readOnly={type === 'KELUAR'}
              onChange={(e) => {
                if (type === 'MASUK') setDescription(e.target.value);
              }}
              placeholder={
                type === 'MASUK'
                  ? 'Masukkan spesifikasi atau deskripsi material...'
                  : 'Deskripsi material otomatis tampil sesuai material terpilih'
              }
              className={`w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] text-sm focus:outline-none ${
                type === 'KELUAR'
                  ? 'bg-slate-100 dark:bg-gray-800/80 text-[#334155] dark:text-[#D1D5DB] cursor-default'
                  : 'bg-[#F8FAFC] dark:bg-[#090D16] focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]'
              }`}
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