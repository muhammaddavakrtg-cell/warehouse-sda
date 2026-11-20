import type { Material } from '../types/warehouse';
import { formatWaktu, stampTanggal } from './exportLogs';
import { getStockStatus } from './warehouse';

const STATUS_LABEL: Record<string, string> = {
  AMAN: 'Aman',
  MENIPIS: 'Menipis',
  HABIS: 'Habis',
};

function statusLabel(material: Material): string {
  const status = getStockStatus(material.currentStock, material.minStock);
  return STATUS_LABEL[status] ?? String(status);
}

/** Unduh daftar master material sebagai PDF (A4 lanskap). */
export async function exportMaterialsToPdf(materials: Material[]): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Daftar Master Material', 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(
    `Jumlah material: ${materials.length}  |  Dicetak: ${formatWaktu(new Date().toISOString())}`,
    14,
    20
  );
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 25,
    head: [['SKU', 'Nama Material', 'Kategori', 'Satuan', 'Stok', 'Stok Min', 'Status', 'Lokasi', 'Diperbarui']],
    body: materials.map((m) => [
      m.sku,
      m.name,
      m.category,
      m.unit,
      String(m.currentStock),
      String(m.minStock),
      statusLabel(m),
      m.location || '-',
      m.updatedAt ? formatWaktu(m.updatedAt) : '-',
    ]),
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 26 },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'Habis') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'Menipis') {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        }
      }
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

  doc.save(`master-material-${stampTanggal()}.pdf`);
}

/** Unduh daftar master material sebagai Excel (.xlsx). */
export async function exportMaterialsToExcel(materials: Material[]): Promise<void> {
  const XLSX = await import('xlsx');

  const header = [
    'SKU',
    'Nama Material',
    'Kategori',
    'Satuan',
    'Stok Saat Ini',
    'Stok Minimum',
    'Status',
    'Lokasi',
    'Terakhir Diperbarui',
  ];

  const rows = materials.map((m) => [
    m.sku,
    m.name,
    m.category,
    m.unit,
    m.currentStock,
    m.minStock,
    statusLabel(m),
    m.location || '',
    m.updatedAt ? formatWaktu(m.updatedAt) : '',
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);

  sheet['!cols'] = [
    { wch: 14 },
    { wch: 34 },
    { wch: 16 },
    { wch: 9 },
    { wch: 13 },
    { wch: 13 },
    { wch: 10 },
    { wch: 18 },
    { wch: 19 },
  ];
  sheet['!autofilter'] = { ref: `A1:I${rows.length + 1}` };

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Master Material');
  XLSX.writeFile(book, `master-material-${stampTanggal()}.xlsx`);
}
