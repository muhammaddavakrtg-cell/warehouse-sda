import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AccessLevel, UserProfile } from '../types/warehouse';

interface UserRow {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: AccessLevel;
  canEdit: boolean;
  avatarUrl: string;
}

interface UserManagementPanelProps {
  profile: UserProfile | null;
  onNotify: (variant: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

const ROLE_LABEL: Record<AccessLevel, string> = {
  admin: 'Admin',
  staff: 'Staff',
  member: 'Member',
};

const ROLE_BADGE: Record<AccessLevel, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  staff: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  member: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function normalizeRole(value: unknown): AccessLevel {
  return value === 'admin' || value === 'staff' ? value : 'member';
}

export function UserManagementPanel({ profile, onNotify }: UserManagementPanelProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | AccessLevel>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff';

  const loadUsers = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError('');

    const { data, error } = await supabase.rpc('list_users');
    if (error) {
      setLoadError(error.message || 'Gagal memuat daftar user.');
      setLoading(false);
      return;
    }

    setUsers(
      ((data ?? []) as any[]).map((r) => ({
        id: r.id,
        username: r.username ?? '',
        fullName: r.full_name ?? '',
        email: r.email ?? '',
        role: normalizeRole(r.role),
        canEdit: Boolean(r.can_edit),
        avatarUrl: r.avatar_url ?? '',
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin || isStaff) {
      loadUsers();
    }
  }, [isAdmin, isStaff, loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const memberCount = users.filter((u) => u.role === 'member').length;

  if (!profile || (!isAdmin && !isStaff)) {
    return (
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-300">
        Halaman ini hanya untuk Admin dan Staff.
      </section>
    );
  }

  const handleChangeRole = async (user: UserRow, nextRole: AccessLevel) => {
    if (!supabase || nextRole === user.role) return;

    if (nextRole === 'admin') {
      const ok = window.confirm(
        `Jadikan ${user.fullName || user.username} sebagai Admin? Admin dapat mengatur semua user.`
      );
      if (!ok) return;
    }

    setBusyId(user.id);
    try {
      const { error } = await supabase.rpc('set_user_role', {
        target_id: user.id,
        new_role: nextRole,
      });
      if (error) throw new Error(error.message || 'Gagal mengubah level.');

      onNotify(
        'success',
        'Level diperbarui',
        `${user.fullName || user.username} sekarang berlevel ${ROLE_LABEL[nextRole]}.`
      );
      await loadUsers();
    } catch (err: any) {
      onNotify('error', 'Gagal mengubah level', err?.message || 'Terjadi kesalahan.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (!supabase) return;

    const ok = window.confirm(
      `Hapus akun ${user.fullName || user.username} (${user.email})?\n\nAkun akan dihapus permanen dan tidak bisa dikembalikan.`
    );
    if (!ok) return;

    setBusyId(user.id);
    try {
      const { error } = await supabase.rpc('delete_member', { target_id: user.id });
      if (error) throw new Error(error.message || 'Gagal menghapus akun.');

      onNotify('success', 'Akun dihapus', `${user.fullName || user.username} telah dihapus.`);
      await loadUsers();
    } catch (err: any) {
      onNotify('error', 'Gagal menghapus akun', err?.message || 'Terjadi kesalahan.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Kelola User</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {users.length} akun terdaftar, {memberCount} berlevel Member.{' '}
            {isAdmin
              ? 'Admin dapat mengubah level user dan menghapus akun Member.'
              : 'Staff hanya dapat menghapus akun berlevel Member.'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Memuat...' : 'Muat Ulang'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, username, atau email"
          className="flex-1 px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'ALL' | AccessLevel)}
          className="px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
        >
          <option value="ALL">Semua level</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="member">Member</option>
        </select>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-3 rounded-xl text-xs font-semibold bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
        >
          {loadError}
        </div>
      )}

      {loading && users.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat daftar user...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada user yang cocok.</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredUsers.map((u) => {
            const isSelf = u.id === profile.id;
            const initial = (u.fullName || u.username || 'U').charAt(0).toUpperCase();
            const busy = busyId === u.id;
            const canDelete = !isSelf && u.role === 'member';

            return (
              <li key={u.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.fullName || u.username}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {u.fullName || u.username}
                      {isSelf && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Anda
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      @{u.username} • {u.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && !isSelf ? (
                    <select
                      value={u.role}
                      disabled={busy}
                      onChange={(e) => handleChangeRole(u, e.target.value as AccessLevel)}
                      aria-label={`Level untuk ${u.fullName || u.username}`}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-60 cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${ROLE_BADGE[u.role]}`}
                    >
                      {ROLE_LABEL[u.role]}
                    </span>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-60 cursor-pointer"
                    >
                      {busy ? 'Memproses...' : 'Hapus'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
