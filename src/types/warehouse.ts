export type TransactionType = 'inbound' | 'outbound';

export interface Material {
  id: string;
  code: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialInput {
  code: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  min_stock: number;
}

export interface MaterialTransaction {
  id: string;
  material_id: string;
  material_code: string;
  material_name: string;
  unit: string;
  type: TransactionType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_no: string;
  notes: string;
  staff_email: string;
  created_at: string;
}

export interface TransactionInput {
  material_id: string;
  type: TransactionType;
  quantity: number;
  reference_no: string;
  notes: string;
}

export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export const MATERIAL_CATEGORIES = [
  'Logam & Plat',
  'Fastener & Baut',
  'Kelistrikan',
  'Pipa & Fitting',
  'Kemasan & Palet',
  'Bahan Kimia',
] as const;

export const MATERIAL_UNITS = [
  'Pcs',
  'Lembar',
  'Kg',
  'Meter',
  'Roll',
  'Liter',
  'Box',
  'Set',
] as const;
