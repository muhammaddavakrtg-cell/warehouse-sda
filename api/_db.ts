import fs from 'fs';
import path from 'path';
import type {
  CreateMaterialInput,
  Material,
  StockLog,
  StockTransactionInput,
  UpdateMaterialInput,
} from '../src/types/warehouse.ts';

export interface WarehouseDatabase {
  materials: Material[];
  logs: StockLog[];
}

const SEED_FILE = path.resolve(process.cwd(), 'data', 'warehouse-db.json');
const RUNTIME_DB_FILE = path.join('/tmp', 'warehouse-db.json');

function buildFallbackSeed(): WarehouseDatabase {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 86400 * 1000).toISOString();

  return {
    materials: [
      {
        id: 'mat-01',
        QCODE: 'ELK-NYM-215',
        name: 'Kabel NYM 3x2.5mm Eterna (Roll 50m)',
        category: 'Elektrikal',
        unit: 'roll',
        currentStock: 4,
        minStock: 10,
        location: 'Rak A1-02',
        createdAt: daysAgo(30),
        updatedAt: hoursAgo(2),
      },
      {
        id: 'mat-02',
        QCODE: 'MEK-BLT-M12',
        name: 'Baut Hex Baja M12 x 50mm Galvanis',
        category: 'Mekanikal',
        unit: 'pcs',
        currentStock: 0,
        minStock: 150,
        location: 'Rak B2-05',
        createdAt: daysAgo(45),
        updatedAt: hoursAgo(4),
      },
    ],
    logs: [
      {
        id: 'log-01',
        materialId: 'mat-01',
        materialQCODE: 'ELK-NYM-215',
        materialName: 'Kabel NYM 3x2.5mm Eterna (Roll 50m)',
        materialUnit: 'roll',
        type: 'KELUAR',
        quantity: 6,
        stockBefore: 10,
        stockAfter: 4,
        party: 'Proyek Panel Gudang Timur',
        pic: 'Budi Santoso',
        notes: 'Penarikan kabel instalasi jalur lampu sektor B',
        createdAt: hoursAgo(2),
      },
    ],
  };
}

export function ensureDb(): WarehouseDatabase {
  if (fs.existsSync(RUNTIME_DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(RUNTIME_DB_FILE, 'utf-8')) as WarehouseDatabase;
    } catch {
      // lanjut ke seed
    }
  }

  let initial: WarehouseDatabase;
  if (fs.existsSync(SEED_FILE)) {
    try {
      initial = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8')) as WarehouseDatabase;
    } catch {
      initial = buildFallbackSeed();
    }
  } else {
    initial = buildFallbackSeed();
  }

  saveDb(initial);
  return initial;
}

export function saveDb(db: WarehouseDatabase): void {
  const tempFile = `${RUNTIME_DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempFile, RUNTIME_DB_FILE);
}

let writeQueue: Promise<unknown> = Promise.resolve();
export function runAtomic<T>(fn: (db: WarehouseDatabase) => T): Promise<T> {
  const next = writeQueue.then(() => {
    const db = ensureDb();
    const result = fn(db);
    saveDb(db);
    return result;
  });
  writeQueue = next.catch(() => undefined);
  return next;
}

export type { CreateMaterialInput, Material, StockLog, StockTransactionInput, UpdateMaterialInput };