import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XOctagon,
} from 'lucide-react';
import type { StockStatus, TransactionType } from '../types/warehouse';

export function StockStatusBadge({ status }: { status: StockStatus }) {
  if (status === 'AMAN') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap shrink-0 bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] dark:bg-[#14532D] dark:text-[#4ADE80] dark:border-[#166534]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Stok Aman</span>
      </span>
    );
  }

  if (status === 'MENIPIS') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap shrink-0 bg-[#FEF3C7] text-[#B45309] border-[#FCD34D] dark:bg-[#78350F] dark:text-[#FBBF24] dark:border-[#92400E]">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Stok Menipis</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap shrink-0 bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#991B1B]">
      <XOctagon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Habis</span>
    </span>
  );
}

export function TransactionBadge({ type }: { type: TransactionType }) {
  if (type === 'MASUK') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border whitespace-nowrap shrink-0 bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] dark:bg-[#14532D] dark:text-[#4ADE80] dark:border-[#166534]">
        <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>MASUK</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border whitespace-nowrap shrink-0 bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74] dark:bg-[#431407] dark:text-[#FB923C] dark:border-[#9A3412]">
      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>KELUAR</span>
    </span>
  );
}
