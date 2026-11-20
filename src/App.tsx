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
import type {
  CreateMaterialInput,
  Material,
  StockLog,
  StockStatus,
  StockTransactionInput,
  ToastMessage,
  TransactionType,
  UpdateMaterialInput,
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
    location: row.location,
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
    setActiveTab('dashboard');
  }, []);

  const criticalCount = useMemo(
    () => materials.filter((m) => getStockStatus(m.currentStock, m.minStock) !== 'AMAN').length,
    [materials]
  );

  const handleOpenTransaction = useCallback((type: TransactionType, materialId?: string) => {
    setTxInitialType(type);
    setTxInitialMaterialId(materialId);
    setTxModalOpen(true);
  }, []);

  const handleNavigateMaterials = useCallback((statusFilter: StockStatus | 'ALL' = 'ALL') => {
    setMaterialsStatusFilter(statusFilter);
    setActiveTab('materials');
  }, []);

  const handleCreateMaterial = useCallback(
    async (input: CreateMaterialInput) => {
      if (!supabase) {
        throw new Error('Konfigurasi Supabase belum terbaca (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
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
    [fetchWarehouseData, pushToast]
  );

  const handleUpdateMaterial = useCallback(
    async (id: string, input: UpdateMaterialInput) => {
      if (!supabase) {
        throw new Error('Konfigurasi Supabase belum terbaca (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
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
    [fetchWarehouseData, pushToast]
  );

  const handleSubmitTransaction = useCallback(
    async (payload: StockTransactionInput) => {
      if (!supabase) {
        throw new Error('Konfigurasi Supabase belum terbaca (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
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
        payload.pic?.trim() || session?.user?.email?.split('@')[0] || 'Staf Gudang';
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
    [materials, session, fetchWarehouseData, pushToast]
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
      >
        {/* Bar info user login & tombol Keluar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs">
          <div className="text-slate-600 dark:text-slate-300 truncate">
            Login sebagai: <strong className="font-semibold">{session.user.email}</strong>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Keluar
          </button>
        </div>

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
            onAddMaterial={() => {
              setEditingMaterial(null);
              setMatModalOpen(true);
            }}
            onEditMaterial={(mat) => {
              setEditingMaterial(mat);
              setMatModalOpen(true);
            }}
            onQuickTransaction={handleOpenTransaction}
          />
        )}

        {activeTab === 'logbook' && <LogbookView logs={logs} />}
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