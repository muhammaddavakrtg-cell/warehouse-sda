import { useMemo, useState } from 'react';
import { Archive, Search } from 'lucide-react';
import type { StockLog } from '../types/warehouse';
import { LogbookView } from './LogbookView';

export interface DeletedMaterialLog {
  id: string;
  qcode: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  location: string;
  deletedBy: string;
  deletedAt: string;
}

interface LogbookPageProps {
  logs: StockLog[];
  deletedMaterials: DeletedMaterialLog[];
  canExport?: boolean;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function DeletedMaterialsLog({ items }: { items: DeletedMaterialLog[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.qcode.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] space-y-3">
        <div>
          <h2 className="font-display font-bold text-base">Riwayat Material Habis</h2>
          <p className="text-xs text-[#334155] dark:text-[#D1D5DB]">
            Catatan material yang stoknya habis lalu dihapus dari daftar material.
          </p>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155] dark:text-[#D1D5DB]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari QCODE, nama, atau deskripsi..."
            aria-label="Cari riwayat material habis"
            className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm text-[#0F172A] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
          />
        </div>

        <p className="text-xs font-medium text-[#334155] dark:text-[#D1D5DB] tabular-nums">
          Menampilkan <strong className="text-[#0F172A] dark:text-[#F9FAFB]">{filtered.length}</strong>{' '}
          dari {items.length} catatan
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-gray-800 text-[#334155] dark:text-[#D1D5DB] flex items-center justify-center">
            <Archive className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="mt-3 font-display font-bold text-base">
            {items.length === 0 ? 'Belum Ada Material yang Dihapus' : 'Catatan Tidak Ditemukan'}
          </p>
          <p className="mt-1 text-sm text-[#334155] dark:text-[#D1D5DB]">
            {items.length === 0
              ? 'Material yang stoknya habis lalu dihapus akan tercatat di sini.'
              : 'Coba ubah kata kunci pencarian.'}
          </p>
        </div>
      ) : (
        <>
          {/* Tampilan kartu (HP) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((it) => (
              <article
                key={it.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-[#334155] dark:text-[#D1D5DB] flex-wrap">
                  <span className="font-mono font-semibold">{it.qcode}</span>
                  {it.category && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{it.category}</span>
                    </>
                  )}
                </div>
                <h3 className="font-display font-bold text-base leading-snug">{it.name}</h3>
                <p className="text-sm text-[#334155] dark:text-[#D1D5DB]">
                  {it.description || 'Tanpa deskripsi'}
                </p>
                <p className="text-xs text-[#334155] dark:text-[#D1D5DB]">
                  Dihapus {formatDateTime(it.deletedAt)}
                  {it.deletedBy ? ` oleh ${it.deletedBy}` : ''}
                </p>
              </article>
            ))}
          </div>

          {/* Tampilan tabel (PC) */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-xs font-bold text-[#334155] dark:text-[#D1D5DB]">
                    <th className="py-3.5 px-4 whitespace-nowrap">Tanggal Dihapus</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">QCODE</th>
                    <th className="py-3.5 px-4">Nama Material</th>
                    <th className="py-3.5 px-4">Deskripsi</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Kategori</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Dihapus Oleh</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map((it) => (
                    <tr
                      key={it.id}
                      className="border-b last:border-b-0 border-[#CBD5E1] dark:border-[#374151] align-top"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#334155] dark:text-[#D1D5DB]">
                        {formatDateTime(it.deletedAt)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold whitespace-nowrap">
                        {it.qcode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{it.name}</td>
                      <td className="py-3.5 px-4 text-[#334155] dark:text-[#D1D5DB]">
                        {it.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#334155] dark:text-[#D1D5DB]">
                        {it.category || '-'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#334155] dark:text-[#D1D5DB]">
                        {it.deletedBy || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function LogbookPage({ logs, deletedMaterials, canExport = false }: LogbookPageProps) {
  const [tab, setTab] = useState<'transaksi' | 'habis'>('transaksi');

  const tabs: { id: 'transaksi' | 'habis'; label: string }[] = [
    { id: 'transaksi', label: 'Logbook Transaksi' },
    { id: 'habis', label: `Riwayat Material Habis (${deletedMaterials.length})` },
  ];

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Pilihan logbook"
        className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#374151]"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16]'
                  : 'text-[#334155] dark:text-[#D1D5DB] hover:text-[#0F172A] dark:hover:text-[#F9FAFB]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'transaksi' ? (
        <LogbookView logs={logs} canExport={canExport} />
      ) : (
        <DeletedMaterialsLog items={deletedMaterials} />
      )}
    </div>
  );
}
