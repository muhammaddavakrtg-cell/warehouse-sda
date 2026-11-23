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
  const [editing