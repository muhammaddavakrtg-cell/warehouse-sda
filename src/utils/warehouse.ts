import type { Material, StockLog, StockStatus } from '../types/warehouse';

export function getStockStatus(currentStock: number, minStock: number): StockStatus {
  if (currentStock <= 0) return 'HABIS';
  if (currentStock <= minStock) return 'MENIPIS';
  return 'AMAN';
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatShortTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function exportLogsToCsv(logs: StockLog[]): void {
  const headers = [
    'Waktu',
    'Jenis',
    'qcode',
    'Nama Material',
    'Jumlah',
    'Satuan',
    'Stok Awal',
    'Stok Akhir',
    'Sumber / Pemohon',
    'Penanggung Jawab',
    'Catatan',
  ];

  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = logs.map((log) => [
    formatDateTime(log.createdAt),
    log.type,
    log.materialqcode,
    log.materialName,
    log.type === 'MASUK' ? `+${log.quantity}` : `-${log.quantity}`,
    log.materialUnit,
    log.stockBefore,
    log.stockAfter,
    log.party,
    log.pic,
    log.notes,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `logbook-gudang-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function sortMaterialsByUrgency(materials: Material[]): Material[] {
  const rank: Record<StockStatus, number> = { HABIS: 0, MENIPIS: 1, AMAN: 2 };
  return [...materials].sort((a, b) => {
    const statusA = getStockStatus(a.currentStock, a.minStock);
    const statusB = getStockStatus(b.currentStock, b.minStock);
    if (rank[statusA] !== rank[statusB]) return rank[statusA] - rank[statusB];
    return a.name.localeCompare(b.name, 'id');
  });
}
