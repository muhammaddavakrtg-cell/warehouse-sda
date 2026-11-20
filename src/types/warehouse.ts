export type TransactionType = 'MASUK' | 'KELUAR';

export type StockStatus = 'AMAN' | 'MENIPIS' | 'HABIS';

export type MaterialUnit = 'pcs' | 'kg' | 'roll' | 'box' | 'meter' | 'liter' | 'unit';

export type MaterialCategory =
  | 'Elektrikal'
  | 'Mekanikal'
  | 'Packaging'
  | 'Safety & APD'
  | 'Raw Material'
  | 'Consumable';

export interface Material {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  currentStock: number;
  minStock: number;
  location: string;
  updatedAt: string;
  createdAt: string;
}

export interface StockLog {
  id: string;
  materialId: string;
  materialSku: string;
  materialName: string;
  materialUnit: MaterialUnit;
  type: TransactionType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  party: string; // Supplier (MASUK) atau Pemohon/Proyek (KELUAR)
  pic: string; // Penanggung jawab
  notes: string;
  createdAt: string;
}

export interface CreateMaterialInput {
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  currentStock: number;
  minStock: number;
  location: string;
}

export interface UpdateMaterialInput {
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  minStock: number;
  location: string;
}

export interface StockTransactionInput {
  materialId: string;
  type: TransactionType;
  quantity: number;
  party: string;
  pic: string;
  notes: string;
}

export interface ToastMessage {
  id: string;
  variant: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
