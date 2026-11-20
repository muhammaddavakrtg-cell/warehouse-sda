import { useMemo, useState } from 'react';
import { Calendar, ClipboardList, FileSpreadsheet, FileText, Search, X } from 'lucide-react';
import type { StockLog, TransactionType } from '../types/warehouse';
import { exportKeluarToExcel, exportKeluarToPdf } from '../utils/exportLogs';
import { formatDateTime, formatNumber } from '../utils/warehouse';
import { TransactionBadge } from './StatusBadge';

interface LogbookViewProps {
  logs: StockLog[];
}

export function LogbookView({ logs }: LogbookViewProps) {
  const [typeFilter, setTypeFilter] = useState<'SEMUA' | TransactionType>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  // Filter pencarian + tanggal (tanpa filter jenis), dipakai juga untuk unduhan material keluar
  const dateSearchLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return logs.filter((log) => {
      const logTime = new Date(log.createdAt).getTime();
      if (fromTime !== null && logTime < fromTime) return false;
      if (toTime !== null && logTime > toTime) return false;

      if (q) {
        const match =
          log.materialName.toLowerCase().includes(q) ||
          log.materialSku.toLowerCase().includes(q) ||
          log.party.toLowerCase().includes(q) ||
          log.pic.toLowerCase().includes(q) ||
          log.notes.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [logs, searchQuery, dateFrom, dateTo]);

  const filteredLogs = useMemo(
    () =>
      typeFilter === 'SEMUA'
        ? dateSearchLogs
        : dateSearchLogs.filter((log) => log.type === typeFilter),
    [dateSearchLogs, typeFilter]
  );

  // Data untuk unduhan: hanya material KELUAR, mengikuti tanggal dan pencarian
  const keluarLogs = useMemo(
    () => dateSearchLogs.filter((log) => log.type === 'KELUAR'),
    [dateSearchLogs]
  );

  const applyDatePreset = (preset: 'today' | '7d' | 'all') => {
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      return;
    }
    const now = new Date();
    const toIso = now.toISOString().slice(0, 10);
    if (preset === 'today') {
      setDateFrom(toIso);
      setDateTo(toIso);
    } else {
      const sevenAgo = new Date(now.getTime() - 6 * 86400 * 1000);
      setDateFrom(sevenAgo.toISOString().slice(0, 10));
      setDateTo(toIso);
    }
  };

  const handleExport = async (kind: 'pdf' | 'excel') => {
    if (keluarLogs.length === 0 || exporting) return;
    setExporting(kind);
    try {
      if (kind === 'pdf') {
        const periode =
          dateFrom || dateTo ? `${dateFrom || 'awal'} s/d ${dateTo || 'sekarang'}` : '';
        await exportKeluarToPdf(keluarLogs, { periode });
      } else {
        await exportKeluarToExcel(keluarLogs);
      }
    } catch (err) {
      console.error(err);
      window.alert('Gagal membuat file unduhan. Silakan coba lagi.');
    } finally {
      setExporting(null);
    }
  };

  const totalMasuk = filteredLogs.filter((l) => l.type === 'MASUK').length;
  const totalKeluar = filteredLogs.filter((l) => l.type === 'KELUAR').length;

  return (
    <div className="space-y-5">
      {/* Filter Controls Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#334155] dark:text-[#D1D5DB] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari material, SKU, supplier/pemohon, PIC, atau catatan..."
              aria-label="Cari logbook"
              className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-sm text-[#0F172A] dark:text-[#F9FAFB] placeholder:text-slate-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-200 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Range Inputs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Calendar
                className="w-4 h-4 text-[#334155] dark:text-[#D1D5DB] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Dari tanggal"
                className="w-full sm:w-auto min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-xs sm:text-sm font-mono text-[#0F172A] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
              />
            </div>
            <span className="text-xs font-semibold text-[#334155] dark:text-[#D1D5DB]">s/d</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Sampai tanggal"
              className="flex-1 sm:flex-initial min-h-[44px] px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-xs sm:text-sm font-mono text-[#0F172A] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] dark:focus:ring-[#3B82F6]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={keluarLogs.length === 0 || exporting !== null}
              onClick={() => handleExport('pdf')}
              title="Unduh daftar material keluar (PDF)"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{exporting === 'pdf' ? 'Membuat PDF...' : 'PDF Material Keluar'}</span>
            </button>
            <button
              type="button"
              disabled={keluarLogs.length === 0 || exporting !== null}
              onClick={() => handleExport('excel')}
              title="Unduh daftar material keluar (Excel)"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{exporting === 'excel' ? 'Membuat Excel...' : 'Excel Material Keluar'}</span>
            </button>
          </div>
        </div>

        {/* Type Filter + Date Presets + Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="Filter jenis transaksi"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#374151]"
            >
              {(['SEMUA', 'MASUK', 'KELUAR'] as const).map((type) => {
                const active = typeFilter === type;
                return (
                  <button
                    key={type}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16]'
                        : 'text-[#334155] dark:text-[#D1D5DB] hover:text-[#0F172A] dark:hover:text-[#F9FAFB]'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyDatePreset('today')}
                className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#CBD5E1] dark:border-[#374151] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('7d')}
                className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#CBD5E1] dark:border-[#374151] hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                7 Hari
              </button>
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => applyDatePreset('all')}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold text-[#1D4ED8] dark:text-[#3B82F6] hover:underline cursor-pointer"
                >
                  Semua Tanggal
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-[#334155] dark:text-[#D1D5DB] tabular-nums">
            <span>
              Total: <strong className="text-[#0F172A] dark:text-[#F9FAFB]">{filteredLogs.length}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#15803D] dark:text-[#4ADE80] font-semibold">
              Masuk: {totalMasuk}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#C2410C] dark:text-[#FB923C] font-semibold">
              Keluar: {totalKeluar}
            </span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-gray-800 text-[#334155] dark:text-[#D1D5DB] flex items-center justify-center">
            <ClipboardList className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="mt-3 font-display font-bold text-base">Belum Ada Riwayat yang Cocok</p>
          <p className="mt-1 text-sm text-[#334155] dark:text-[#D1D5DB]">
            Sesuaikan rentang tanggal, jenis transaksi, atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Timeline Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredLogs.map((log) => (
              <article
                key={log.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <TransactionBadge type={log.type} />
                  <span className="font-mono text-xs tabular-nums text-[#334155] dark:text-[#D1D5DB]">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>

                <div>
                  <p className="font-mono text-xs font-semibold text-[#334155] dark:text-[#D1D5DB]">
                    {log.materialSku}
                  </p>
                  <h3 className="font-display font-bold text-base leading-snug">
                    {log.materialName}
                  </h3>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#374151]">
                  <div>
                    <span className="text-[11px] text-[#334155] dark:text-[#D1D5DB]">Perubahan</span>
                    <p
                      className={`font-mono text-base font-extrabold tabular-nums ${
                        log.type === 'MASUK'
                          ? 'text-[#15803D] dark:text-[#4ADE80]'
                          : 'text-[#C2410C] dark:text-[#FB923C]'
                      }`}
                    >
                      {log.type === 'MASUK' ? '+' : '-'}
                      {formatNumber(log.quantity)} {log.materialUnit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#334155] dark:text-[#D1D5DB]">
                      Stok Awal → Akhir
                    </span>
                    <p className="font-mono text-sm font-bold tabular-nums">
                      {formatNumber(log.stockBefore)} → {formatNumber(log.stockAfter)}{' '}
                      <span className="text-xs font-normal">{log.materialUnit}</span>
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#334155] dark:text-[#D1D5DB] space-y-1">
                  <p>
                    <strong className="text-[#0F172A] dark:text-[#F9FAFB]">
                      {log.type === 'MASUK' ? 'Sumber:' : 'Pemohon:'}
                    </strong>{' '}
                    {log.party} · <strong className="text-[#0F172A] dark:text-[#F9FAFB]">PIC:</strong>{' '}
                    {log.pic}
                  </p>
                  {log.notes && <p className="italic">"{log.notes}"</p>}
                </div>
              </article>
            ))}
          </div>

          {/* Desktop Audit Table */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-xs font-bold text-[#334155] dark:text-[#D1D5DB]">
                    <th className="py-3.5 px-4 whitespace-nowrap">Waktu Transaksi</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Jenis</th>
                    <th className="py-3.5 px-4">Material & SKU</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Jumlah</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Stok Awal → Akhir</th>
                    <th className="py-3.5 px-4">Sumber / Pemohon & PIC</th>
                    <th className="py-3.5 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1] dark:divide-[#374151] text-sm">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs tabular-nums whitespace-nowrap text-[#334155] dark:text-[#D1D5DB]">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TransactionBadge type={log.type} />
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#0F172A] dark:text-[#F9FAFB]">
                          {log.materialName}
                        </p>
                        <p className="font-mono text-xs text-[#334155] dark:text-[#D1D5DB]">
                          {log.materialSku}
                        </p>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap ${
                          log.type === 'MASUK'
                            ? 'text-[#15803D] dark:text-[#4ADE80]'
                            : 'text-[#C2410C] dark:text-[#FB923C]'
                        }`}
                      >
                        {log.type === 'MASUK' ? '+' : '-'}
                        {formatNumber(log.quantity)} {log.materialUnit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                        <span className="text-[#334155] dark:text-[#D1D5DB]">
                          {formatNumber(log.stockBefore)}
                        </span>{' '}
                        <span aria-hidden="true">→</span>{' '}
                        <strong className="text-sm text-[#0F172A] dark:text-[#F9FAFB]">
                          {formatNumber(log.stockAfter)}
                        </strong>{' '}
                        <span className="text-[#334155] dark:text-[#D1D5DB]">
                          {log.materialUnit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-xs sm:text-sm">{log.party}</p>
                        <p className="text-xs text-[#334155] dark:text-[#D1D5DB]">PIC: {log.pic}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#334155] dark:text-[#D1D5DB] max-w-xs">
                        {log.notes || '—'}
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
