import { isSupabaseConfigured, supabase } from './supabase';
import type {
  Material,
  MaterialInput,
  MaterialTransaction,
  StaffUser,
  TransactionInput,
} from '../types/warehouse';

const LOCAL_TOKEN_KEY = 'gudangku_staff_token';

function getLocalToken(): string {
  return localStorage.getItem(LOCAL_TOKEN_KEY) || '';
}

function setLocalToken(token: string): void {
  if (token) {
    localStorage.setItem(LOCAL_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getLocalToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Permintaan gagal (${res.status})`);
  }
  return body as T;
}

function mapSupabaseUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): StaffUser {
  const email = user.email || 'staf@gudangku.id';
  const fullName =
    typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : email.split('@')[0];
  return {
    id: user.id,
    email,
    full_name: fullName,
    role: 'Staf Gudang (Supabase)',
  };
}

export async function getSessionUser(): Promise<StaffUser | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;
    return mapSupabaseUser(data.session.user);
  }

  const token = getLocalToken();
  if (!token) return null;
  try {
    const data = await apiFetch<{ user: StaffUser | null }>('/api/auth/session');
    return data.user;
  } catch {
    setLocalToken('');
    return null;
  }
}

export async function loginStaff(email: string, password: string): Promise<StaffUser> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error(error?.message || 'Gagal masuk dengan akun Supabase.');
    }
    return mapSupabaseUser(data.user);
  }

  const data = await apiFetch<{ user: StaffUser; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setLocalToken(data.token);
  return data.user;
}

export async function registerStaff(email: string, password: string, fullName: string): Promise<StaffUser> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error || !data.user) {
      throw new Error(error?.message || 'Pendaftaran staf gagal.');
    }
    return mapSupabaseUser(data.user);
  }

  const data = await apiFetch<{ user: StaffUser; token: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  setLocalToken(data.token);
  return data.user;
}

export async function logoutStaff(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
    return;
  }
  setLocalToken('');
}

export async function fetchMaterials(): Promise<Material[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('materials').select('*').order('code', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Material[];
  }
  return apiFetch<Material[]>('/api/materials');
}

export async function createMaterial(input: MaterialInput): Promise<Material> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('materials')
      .insert({
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        category: input.category,
        current_stock: input.current_stock,
        unit: input.unit,
        min_stock: input.min_stock,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Material;
  }
  return apiFetch<Material>('/api/materials', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMaterial(id: string, input: MaterialInput): Promise<Material> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('materials')
      .update({
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        category: input.category,
        current_stock: input.current_stock,
        unit: input.unit,
        min_stock: input.min_stock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Material;
  }
  return apiFetch<Material>(`/api/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteMaterial(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  await apiFetch(`/api/materials/${id}`, { method: 'DELETE' });
}

export async function fetchTransactions(): Promise<MaterialTransaction[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data || []) as MaterialTransaction[];
  }
  return apiFetch<MaterialTransaction[]>('/api/transactions');
}

export async function recordTransaction(input: TransactionInput): Promise<MaterialTransaction> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('record_material_transaction', {
      p_material_id: input.material_id,
      p_type: input.type,
      p_quantity: input.quantity,
      p_reference_no: input.reference_no,
      p_notes: input.notes,
    });
    if (error) throw new Error(error.message);
    return data as MaterialTransaction;
  }
  const res = await apiFetch<{ transaction: MaterialTransaction }>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.transaction;
}

export function subscribeToWarehouseUpdates(onUpdate: () => void): () => void {
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel('warehouse-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => onUpdate())
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }

  const evtSource = new EventSource('/api/events');
  evtSource.addEventListener('warehouse_update', () => {
    onUpdate();
  });

  return () => {
    evtSource.close();
  };
}
