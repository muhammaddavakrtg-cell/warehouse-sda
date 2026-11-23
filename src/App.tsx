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
    type: row.movement_type ?? row.type,
    quantity: Number(row.quantity ?? 0),
    stockBefore: Number(row.stock_before ?? 0),
    stockAfter: Number(row.stock_after ?? 0),
    party: row.party,
    pic: row.actor_name ?? row.pic ?? '-',
    notes: row.reference_note ?? row.notes ?? '',
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