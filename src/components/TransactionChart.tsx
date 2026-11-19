import React, { useMemo, useState } from 'react';
import type { MaterialTransaction } from '../types/warehouse';

interface TransactionChartProps {
  transactions: MaterialTransaction[];
}

interface DayBucket {
  key: string;
  label: string;
  fullDate: string;
  inbound: number;
  outbound: number;
  txCount: number;
}

export const TransactionChart: React.FC<TransactionChartProps> = ({ transactions }) => {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const buckets = useMemo<DayBucket[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const map = new Map<string, DayBucket>();
    const list: DayBucket[] = [];

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const bucket: DayBucket = {
        key,
        label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        fullDate: d.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        inbound: 0,
        outbound: 0,
        txCount: 0,
      };
      map.set(key, bucket);
      list.push(bucket);
    }

    for (const tx of transactions) {
      const dt = new Date(tx.created_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;
      const bucket = map.get(key);
      if (bucket) {
        if (tx.type === 'inbound') bucket.inbound += tx.quantity;
        else bucket.outbound += tx.quantity;
        bucket.txCount += 1;
      }
    }

    return list;
  }, [transactions, rangeDays]);

  const totals = useMemo(() => {
    return buckets.reduce(
      (acc, b) => {
        acc.inbound += b.inbound;
        acc.outbound += b.outbound;
        return acc;
      },
      { inbound: 0, outbound: 0 }
    );
  }, [buckets]);

  const maxVal = useMemo(() => {
    const peak = buckets.reduce((m, b) => Math.max(m, b.inbound, b.outbound), 0);
    return Math.max(10, Math.ceil(peak / 10) * 10);
  }, [buckets]);

  const chartWidth = 640;
  const chartHeight = 230;
  const padLeft = 40;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 28;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;
  const groupW = plotW / buckets.length;
  const barW = Math.max(4, Math.min(14, groupW * 0.34));

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const activeBucket = hoveredIdx !== null ? buckets[hoveredIdx] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Grafik Arus Transaksi Material</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-teal-700 inline-block" aria-hidden="true" />
              Masuk: <strong className="font-semibold text-slate-900 font-mono">{totals.inbound.toLocaleString('id-ID')}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 inline-block" aria-hidden="true" />
              Keluar: <strong className="font-semibold text-slate-900 font-mono">{totals.outbound.toLocaleString('id-ID')}</strong>
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                rangeDays === days
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {days} Hari
            </button>
          ))}
        </div>
      </div>

      {/* Hover readout bar (fixed height to prevent layout jitter) */}
      <div className="mt-4 min-h-[24px] flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2 tabular-nums">
        {activeBucket ? (
          <>
            <span className="font-medium text-slate-800">{activeBucket.fullDate}</span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-teal-700">+{activeBucket.inbound.toLocaleString('id-ID')} masuk</span>
              <span className="text-amber-700">-{activeBucket.outbound.toLocaleString('id-ID')} keluar</span>
            </div>
          </>
        ) : (
          <>
            <span>Arahkan kursor atau sentuh batang untuk rincian harian</span>
            <span className="font-mono">{rangeDays} hari terakhir</span>
          </>
        )}
      </div>

      <div className="mt-3 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-56 min-w-[460px] select-none"
          role="img"
          aria-label="Grafik perbandingan transaksi barang masuk dan keluar"
        >
          {gridLines.map((ratio) => {
            const y = padTop + plotH * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {val}
                </text>
              </g>
            );
          })}

          {buckets.map((bucket, idx) => {
            const cx = padLeft + idx * groupW + groupW / 2;
            const inH = (bucket.inbound / maxVal) * plotH;
            const outH = (bucket.outbound / maxVal) * plotH;
            const isHovered = hoveredIdx === idx;
            const showLabel =
              rangeDays === 7 ||
              (rangeDays === 14 && idx % 2 === 0) ||
              (rangeDays === 30 && idx % 5 === 0) ||
              idx === buckets.length - 1;

            return (
              <g
                key={bucket.key}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx)}
                className="cursor-pointer"
              >
                <rect
                  x={padLeft + idx * groupW}
                  y={padTop}
                  width={groupW}
                  height={plotH}
                  fill={isHovered ? '#F1F5F9' : 'transparent'}
                  rx="4"
                />
                {/* Inbound bar */}
                <rect
                  x={cx - barW - 1}
                  y={padTop + plotH - inH}
                  width={barW}
                  height={Math.max(inH, bucket.inbound > 0 ? 3 : 0)}
                  fill="#0F766E"
                  rx="2"
                />
                {/* Outbound bar */}
                <rect
                  x={cx + 1}
                  y={padTop + plotH - outH}
                  width={barW}
                  height={Math.max(outH, bucket.outbound > 0 ? 3 : 0)}
                  fill="#D97706"
                  rx="2"
                />
                {showLabel && (
                  <text
                    x={cx}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    className={`text-[10px] ${isHovered ? 'fill-slate-900 font-semibold' : 'fill-slate-400'}`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {bucket.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
