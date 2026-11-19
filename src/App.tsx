import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  UserCircle2,
} from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { MaterialModal } from './components/MaterialModal';
import { MaterialsView } from './components/MaterialsView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsView } from './components/TransactionsView';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  createMaterial,
  deleteMaterial,
  fetchMaterials,
  fetchTransactions,
  getSessionUser,
  logoutStaff,
  recordTransaction,
  subscribeToWarehouseUpdates,
  updateMaterial,
} from './lib/warehouseApi';
import type {
  Material,
  MaterialInput,
  MaterialTransaction,
  StaffUser,
  TransactionInput,
  TransactionType,
} from './types/warehouse';

type NavTab = 'dashboard' | 'materials' | 'transactions' | 'account';

export default function App() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Modals state
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txDefaultMaterialId, setTxDefaultMaterialId] = useState<string | undefined>(undefined);
  const [txDefaultType, setTxDefaultType] = useState<TransactionType>('inbound');

  const loadWarehouseData = useCallback(async (silent = false) => {
    if (!silent) setLoadingData(true);
    setDataError(null);
    try {
      const [mats, txs] = await Promise.all([fetchMaterials(), fetchTransactions()]);
      setMaterials(mats);
      setTransactions(txs);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Gagal memuat data gudang.');
    } finally {
      if (!silent) setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getSessionUser()
      .then((sessionUser) => {
        if (mounted) {
          setUser(sessionUser);
          setAuthChecking(false);
        }
      })
      .catch(() => {
        if (mounted) setAuthChecking(false);
      });

    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          setUser(null);
          return;
        }
        const email = session.user.email || 'staf@gudangku.id';
        const fullName =
          typeof session.user.user_metadata?.full_name === 'string' &&
          session.user.user_metadata.full_name.trim()
            ? session.user.user_metadata.full_name
            : email.split('@')[0];
        setUser({
          id: session.user.id,
          email,
          full_name: fullName,
          role: 'Staf Gudang (Supabase)',
        });
      });
      return () => {
        mounted = false;
        data.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    loadWarehouseData();
    const unsubscribe = subscribeToWarehouseUpdates(() => {
      loadWarehouseData(true);
    });
    return () => unsubscribe();
  }, [user, loadWarehouseData]);

  const handleLogout = async () => {
    await logoutStaff();
    setUser(null);
    setMaterials([]);
    setTransactions([]);
    setActiveTab('dashboard');
  };

  const handleSaveMaterial = async (input: MaterialInput, id?: string) => {
    if (id) {
      await updateMaterial(id, input);
    } else {
      await createMaterial(input);
    }
    await loadWarehouseData(true);
  };

  const handleDeleteMaterial = async (id: string) => {
    await deleteMaterial(id);
    await loadWarehouseData(true);
  };

  const handleRecordTransaction = async (input: TransactionInput) => {
    await recordTransaction(input);
    await loadWarehouseData(true);
  };

  const openTransactionModal = (type: TransactionType = 'inbound', materialId?: string) => {
    setTxDefaultType(type);
    setTxDefaultMaterialId(materialId);
    setTxModalOpen(true);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">Memeriksa sesi staf gudang...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginView onAuthenticated={(u) => setUser(u)} />
        <OfflineIndicator />
      </>
    );
  }

  const pageTitleMap: Record<NavTab, string> = {
    dashboard: 'Ringkasan Gudang',
    materials: 'Master Data Material',
    transactions: 'Transaksi Masuk & Keluar',
    account: 'Profil Staf & Aplikasi',
  };

  const lowStockCount = materials.filter((m) => m.current_stock < m.min_stock).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            GudangKu WMS
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Navigasi utama">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full min-h-[42px] px-3.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Ringkasan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`w-full min-h-[42px] px-3.5 rounded-lg flex items-center justify-between text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Boxes className="w-4 h-4 shrink-0" />
              <span>Master Material</span>
            </span>
            {lowStockCount > 0 && (
              <span
                className={`text-xs font-mono tabular-nums ${
                  activeTab === 'materials' ? 'text-amber-300' : 'text-red-700'
                }`}
              >
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`w-full min-h-[42px] px-3.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 shrink-0" />
            <span>Transaksi Stok</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <PWAInstallButton />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {!avatarFailed ? (
                <img
                  src="/src/assets/images/staff_avatar_default_1795057394340.jpg"
                  alt={user.full_name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                  <UserCircle2 className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Keluar"
              aria-label="Keluar dari akun"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-0">
        {/* Top Bar (3-zone contract on desktop, compact 52px on mobile) */}
        <header className="sticky top-0 z-20 h-[52px] lg:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center lg:hidden shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-base lg:text-lg font-semibold tracking-tight text-slate-900 truncate">
              {pageTitleMap[activeTab]}
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => loadWarehouseData(false)}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span>{isSupabaseConfigured ? 'Sinkronisasi Supabase Real-Time' : 'Sinkronisasi Real-Time'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openTransactionModal('inbound')}
              className="min-h-[38px] lg:min-h-[40px] rounded-lg bg-slate-900 px-3.5 lg:px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {dataError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-4 text-xs text-red-800"
            >
              <span>{dataError}</span>
              <button
                type="button"
                onClick={() => loadWarehouseData(false)}
                className="font-semibold underline whitespace-nowrap cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {loadingData && materials.length === 0 ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl" />
                ))}
              </div>
              <div className="h-72 bg-white border border-slate-200 rounded-xl" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  materials={materials}
                  transactions={transactions}
                  onQuickRestock={(matId) => openTransactionModal('inbound', matId)}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'materials' && (
                <MaterialsView
                  materials={materials}
                  onAddMaterial={() => {
                    setEditingMaterial(null);
                    setMaterialModalOpen(true);
                  }}
                  onEditMaterial={(mat) => {
                    setEditingMaterial(mat);
                    setMaterialModalOpen(true);
                  }}
                  onDeleteMaterial={handleDeleteMaterial}
                  onOpenTransaction={(matId) => openTransactionModal('outbound', matId)}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  onRecordInbound={() => openTransactionModal('inbound')}
                  onRecordOutbound={() => openTransactionModal('outbound')}
                />
              )}

              {activeTab === 'account' && (
                <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    {!avatarFailed ? (
                      <img
                        src="/src/assets/images/staff_avatar_default_1795057394340.jpg"
                        alt={user.full_name}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarFailed(true)}
                        className="w-14 h-14 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <UserCircle2 className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">{user.full_name}</h2>
                      <p className="text-xs text-slate-500">
                        {user.email} · {user.role}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <p className="text-xs font-medium text-slate-700">Aplikasi Ponsel (PWA)</p>
                    <PWAInstallButton />
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full min-h-[44px] rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar dari Sesi Staf</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone, <= 60px height) */}
      <nav
        aria-label="Navigasi seluler"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-4 h-[58px]">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
              activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Ringkasan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
              activeTab === 'materials' ? 'text-slate-900' : 'text-slate-500'
            }`}
          >
            <Boxes className="w-5 h-5" />
            <span>Material</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
              activeTab === 'transactions' ? 'text-slate-900' : 'text-slate-500'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span>Transaksi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
              activeTab === 'account' ? 'text-slate-900' : 'text-slate-500'
            }`}
          >
            <UserCircle2 className="w-5 h-5" />
            <span>Akun</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <MaterialModal
        open={materialModalOpen}
        initialMaterial={editingMaterial}
        onClose={() => {
          setMaterialModalOpen(false);
          setEditingMaterial(null);
        }}
        onSave={handleSaveMaterial}
      />

      <TransactionModal
        open={txModalOpen}
        materials={materials}
        defaultMaterialId={txDefaultMaterialId}
        defaultType={txDefaultType}
        onClose={() => setTxModalOpen(false)}
        onSubmit={handleRecordTransaction}
      />

      <OfflineIndicator />
    </div>
  );
}
