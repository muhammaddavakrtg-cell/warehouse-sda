import type { StockLog } from '../types/warehouse';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatWaktu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function stampTanggal(): string {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

interface ExportKeluarOptions {
  /** Teks periode, misalnya "2026-11-01 s/d 2026-11-20". Kosong = semua tanggal. */
  periode?: string;
}

/** Unduh daftar material keluar sebagai PDF (A4 lanskap). */
export async function exportKeluarToPdf(
  logs: StockLog[],
  options: ExportKeluarOptions = {}
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Logbook Material Keluar', 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(
    `Periode: ${options.periode || 'Semua tanggal'}  |  Jumlah transaksi: ${logs.length}  |  Dicetak: ${formatWaktu(new Date().toISOString())}`,
    14,
    20
  );
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 25,
    head: [
      [
        'Waktu',
        'QCODE',
        'Material',
        'Jumlah',
        'Stok Awal',
        'Stok Akhir',
        'Pemohon / Proyek',
        'PIC',
        'Catatan',
      ],
    ],
    body: logs.map((log) => [
      formatWaktu(log.createdAt),
      log.materialQCODE,
      log.materialName,
      `${log.quantity} ${log.materialUnit}`,
      `${log.stockBefore} ${log.materialUnit}`,
      `${log.stockAfter} ${log.materialUnit}`,
      log.party,
      log.pic,
      log.notes || '-',
    ]),
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 24 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  doc.save(`material-keluar-${stampTanggal()}.pdf`);
}

/** Unduh daftar material keluar sebagai Excel (.xlsx). */
export async function exportKeluarToExcel(logs: StockLog[]): Promise<void> {
  const XLSX = await import('xlsx');

  const header = [
    'Waktu',
    'QCODE',
    'Material',
    'Jumlah',
    'Satuan',
    'Stok Awal',
    'Stok Akhir',
    'Pemohon / Proyek',
    'PIC',
    'Catatan',
  ];

  const rows = logs.map((log) => [
    formatWaktu(log.createdAt),
    log.materialQCODE,
    log.materialName,
    log.quantity,
    log.materialUnit,
    log.stockBefore,
    log.stockAfter,
    log.party,
    log.pic,
    log.notes || '',
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);

  sheet['!cols'] = [
    { wch: 17 },
    { wch: 14 },
    { wch: 32 },
    { wch: 10 },
    { wch: 9 },
    { wch: 11 },
    { wch: 11 },
    { wch: 26 },
    { wch: 18 },
    { wch: 36 },
  ];
  sheet['!autofilter'] = { ref: `A1:J${rows.length + 1}` };

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Material Keluar');
  XLSX.writeFile(book, `material-keluar-${stampTanggal()}.xlsx`);
}
