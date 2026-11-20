import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell, type NavTab } from './components/AppShell';
import { DashboardView } from './components/DashboardView';
import { LogbookView } from './components/LogbookView';
import { MaterialFormModal } from './components/MaterialFormModal';
import { MaterialsView } from './components/MaterialsView';
import { ToastContainer } from './components/ToastContainer';
import { TransactionModal } from './components/TransactionModal';
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

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('gudangpro-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

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

  const fetchWarehouseData = useCallback(async () => {
    try {
      setLoadError('');
      const [matRes, logRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/logs'),
      ]);
      if (!matRes.ok || !logRes.ok) {
        throw new Error('Gagal memuat data gudang dari server.');
      }
      const matJson = await matRes.json();
      const logJson = await logRes.json();
      setMaterials(matJson.materials ?? []);
      setLogs(logJson.logs ?? []);
    } catch (err: any) {
      setLoadError(err?.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouseData();
  }, [fetchWarehouseData]);

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
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambahkan material.');
      }
      await fetchWarehouseData();
      pushToast(
        'success',
        'Material berhasil ditambahkan',
        `${data.material.sku} — ${data.material.name}`
      );
    },
    [fetchWarehouseData, pushToast]
  );

  const handleUpdateMaterial = useCallback(
    async (id: string, input: UpdateMaterialInput) => {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui material.');
      }
      await fetchWarehouseData();
      pushToast(
        'success',
        'Data material diperbarui',
        `${data.material.sku} — ${data.material.name}`
      );
    },
    [fetchWarehouseData, pushToast]
  );

  const handleSubmitTransaction = useCallback(
    async (payload: StockTransactionInput) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mencatat transaksi stok.');
      }
      await fetchWarehouseData();
      const log = data.log as StockLog;
      pushToast(
        'success',
        log.type === 'MASUK' ? 'Stok Masuk Tercatat' : 'Stok Keluar Tercatat',
        `${log.materialName}: ${log.type === 'MASUK' ? '+' : '-'}${log.quantity} ${log.materialUnit} (Stok akhir: ${log.stockAfter} ${log.materialUnit})`
      );
    },
    [fetchWarehouseData, pushToast]
  );

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
