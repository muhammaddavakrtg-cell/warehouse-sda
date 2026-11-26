import { useMemo, useState } from 'react';
import { PackageX, Search } from 'lucide-react';
import type { Material } from '../types/warehouse';

interface DepletedMaterialsViewProps {
  materials: Material[];
  isLoading?: boolean;
}

function formatDate(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

export function DepletedMaterialsView({ materials, isLoading = false }: DepletedMaterialsViewProps) {
  const [query, setQuery] = useState('');

  const depleted = useMemo(
    () => materials.filter((m) => Number(m.currentStock) <= 0),
    [materials]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return depleted;
    return depleted.filter((m) =>
      [m.qcode, m.name, m.category, m.location, m.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [depleted, query]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Material Habis</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Material yang stoknya sudah 0 dan perlu diisi ulang.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
          {depleted.length} material habis
        </span>
      </div>

      <div className="relative">
        <Search
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari kode, nama, kategori, atau lokasi"
          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Memuat data material...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-2">
          <PackageX className="w-8 h-8 mx-auto text-slate-400" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {depleted.length === 0
              ? 'Tidak ada material yang habis'
              : 'Tidak ada material yang cocok dengan pencarian'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {depleted.length === 0
              ? 'Semua material saat ini masih memiliki stok.'
              : 'Coba kata kunci lain.'}
          </p>
        </div>
      ) : (
        <>
          {/* Tampilan tabel untuk layar lebar */}
          <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3">QCODE</th>
                  <th className="px-4 py-3">Nama Material</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3 text-right">Stok Minimum</th>
                  <th className="px-4 py-3">Diperbarui</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b last:border-b-0 border-slate-100 dark:border-slate-800/70"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {m.qcode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
                      {m.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {m.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {m.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {m.location || '-'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {m.minStock} {m.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(m.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tampilan kartu untuk HP */}
          <div className="md:hidden space-y-3">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {m.qcode}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                    Habis
                  </span>
                </div>
                {m.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.description}</p>
                )}
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-slate-500 dark:text-slate-400">Kategori</dt>
                  <dd className="text-slate-800 dark:text-slate-200 text-right">
                    {m.category || '-'}
                  </dd>
                  <dt className="text-slate-500 dark:text-slate-400">Lokasi</dt>
                  <dd className="text-slate-800 dark:text-slate-200 text-right">
                    {m.location || '-'}
                  </dd>
                  <dt className="text-slate-500 dark:text-slate-400">Stok minimum</dt>
                  <dd className="text-slate-800 dark:text-slate-200 text-right tabular-nums">
                    {m.minStock} {m.unit}
                  </dd>
                  <dt className="text-slate-500 dark:text-slate-400">Diperbarui</dt>
                  <dd className="text-slate-800 dark:text-slate-200 text-right">
                    {formatDate(m.updatedAt)}
                  </dd>
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
