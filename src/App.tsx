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
import { WarehouseAiAssistant } from './components/WarehouseAiAssistant';
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
    qcode: row.qcode,
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
    materialqcode: row.material_qcode ?? material?.qcode ?? '-',
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

const IDLE_LIMIT_MINUTES = 1;
const NOTIF_STORAGE_KEY = 'gudangpro-custom-notifications';
const DISMISSED_STOCK_KEY = 'gudangpro-dismissed-stock-notifs';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
  const [txChoiceOpen, setTxChoiceOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [matModalOpen, setMatModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [customNotifications, setCustomNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY);
      const parsed: NotificationItem[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      return parsed.filter((n) => !n.createdAt || now - n.createdAt < SEVEN_DAYS_MS);
    } catch {
      return [];
    }
  });

  const [dismissedStockIds, setDismissedStockIds] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(DISMISSED_STOCK_KEY);
      const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
      const now = Date.now();
      const valid: Record<string, number> = {};
      Object.entries(parsed).forEach(([id, ts]) => {
        if (now - ts < SEVEN_DAYS_MS) valid[id] = ts;
      });
      return valid;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(customNotifications));
    } catch {
      // abaikan jika storage penuh
    }
  }, [customNotifications]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DISMISSED_STOCK_KEY, JSON.stringify(dismissedStockIds));
    } catch {
      // abaikan jika storage penuh
    }
  }, [dismissedStockIds]);

  const handleDismissNotification = useCallback((id: string) => {
    if (id.startsWith('added-')) {
      setCustomNotifications((prev) => prev.filter((n) => n.id !== id));
    } else {
      setDismissedStockIds((prev) => ({ ...prev, [id]: Date.now() }));
    }
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    setCustomNotifications([]);
    setDismissedStockIds((prev) => {
      const next = { ...prev };
      const now = Date.now();
      materials.forEach((m) => {
        if (getStockStatus(m.currentStock, m.minStock) !== 'AMAN') {
          next[m.id] = now;
        }
      });
      return next;
    });
  }, [materials]);

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
        supabase.from('materials').select('*').order('qcode', { ascending: true }),
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
    try {
      window.localStorage.removeItem('gudang-last-activity');
    } catch {
      // abaikan
    }
    setSession(null);
    setProfile(null);
    setActiveTab('dashboard');
  }, []);

  useEffect(() => {
    if (!session) return;

    const IDLE_LIMIT_MS = IDLE_LIMIT_MINUTES * 60 * 1000;
    const ACTIVITY_KEY = 'gudang-last-activity';
    let lastWrite = 0;

    const readLast = () => {
      try {
        return Number(window.localStorage.getItem(ACTIVITY_KEY)) || 0;
      } catch {
        return 0;
      }
    };

    const markActive = () => {
      const now = Date.now();
      if (now - lastWrite < 5000) return; // hemat penulisan
      lastWrite = now;
      try {
        window.localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        // abaikan jika penyimpanan tidak tersedia
      }
    };

    const checkIdle = () => {
      if (document.visibilityState === 'hidden') return;
      const last = readLast();
      if (last && Date.now() - last >= IDLE_LIMIT_MS) {
        try {
          window.sessionStorage.setItem('gudang-idle-logout', '1');
        } catch {
          // abaikan jika penyimpanan tidak tersedia
        }
        handleLogout('LOGOUT_IDLE');
      }
    };

    // cek langsung saat web dibuka; kalau belum lewat batas, tandai aktif
    checkIdle();
    if (!readLast() || Date.now() - readLast() < IDLE_LIMIT_MS) {
      lastWrite = 0;
      markActive();
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));
    document.addEventListener('visibilitychange', checkIdle);
    window.addEventListener('pageshow', checkIdle);
    window.addEventListener('focus', checkIdle);
    const intervalId = window.setInterval(checkIdle, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActive));
      document.removeEventListener('visibilitychange', checkIdle);
      window.removeEventListener('pageshow', checkIdle);
      window.removeEventListener('focus', checkIdle);
      window.clearInterval(intervalId);
    };
  }, [session, handleLogout]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const now = Date.now();
    const activeAdded = customNotifications.filter(
      (n) => !n.createdAt || now - n.createdAt < SEVEN_DAYS_MS
    );

    const stockAlerts = materials
      .map((m) => ({ m, status: getStockStatus(m.currentStock, m.minStock) }))
      .filter((x) => {
        if (x.status === 'AMAN') return false;
        const dismissedAt = dismissedStockIds[x.m.id];
        return !dismissedAt || now - dismissedAt >= SEVEN_DAYS_MS;
      })
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'HABIS' ? -1 : 1))
      .map(({ m, status }) => ({
        id: m.id,
        title: m.name,
        description: `${status === 'HABIS' ? 'Stok habis' : 'Stok menipis'}: ${m.currentStock} ${m.unit} (min. ${m.minStock})`,
        level: status === 'HABIS' ? ('HABIS' as const) : ('MENIPIS' as const),
      }));

    return [...activeAdded, ...stockAlerts];
  }, [customNotifications, materials, dismissedStockIds]);

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

      if (type === 'MASUK') {
        const targetMat = materialId ? materials.find((m) => m.id === materialId) ?? null : null;
        setEditingMaterial(targetMat);
        setMatModalOpen(true);
        return;
      }

      setTxInitialType(type);
      setTxInitialMaterialId(materialId);
      setTxModalOpen(true);
    },
    [canEdit, materials, pushToast]
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

      const normalizedqcode = input.qcode.trim().toUpperCase();
      const qtyToAdd = Math.max(1, Number(input.currentStock ?? 1));

      const existing = materials.find(
        (m) => m.qcode.trim().toUpperCase() === normalizedqcode
      );

      if (existing) {
        const stockBefore = Number(existing.currentStock) || 0;
        const stockAfter = stockBefore + qtyToAdd;

        const { data: updatedRow, error: updateErr } = await supabase
          .from('materials')
          .update({
            current_stock: stockAfter,
            description: input.description?.trim() || existing.description || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateErr) {
          throw new Error(updateErr.message || 'Gagal menambahkan stok ke material yang sudah ada.');
        }

        await supabase.from('stock_logs').insert({
          material_id: existing.id,
          material_qcode: existing.qcode,
          material_name: existing.name,
          material_unit: existing.unit,
          type: 'MASUK',
          quantity: qtyToAdd,
          stock_before: stockBefore,
          stock_after: stockAfter,
          party: 'Penambahan Stok (qcode Terdaftar)',
          pic:
            profile?.fullName ||
            profile?.username ||
            session?.user?.email?.split('@')[0] ||
            'Staf Gudang',
          notes: input.description?.trim() || 'Penambahan stok material masuk',
        });

        const updated = mapMaterialRow(updatedRow);
        setCustomNotifications((prev) => [
          {
            id: `added-${updated.id}-${Date.now()}`,
            title: 'Stok Material Ditambahkan',
            description: `${updated.qcode} — ${updated.name} (+${qtyToAdd} ${updated.unit}, total: ${updated.currentStock} ${updated.unit}).`,
            level: 'ADDED',
            createdAt: Date.now(),
          },
          ...prev,
        ]);

        await fetchWarehouseData();
        pushToast(
          'success',
          'Stok material ditambahkan',
          `${updated.qcode} — ${updated.name} (+${qtyToAdd} ${updated.unit})`
        );
        return;
      }

      const { data, error } = await supabase
        .from('materials')
        .insert({
          qcode: normalizedqcode,
          name: input.name.trim(),
          category: input.category.trim(),
          unit: input.unit.trim(),
          current_stock: qtyToAdd,
          description: input.description?.trim() || '',
          min_stock: Number(input.minStock ?? 0),
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes('materials_qcode_key')) {
          throw new Error(`qcode "${normalizedqcode}" sudah terdaftar. Gunakan menu Edit/Restock atau masukkan qcode berbeda.`);
        }
        throw new Error(error.message || 'Gagal menambahkan material.');
      }

      const created = mapMaterialRow(data);
      setCustomNotifications((prev) => [
        {
          id: `added-${created.id}-${Date.now()}`,
          title: 'Material Baru Ditambahkan',
          description: `${created.qcode} — ${created.name} (${created.currentStock} ${created.unit}) telah ditambahkan.`,
          level: 'ADDED',
          createdAt: Date.now(),
        },
        ...prev,
      ]);

      await fetchWarehouseData();
      pushToast('success', 'Material berhasil ditambahkan', `${created.qcode} — ${created.name}`);
    },
    [assertCanEdit, materials, profile, session, fetchWarehouseData, pushToast]
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
          qcode: input.qcode.trim(),
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

      if (addedStock > 0) {
        const { error: logError } = await supabase
          .from('stock_logs')
          .insert({
            material_id: target.id,
            material_qcode: input.qcode.trim(),
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
          : `${updated.qcode} — ${updated.name}`
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
          material_qcode: target.qcode,
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
      materials={materials}
     logs={logs}
     onQuickRestock={(materialId) => handleOpenTransaction('MASUK', materialId)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenTransaction={(type) => {
          if (type === 'KELUAR') {
            handleOpenTransaction('KELUAR');
            return;
          }
          if (!canEdit) {
            pushToast('info', 'Mode Hanya Lihat', 'Akun Anda tidak memiliki izin mencatat transaksi.');
            return;
          }
          setTxChoiceOpen(true);
        }}
        criticalCount={criticalCount}
        canEdit={canEdit}
        canManageUsers={profile?.role === 'admin' || profile?.role === 'staff'}
        userName={profile?.fullName || profile?.username || session.user.email || ''}
        roleLabel={getAccessRoleLabel(profile?.role)}
        onLogout={() => setLogoutConfirmOpen(true)}
        notifications={notifications}
        onOpenNotifications={() => handleNavigateMaterials('ALL')}
        onDismissNotification={handleDismissNotification}
        onClearAllNotifications={handleClearAllNotifications}
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

      {txChoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Pilih Jenis Transaksi
              </h2>
              <button
                type="button"
                onClick={() => setTxChoiceOpen(false)}
                className="px-2.5 py-1 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTxChoiceOpen(false);
                  setEditingMaterial(null);
                  setMatModalOpen(true);
                }}
                className="p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:border-emerald-500 text-left transition cursor-pointer space-y-1"
              >
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  + Tambah Material
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Input material baru atau stok masuk
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTxChoiceOpen(false);
                  handleOpenTransaction('KELUAR');
                }}
                className="p-4 rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50/70 dark:bg-orange-950/40 hover:border-orange-500 text-left transition cursor-pointer space-y-1"
              >
                <div className="text-sm font-bold text-[#C2410C] dark:text-orange-400">
                  ↗ Material Keluar
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Catat pengambilan & pengurangan stok
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xl font-bold">
              !
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Keluar dari Akun?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin keluar dari sesi aplikasi sekarang?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  handleLogout();
                }}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

  <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}