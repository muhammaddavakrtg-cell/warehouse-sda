import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Search } from 'lucide-react';
import type { MaterialTransaction } from '../types/warehouse';

interface TransactionsViewProps {
  transactions: MaterialTransaction[];
  onRecordInbound: () => void;
  onRecordOutbound: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onRecordInbound,
  onRecordOutbound,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inbound' | 'outbound'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesQuery =
        !q ||
        tx.material_code.toLowerCase().includes(q) ||
        tx.material_name.toLowerCase().includes(q) ||
        tx.reference_no.toLowerCase().includes(q) ||
        tx.staff_email.toLowerCase().includes(q) ||
        tx.notes.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [transactions, search, typeFilter]);

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
              placeholder="Cari material, no. referensi, atau staf..."
              className="w-full min-h-[42px] rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'inbound', label: 'Barang Masuk' },
                { id: 'outbound', label: 'Barang Keluar' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTypeFilter(opt.id)}
                className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  typeFilter === opt.id
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
            onClick={onRecordInbound}
            className="min-h-[42px] rounded-lg border border-teal-700/20 bg-teal-50 px-3.5 py-2 text-xs font-medium text-teal-800 hover:bg-teal-100/70 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Barang Masuk</span>
          </button>
          <button
            type="button"
            onClick={onRecordOutbound}
            className="min-h-[42px] rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Barang Keluar</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-slate-900">Belum ada riwayat transaksi</p>
          <p className="mt-1 text-xs text-slate-500">
            Setiap pencatatan barang masuk atau keluar akan muncul di daftar ini dan otomatis memperbarui stok.
          </p>
          <button
            type="button"
            onClick={onRecordInbound}
            className="mt-4 min-h-[42px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi Baru</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Ledger Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-4">Referensi</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                    <th className="py-3 px-4 text-right">Mutasi Stok</th>
                    <th className="py-3 px-4">Staf & Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.type === 'inbound' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Keluar
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{tx.material_name}</p>
                        <p className="text-xs font-mono text-slate-500">{tx.material_code}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {tx.reference_no || '-'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                          tx.type === 'inbound' ? 'text-teal-700' : 'text-amber-700'
                        }`}
                      >
                        {tx.type === 'inbound' ? '+' : '-'}
                        {tx.quantity.toLocaleString('id-ID')} {tx.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {tx.stock_before} → {tx.stock_after}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {tx.staff_email}
                        </p>
                        {tx.notes && (
                          <p className="text-xs text-slate-500 truncate">{tx.notes}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Ledger Cards */}
          <div className="md:hidden bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {filtered.map((tx) => (
              <div key={tx.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      {tx.type === 'inbound' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-teal-700">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Keluar
                        </span>
                      )}
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">{tx.reference_no || '-'}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{tx.material_name}</p>
                  </div>

                  <div className="text-right shrink-0 tabular-nums">
                    <p
                      className={`text-sm font-bold font-mono ${
                        tx.type === 'inbound' ? 'text-teal-700' : 'text-amber-700'
                      }`}
                    >
                      {tx.type === 'inbound' ? '+' : '-'}
                      {tx.quantity.toLocaleString('id-ID')} {tx.unit}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      {tx.stock_before} → {tx.stock_after}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{tx.notes || tx.staff_email}</span>
                  <span className="font-mono tabular-nums shrink-0 ml-2">
                    {new Date(tx.created_at).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
