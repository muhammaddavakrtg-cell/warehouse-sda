import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAccessRoleLabel, type ActivityLog, type UserProfile } from '../types/warehouse';

interface ActivityLogPanelProps {
  profile: UserProfile | null;
  onNotify: (variant: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

const EVENT_META: Record<string, { label: string; cls: string }> = {
  LOGIN: {
    label: 'Login',
    cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  LOGOUT: {
    label: 'Logout',
    cls: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  },
  LOGOUT_IDLE: {
    label: 'Logout otomatis',
    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  REGISTER: {
    label: 'Pendaftaran',
    cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
};

const FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'LOGIN', label: 'Login' },
  { id: 'LOGOUT', label: 'Logout' },
  { id: 'LOGOUT_IDLE', label: 'Otomatis' },
  { id: 'REGISTER', label: 'Daftar' },
];

function mapRow(row: any): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id ?? '',
    username: row.username ?? '',
    fullName: row.full_name ?? '',
    role: row.role ?? '',
    event: row.event ?? '',
    userAgent: row.user_agent ?? '',
    createdAt: row.created_at ?? '',
  };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
}

function describeDevice(ua?: string): string {
  if (!ua) return '-';
  const os = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua)
      ? 'iOS'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Lainnya';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Browser';
  return `${browser} · ${os}`;
}

function EventBadge({ event }: { event: string }) {
  const meta = EVENT_META[event] ?? {
    label: event || '-',
    cls: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export function ActivityLogPanel({ profile, onNotify }: ActivityLogPanelProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');

  const allowed = profile?.role === 'admin' || profile?.role === 'staff';

  const fetchLogs = useCallback(async () => {
    if (!supabase || !allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) {
        throw new Error(error.message);
      }
      setLogs((data ?? []).map(mapRow));
    } catch (err: any) {
      onNotify(
        'error',
        'Gagal memuat log aktivitas',
        err?.message || 'Pastikan tabel activity_logs sudah dibuat di Supabase.'
      );
    } finally {
      setLoading(false);
    }
  }, [allowed, onNotify]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (eventFilter !== 'ALL' && l.event !== eventFilter) return false;
      if (!q) return true;
      return (
        l.fullName.toLowerCase().includes(q) ||
        l.username.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q)
      );
    });
  }, [logs, search, eventFilter]);

  const loginsToday = useMemo(
    () => logs.filter((l) => l.event === 'LOGIN' && isToday(l.createdAt)),
    [logs]
  );
  const uniqueUsersToday = useMemo(
    () => new Set(loginsToday.map((l) => l.userId || l.username)).size,
    [loginsToday]
  );

  if (!allowed) {
    return (
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm">
        Halaman ini hanya dapat diakses oleh Admin dan Staf.
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-4" aria-label="Ringkasan aktivitas">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151]">
          <p className="text-xs sm:text-sm font-semibold text-[#334155] dark:text-[#D1D5DB]">
            Login Hari Ini
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-display font-extrabold tabular-nums">
            {loginsToday.length}
          </p>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151]">
          <p className="text-xs sm:text-sm font-semibold text-[#334155] dark:text-[#D1D5DB]">
            Pengguna Berbeda Hari Ini
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-display font-extrabold tabular-nums">
            {uniqueUsersToday}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#374151] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#CBD5E1] dark:border-[#374151] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold">Log Aktivitas Pengguna</h2>
              <p className="text-xs text-[#334155] dark:text-[#D1D5DB] mt-0.5">
                Riwayat login dan logout (300 catatan terbaru)
              </p>
            </div>
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Muat Ulang</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, username, atau level"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEventFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    eventFilter === f.id
                      ? 'bg-[#1D4ED8] text-white dark:bg-[#3B82F6] dark:text-[#090D16]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#334155] dark:text-[#D1D5DB]">
            Memuat log aktivitas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#334155] dark:text-[#D1D5DB]">
            Belum ada aktivitas yang cocok.
          </div>
        ) : (
          <>
            {/* Tampilan tabel (layar lebar) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#334155] dark:text-[#D1D5DB] border-b border-[#CBD5E1] dark:border-[#374151]">
                    <th className="px-5 py-3 font-semibold">Waktu</th>
                    <th className="px-3 py-3 font-semibold">Pengguna</th>
                    <th className="px-3 py-3 font-semibold">Level</th>
                    <th className="px-3 py-3 font-semibold">Aktivitas</th>
                    <th className="px-5 py-3 font-semibold">Perangkat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1] dark:divide-[#374151]">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-mono text-xs tabular-nums whitespace-nowrap">
                        {formatDateTime(l.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold">{l.fullName || l.username || '-'}</p>
                        {l.username && (
                          <p className="text-xs text-[#334155] dark:text-[#D1D5DB]">@{l.username}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">{getAccessRoleLabel(l.role)}</td>
                      <td className="px-3 py-3">
                        <EventBadge event={l.event} />
                      </td>
                      <td className="px-5 py-3 text-xs">{describeDevice(l.userAgent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tampilan kartu (HP) */}
            <div className="md:hidden divide-y divide-[#CBD5E1] dark:divide-[#374151]">
              {filtered.map((l) => (
                <div key={l.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-sm truncate">{l.fullName || l.username || '-'}</p>
                    <EventBadge event={l.event} />
                  </div>
                  <p className="text-xs text-[#334155] dark:text-[#D1D5DB]">
                    {l.username ? `@${l.username} · ` : ''}
                    {getAccessRoleLabel(l.role)}
                  </p>
                  <p className="font-mono text-xs tabular-nums">{formatDateTime(l.createdAt)}</p>
                  <p className="text-xs text-[#334155] dark:text-[#D1D5DB]">
                    {describeDevice(l.userAgent)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
