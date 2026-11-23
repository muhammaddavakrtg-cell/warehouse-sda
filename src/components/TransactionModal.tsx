import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import type {
  Material,
  StockTransactionInput,
  TransactionType,
} from '../types/warehouse';

interface TransactionModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  initialMaterialId?: string;
  materials: Material[];
  onClose: () => void;
  onSubmit: (payload: StockTransactionInput & { description?: string }) => Promise<void>;
}

function getTodayDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialMaterialId,
  materials,
  onClose,
  onSubmit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [takerName, setTakerName] = useState('');
  const [usageArea, setUsageArea] = useState('');
  const [exitDate, setExitDate] = useState(getTodayDateInput);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setQuantity(1);
    setTakerName('');
    setUsageArea('');
    setExitDate(getTodayDateInput());

    if (initialMaterialId) {
      const found = materials.find((m) => m.id === initialMaterialId);
      setSelectedMaterialId(found ? found.id : '');
      setSearchQuery(found ? found.sku : '');
    } else {
      setSelectedMaterialId('');
      setSearchQuery('');
    }
  }, [isOpen, initialMaterialId, materials]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return materials.slice(0, 8);
    return materials.filter(
      (m) =>
        m.sku.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
    );
  }, [materials, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      setSelectedMaterialId('');
      return;
    }
    const exactMatch = materials.find(
      (m) => m.sku.toLowerCase() === q || m.name.toLowerCase() === q
    );
    if (exactMatch) {
      setSelectedMaterialId(exactMatch.id);
    } else if (filteredMaterials.length === 1) {
      setSelectedMaterialId(filteredMaterials[0].id);
    } else {
      setSelectedMaterialId('');
    }
  };

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterialId) ?? null,
    [materials, selectedMaterialId]
  );

  if (!isOpen) return null;

  const currentStock = selectedMaterial?.currentStock ?? 0;
  const remainingAfter = selectedMaterial ? Math.max(0, currentStock - quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedMaterial) {
      setErrorMsg('Silakan cari dan pilih material terlebih dahulu.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Jumlah material keluar harus minimal 1.');
      return;
    }
    if (quantity > currentStock) {
      setErrorMsg(
        `Stok tidak mencukupi (tersedia ${currentStock} ${selectedMaterial.unit}).`
      );
      return;
    }
    if (!takerName.trim()) {
      setErrorMsg('Nama pengambil wajib diisi.');
      return;
    }
    if (!usageArea.trim()) {
      setErrorMsg('Area penggunaan wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        materialId: selectedMaterial.id,
        type: 'KELUAR',
        quantity,
        party: takerName.trim(),
        pic: usageArea.trim(),
        notes: exitDate ? `Tanggal Keluar: ${exitDate}` : '',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mencatat material keluar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Input Material Keluar
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800">
              {errorMsg}
            </div>
          )}

          {/* 1. Cari Material */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Cari Material *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Ketik QCODE atau Nama Material..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Dropdown Hasil Pencarian */}
            {searchQuery.trim() !== '' && !selectedMaterial && (
              <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg divide-y divide-slate-100 dark:divide-slate-700">
                {filteredMaterials.length > 0 ? (
                  filteredMaterials.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedMaterialId(item.id);
                        setSearchQuery(item.sku);
                        setQuantity(1);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.sku}
                        </span>{' '}
                        — <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                      </div>
                      <span className="font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                        Sisa: {item.currentStock} {item.unit}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3.5 py-2.5 text-xs text-slate-500">
                    Tidak ada material yang cocok
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. QCODE Material & Nama Material (Otomatis) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3