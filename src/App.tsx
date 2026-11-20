import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AppShell, type NavTab } from './components/AppShell';
import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { LogbookView } from './components/LogbookView';
import { MaterialFormModal } from './components/MaterialFormModal';
import { MaterialsView } from './components/MaterialsView';
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
    location: row.location ?? '',
    updatedAt: row.updated_at ?? '',
    createdAt: row.created_at ?? '',
  };
}

function mapLogRow(row: any): StockLog {
  return {
    id: row.id,
    materialId: row.material_id,
    materialSku: row.material_sku,
    materialName: row.material_name,
    materialUnit: row.material_unit,
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
  const [profileLoading, setProfileLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [materialsStatusFilter, setMaterialsStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Modal states
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txInitialType, setTxInitialType] = useState<TransactionType>('MASUK');
  const [txInitialMaterialId, setTxInitialMaterialId] = useState<string | undefined>(undefined);

  const [matModalOpen, setMatModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Toasts
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

  // Sync Tailwind v4 .dark class on <html>
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

  // Pantau status sesi login Supabase
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

  // Ambil profil, level, dan izin akses pengguna yang sedang login
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
      .select('id, username, full_name, email, role, can_edit')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;

        const roleValue = (data?.role as AccessLevel) || 'viewer';
        const canEditValue =
          typeof data?.can_edit === 'boolean'
            ? data.can_edit
            : roleValue === 'admin' || roleValue === 'editor';

        const fallbackEmail = session.user.email ?? '';
        const fallbackUsername = fallbackEmail.split('@')[0] || 'user';

        setProfile({
          id: session.user.id,
          username: data?.username || fallbackUsername,
          fullName: data?.full_name || data?.username || fallbackUsername,
          email: data?.email || fallbackEmail,
          role: roleValue,
          canEdit: canEditValue,
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
          role: 'viewer',
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

      setMaterials((matRes.data ?? []).map(mapMaterialRow));
      setLogs((logRes.data ?? []).map(mapLogRow));
    } catch (err: any) {
      setLoadError(err?.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchWarehouseData();
  }, [fetchWarehouseData]);

  const handleLogout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
    setActiveTab('dashboard');
  }, []);

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

      const newId = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase
        .from('materials')
        .insert({
          id: newId,
          sku: input.sku.trim(),
          name: input.name.trim(),
          category: input.category.trim(),
          unit: input.unit.trim(),
          current_stock: Number(input.currentStock ?? 0),
          min_stock: Number(input.minStock ?? 0),
          location: input.location.trim(),
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
    async (id: string, input: UpdateMaterialInput) => {
      assertCanEdit();

      if (!supabase) {
        throw new Error(
          'Konfigurasi Supabase belum terbaca (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
        );
      }

      const { data, error } = await supabase
        .from('materials')
        .update({
          sku: input.sku.trim(),
          name: input.name.trim(),
          category: input.category.trim(),
          unit: input.unit.trim(),
          min_stock: Number(input.minStock ?? 0),
          location: input.location.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Gagal memperbarui material.');
      }

      const updated = mapMaterialRow(data);
      await fetchWarehouseData();
      pushToast('success', 'Data material diperbarui', `${updated.sku} — ${updated.name}`);
    },
    [assertCanEdit, fetchWarehouseData, pushToast]
  );

  const handleSubmitTransaction = useCallback(
    async (payload: StockTransactionInput) => {
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

      const defaultPic =
        payload.pic?.trim() ||
        profile?.fullName ||
        profile?.username ||
        session?.user?.email?.split('@')[0] ||
        'Staf Gudang';
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const { data: logRow, error: logErr } = await supabase
        .from('stock_logs')
        .insert({
          id: logId,
          material_id: target.id,
          material_sku: target.sku,
          material_name: target.name,
          material_unit: target.unit,
          type: payload.type,
          quantity: qty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          party: payload.party.trim(),
          pic: defaultPic,
          notes: payload.notes?.trim() ?? '',
        })
        .select()
        .single