import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ActivityLogPanel } from './components/ActivityLogPanel';
import { AppShell, type NavTab } from './components/AppShell';
import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { LogbookView } from './components/LogbookView';
import { MaterialFormModal } from './components/MaterialFormModal';
import { MaterialsView } from './components/MaterialsView';
import type { NotificationItem } from './components/NotificationBell';
import { ProfilePanel } from './components/ProfilePanel';
import { UserManagementPanel } from './components/UserManagementPanel';
import { ToastContainer } from './components/ToastContainer';
import { TransactionModal } from './components/TransactionModal';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  getAccessRoleLabel,
  type AccessLevel,
  type CreateMaterialInput,
  type Material,
  type StockLog,
  type StockStatus,
  type StockTransactionInput,
  type ToastMessage,
  type TransactionType,
  type UpdateMaterialInput,
  type UserProfile,
} from './types/warehouse';
import { getStockStatus } from './utils/warehouse';

function mapMaterialRow(row: any): Material {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    unit: row.unit,
    currentStock: Number(row.current_stock ?? 0),
    minStock: Number(row.min_stock ?? 0),
    location: row.location ?? '-',
    description: row.description ?? '',
    updatedAt: row.updated_at ?? '',
    createdAt: row.created_at ?? '',
  };
}

function mapLogRow(row: any, material?: Material): StockLog {
  return {
    id: row.id,
    materialId: row.material_id,
    materialSku: row.material_sku ?? material?.sku ?? '-',
    materialName: row.material_name ?? material?.name ?? 'Material tidak ditemukan',
    materialUnit: row.material_unit ?? material?.unit ?? 'unit',
    type: row.type,
    quantity: Number(row.quantity ?? 0),
    stockBefore: Number(row.stock_before ?? 0),
    stockAfter: Number(row.stock_after ?? 0),
    party: row.party,
    pic: row.pic,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  };
}

const IDLE_LIMIT_MINUTES = 30;

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('gudangpro-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [, setProfileLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [materialsStatusFilter, setMaterialsStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txInitialType, setTxInitialType] = useState<TransactionType>('MASUK');
  const [txInitialMaterialId, setTxInitialMaterialId] = useState<string | undefined>(undefined);

  const [matModalOpen, setMatModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (variant: ToastMessage['variant'], title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, variant, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('gudangpro-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let active = true;
    setProfileLoading(true);

    supabase
      .from('profiles')
      .select('id, username, full_name, email, role, can_edit, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;

        const roleValue = (data?.role as AccessLevel) || 'member';
        const canEditValue =
          typeof data?.can_edit === 'boolean'
            ? data.can_edit
            : roleValue === 'admin' || roleValue === 'staff';

        const fallbackEmail = session.user.email ?? '';
        const fallbackUsername = fallbackEmail.split('@')[0] || 'user';

        setProfile({
          id: session.user.id,
          username: data?.username || fallbackUsername,
          fullName: data?.full_name || data?.username || fallbackUsername,
          email: data?.email || fallbackEmail,
          role: roleValue,
          canEdit: canEditValue,
          avatarUrl: data?.avatar_url || '',
        });
        setProfileLoading(false);
      })
      .catch(() => {
        if (!active) return;
        const fallbackEmail = session.user.email ?? '';
        const fallbackUsername = fallbackEmail.split('@')[0] || 'user';
        setProfile({
          id: session.user.id,
          username: fallbackUsername,
          fullName: fallbackUsername,
          email: fallbackEmail,
          role: 'member',
          canEdit: false,
        });
        setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const canEdit = Boolean(profile?.canEdit);

  const assertCanEdit = useCallback(() => {
    if (!canEdit) {
      const msg = 'Akun Anda berstatus Hanya Lihat dan tidak memiliki izin mengubah data.';
      pushToast('error', 'Akses Ditolak', msg);
      throw new Error(msg);
    }
  }, [canEdit, pushToast]);

  const fetchWarehouseData = useCallback(async () => {
    if (!supabase || !session) {
      setMaterials([]);
      setLogs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError('');
      const [matRes, logRes] = await Promise.all([
        supabase.from('materials').select('*').order('sku', { ascending: true }),
        supabase.from('stock_logs').select('*').order('created_at', { ascending: false }),
      ]);

      if (matRes.error || logRes.error) {
        throw new Error(
          matRes.error?.message || logRes.error?.message || 'Gagal memuat data gudang.'
        );
      }

      const materialsFromDb = (matRes.data ?? []).map(mapMaterialRow);
      const materialsById = new Map(materialsFromDb.map((material) => [material.id, material]));
      setMaterials(materialsFromDb);
      setLogs(
        (logRes.data ?? []).map((row) =>
          mapLogRow(row, materialsById.get(row.material_id))
        )
      );
    } catch (err: any) {
      setLoadError(err?.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchWarehouseData();
  }, [fetchWarehouseData]);

  const handleLogout = useCallback(async (event: 'LOGOUT' | 'LOGOUT_IDLE' = 'LOGOUT') => {
    if (supabase) {
      try {
        await supabase.rpc('log_activity', {
          p_event: event,
          p_user_agent: navigator.userAgent,
        });
      } catch {
        // abaikan jika pencatatan gagal
      }
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
    setActiveTab('dashboard');
  }, []);

  useEffect(() => {
    if (!session) return;

    const IDLE_LIMIT_MS = IDLE_LIMIT_MINUTES * 60 * 1000;
    let lastActivity = Date.now();

    const markActive = () => {
      lastActivity = Date.now();
    };

    const checkIdle = () => {
      if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
        try {
          window.sessionStorage.setItem('gudang-idle-logout', '1');
        } catch {
          // abaikan jika penyimpanan tidak tersedia
        }
        handleLogout('LOGOUT_IDLE');
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));
    document.addEventListener('visibilitychange', checkIdle);
    const intervalId = window.setInterval(checkIdle, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActive));
      document.removeEventListener('visibilitychange', checkIdle);
      window.clearInterval(intervalId);
    };
  }, [session, handleLogout]);

  const notifications = useMemo<NotificationItem[]>(() => {
    return materials
      .map((m) => ({ m, status: getStockStatus(m.currentStock, m.minStock) }))
      .filter((x) => x.status !== 'AMAN')
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'HABIS' ? -1 : 1))
      .map(({ m, status }) => ({
        id: m.id,
        title: m.name,
        description: `${status === 'HABIS' ? 'Stok habis' : 'Stok menipis'}: ${m.currentStock} ${m.unit} (min. ${m.minStock})`,
        level: status === 'HABIS' ? ('HABIS' as const) : ('MENIPIS' as const),
      }));
  }, [materials]);

  const criticalCount = useMemo(
    () => materials.filter((m) => getStockStatus(m.currentStock, m.minStock) !== 'AMAN').length,
    [materials]
  );

  const handleOpenTransaction = useCallback(
    (type: TransactionType, materialId?: string) => {
      if (!canEdit) {
        pushToast('info', 'Mode Hanya Lihat', 'Akun Anda tidak memiliki izin mencatat transaksi.');
        return;
      }
      setTxInitialType(type);
      setTxInitialMaterialId(materialId);
      setTxModalOpen(true);
    },
    [canEdit, pushToast]
  );

  const handleNavigateMaterials = useCallback((statusFilter: StockStatus | 'ALL' = 'ALL') => {
    setMaterialsStatusFilter(statusFilter);
    setActiveTab('materials');
  }, []);

  const handleCreateMaterial = useCallback(
    async (input: CreateMaterialInput) => {
      assertCanEdit();

      if (!supabase) {
        throw new Error(
          'Konfigurasi Supabase belum terbaca (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
        );
      }

      const { data, error } = await supabase
        .from('materials')
        .insert({
          sku: input.sku.trim(),
          name: input.name.trim(),
          category: input.category.trim(),
          unit: input.unit.trim(),
          current_stock: Number(input.currentStock ?? 0),
          description: input.description?.trim() || '',
          min_stock: Number(input.minStock ?? 0),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Gagal menambahkan material.');
      }

      const created = mapMaterialRow(data);
      await fetchWarehouseData();
      pushToast('success', 'Material berhasil ditambahkan', `${created.sku} — ${created.name}`);
    },
    [assertCanEdit, fetchWarehouseData, pushToast]
  );

  const handleUpdateMaterial = useCallback(
    async (
      id: string,
      input: UpdateMaterialInput & {
        description?: string;
        entryDate?: string;
        addedStock?: number;
      }
    ) => {
      assertCanEdit();

      if (!supabase) {
        throw new Error(
          'Konfigurasi Supabase belum terbaca (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
        );
      }

      const target = materials.find((material) => material.id === id);
      if (!target) throw new Error('Material tidak ditemukan.');

      const addedStock = Math.max(0, Number(input.addedStock) || 0);
      const stockBefore = Number(target.currentStock) || 0;
      const stockAfter = stockBefore + addedStock;

      const { data, error } = await supabase
        .from('materials')
        .update({
          sku: input.sku.trim(),
          name: input.name.trim(),
          category: input.category.trim(),
          unit: input.unit.trim(),
          min_stock: Number(input.minStock ?? 0),
          description: input.description?.trim() || '',
          current_stock: stockAfter,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Gagal memperbarui material.');
      }

      // Catat penambahan sebagai transaksi MASUK agar muncul di Logbook.
      if (addedStock > 0) {
        const { error: logError } = await supabase
          .from('stock_logs')
          .insert({
            material_id: target.id,
            material_sku: input.sku.trim(),
            material_name: input.name.trim(),
            material_unit: input.unit,
            type: 'MASUK',
            quantity: addedStock,
            stock_before: stockBefore,
            stock_after: stockAfter,
            party: 'Penambahan melalui Edit Material',
            pic:
              profile?.fullName ||
              profile?.username ||
              session?.user?.email?.split('@')[0] ||
              'Staf Gudang',
            notes: 'Penambahan stok melalui menu Edit Material',
          });

        if (logError) {
          // Stok sudah ter-update; tampilkan pesan eksplisit agar kegagalan log tidak tersembunyi.
          throw new Error(
            `Stok berhasil diperbarui menjadi ${stockAfter} ${input.unit}, tetapi riwayat transaksi gagal disimpan: ${logError.message}`
          );
        }
      }

      const updated = mapMaterialRow(data);
      await fetchWarehouseData();
      pushToast(
        'success',
        'Material berhasil diperbarui',
        addedStock > 0
          ? `${updated.name}: ${stockBefore} + ${addedStock} = ${stockAfter} ${updated.unit}`
          : `${updated.sku} — ${updated.name}`
      );
    },
    [assertCanEdit, materials, profile, session, fetchWarehouseData, pushToast]
  );

  const handleSubmitTransaction = useCallback(
    async (payload: StockTransactionInput & { description?: string }) => {
      assertCanEdit();

      if (!supabase) {
        throw new Error(
          'Konfigurasi Supabase belum terbaca (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
        );
      }

      const target = materials.find((m) => m.id === payload.materialId);
      if (!target) {
        throw new Error('Material tidak ditemukan.');
      }

      const qty = Number(payload.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error('Jumlah transaksi harus lebih dari 0.');
      }

      const stockBefore = Number(target.currentStock);
      const stockAfter = payload.type === 'MASUK' ? stockBefore + qty : stockBefore - qty;

      if (stockAfter < 0) {
        throw new Error(`Stok tidak mencukupi (tersedia ${stockBefore} ${target.unit}).`);
      }

      const { error: updateErr } = await supabase
        .from('materials')
        .update({
          current_stock: stockAfter,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target.id);

      if (updateErr) {
        throw new Error(updateErr.message || 'Gagal memperbarui stok material.');
      }

      const partyValue = payload.party.trim();
      const picValue =
        payload.type === 'KELUAR'
          ? payload.pic?.trim() || '-'
          : payload.pic?.trim() ||
            profile?.fullName ||
            profile?.username ||
            session?.user?.email?.split('@')[0] ||
            'Staf Gudang';
      const descriptionValue = payload.description?.trim() || payload.notes?.trim() || '';

      const { data: logRow, error: logErr } = await supabase
        .from('stock_logs')
        .insert({
          material_id: target.id,
          material_sku: target.sku,
          material_name: target.name,
          material_unit: target.unit,
          type: payload.type,
          quantity: qty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          party: partyValue,
          pic: picValue,
          notes: descriptionValue,
        })
        .select()
        .single();

      if (logErr) {
        throw new Error(logErr.message || 'Gagal mencatat logbook transaksi.');
      }

      await fetchWarehouseData();
      const log = mapLogRow(logRow);
      pushToast(
        'success',
        log.type === 'MASUK' ? 'Stok Masuk Tercatat' : 'Stok Keluar Tercatat',
        `${log.materialName}: ${log.type === 'MASUK' ? '+' : '-'}${log.quantity} ${log.materialUnit} (Stok akhir: ${log.stockAfter} ${log.materialUnit})`
      );
    },
    [assertCanEdit, materials, profile, session, fetchWarehouseData, pushToast]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 text-sm font-medium">
        Memeriksa sesi login...
      </div>
    );
  }

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <div className="max-w-lg w-full rounded-2xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <h1 className="text-base font-bold text-amber-700 dark:text-amber-400">
            Konfigurasi Supabase Belum Terbaca
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Pastikan variabel <strong>VITE_SUPABASE_URL</strong> dan{' '}
            <strong>VITE_SUPABASE_ANON_KEY</strong> sudah diatur sebagai <strong>Config</strong> di
            pengaturan environment lalu lakukan <strong>Redeploy</strong> ulang.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <LoginView theme={theme} onToggleTheme={toggleTheme} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenTransaction={(type) => handleOpenTransaction(type)}
        criticalCount={criticalCount}
        canEdit={canEdit}
        canManageUsers={profile?.role === 'admin' || profile?.role === 'staff'}
        userName={profile?.fullName || profile?.username || session.user.email || ''}
        roleLabel={getAccessRoleLabel(profile?.role)}
        onLogout={() => handleLogout()}
        notifications={notifications}
        onOpenNotifications={() => handleNavigateMaterials('ALL')}
      >
        {loadError && (
          <div
            role="alert"
            className="mb-5 p-4 rounded-2xl bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5] dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#991B1B] flex items-center justify-between gap-4"
          >
            <span className="text-sm font-semibold">{loadError}</span>
            <button
              type="button"
              onClick={fetchWarehouseData}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/80 dark:bg-black/30 hover:bg-white cursor-pointer whitespace-nowrap"
            >
              Muat Ulang
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            materials={materials}
            logs={logs}
            isLoading={isLoading}
            canEdit={canEdit}
            onQuickTransaction={handleOpenTransaction}
            onNavigateMaterials={handleNavigateMaterials}
            onNavigateLogbook={() => setActiveTab('logbook')}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsView
            materials={materials}
            statusFilter={materialsStatusFilter}
            onStatusFilterChange={setMaterialsStatusFilter}
            canEdit={canEdit}
            onAddMaterial={() => {
              if (!canEdit) {
                pushToast(
                  'info',
                  'Mode Hanya Lihat',
                  'Akun Anda tidak memiliki izin menambah material.'
                );
                return;
              }
              setEditingMaterial(null);
              setMatModalOpen(true);
            }}
            onEditMaterial={(mat) => {
              if (!canEdit) {
                pushToast(
                  'info',
                  'Mode Hanya Lihat',
                  'Akun Anda tidak memiliki izin mengedit material.'
                );
                return;
              }
              setEditingMaterial(mat);
              setMatModalOpen(true);
            }}
            onQuickTransaction={handleOpenTransaction}
          />
        )}

        {activeTab === 'logbook' && <LogbookView logs={logs} />}
        {activeTab === 'activity' && (profile?.role === 'admin' || profile?.role === 'staff') && (
          <ActivityLogPanel profile={profile} onNotify={pushToast} />
        )}
        {activeTab === 'users' && (
          <UserManagementPanel profile={profile} onNotify={pushToast} />
        )}
        {activeTab === 'profile' && (
          <ProfilePanel
            profile={profile}
            onProfileUpdated={setProfile}
            onNotify={pushToast}
            onLogout={handleLogout}
          />
        )}
      </AppShell>

      <TransactionModal
        isOpen={txModalOpen}
        initialType={txInitialType}
        initialMaterialId={txInitialMaterialId}
        materials={materials}
        onClose={() => setTxModalOpen(false)}
        onSubmit={handleSubmitTransaction}
      />

      <MaterialFormModal
        isOpen={matModalOpen}
        editingMaterial={editingMaterial}
        onClose={() => {
          setMatModalOpen(false);
          setEditingMaterial(null);
        }}
        onCreate={handleCreateMaterial}
        onUpdate={handleUpdateMaterial}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}