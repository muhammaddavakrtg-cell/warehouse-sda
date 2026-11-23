import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import type {
  CreateMaterialInput,
  Material,
  StockLog,
  StockTransactionInput,
  UpdateMaterialInput,
} from './src/types/warehouse.ts';

interface WarehouseDatabase {
  materials: Material[];
  logs: StockLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'warehouse-db.json');

function buildInitialSeed(): WarehouseDatabase {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 86400 * 1000).toISOString();

  const materials: Material[] = [
    {
      id: 'mat-01',
      qcode: 'ELK-NYM-215',
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
      qcode: 'MEK-BLT-M12',
      name: 'Baut Hex Baja M12 x 50mm Galvanis',
      category: 'Mekanikal',
      unit: 'pcs',
      currentStock: 0,
      minStock: 150,
      location: 'Rak B2-05',
      createdAt: daysAgo(45),
      updatedAt: hoursAgo(4),
    },
    {
      id: 'mat-03',
      qcode: 'PKG-STR-500',
      name: 'Stretch Film Wrapping 50cm x 300m',
      category: 'Packaging',
      unit: 'roll',
      currentStock: 42,
      minStock: 15,
      location: 'Rak C1-01',
      createdAt: daysAgo(25),
      updatedAt: hoursAgo(5),
    },
    {
      id: 'mat-04',
      qcode: 'APD-HLM-PRO',
      name: 'Helm Safety Proyek Standar SNI (Putih)',
      category: 'Safety & APD',
      unit: 'pcs',
      currentStock: 8,
      minStock: 12,
      location: 'Rak D3-04',
      createdAt: daysAgo(60),
      updatedAt: hoursAgo(6),
    },
    {
      id: 'mat-05',
      qcode: 'RAW-PIP-040',
      name: 'Pipa Besi Galvanis Schedule 40 (2 Inch)',
      category: 'Raw Material',
      unit: 'meter',
      currentStock: 120,
      minStock: 40,
      location: 'Zona Outdoor-02',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1),
    },
    {
      id: 'mat-06',
      qcode: 'CON-GLV-NIT',
      name: 'Sarung Tangan Karet Nitrile Heavy Duty',
      category: 'Consumable',
      unit: 'box',
      currentStock: 0,
      minStock: 10,
      location: 'Rak D1-08',
      createdAt: daysAgo(40),
      updatedAt: hoursAgo(3),
    },
    {
      id: 'mat-07',
      qcode: 'MEK-BRG-6205',
      name: 'Bearing SKF 6205-2Z Deep Groove',
      category: 'Mekanikal',
      unit: 'pcs',
      currentStock: 28,
      minStock: 15,
      location: 'Rak B1-01',
      createdAt: daysAgo(18),
      updatedAt: daysAgo(2),
    },
    {
      id: 'mat-08',
      qcode: 'ELK-MCB-16A',
      name: 'MCB Schneider 1 Phase 16A C-Curve',
      category: 'Elektrikal',
      unit: 'pcs',
      currentStock: 9,
      minStock: 10,
      location: 'Rak A2-07',
      createdAt: daysAgo(15),
      updatedAt: hoursAgo(7),
    },
    {
      id: 'mat-09',
      qcode: 'PKG-KRD-L60',
      name: 'Kardus Packing Double Wall 60x40x40cm',
      category: 'Packaging',
      unit: 'pcs',
      currentStock: 185,
      minStock: 50,
      location: 'Rak C2-03',
      createdAt: daysAgo(14),
      updatedAt: daysAgo(1),
    },
    {
      id: 'mat-10',
      qcode: 'CON-LUB-WD4',
      name: 'Cairan Penetran Anti Karat Industrial 412ml',
      category: 'Consumable',
      unit: 'pcs',
      currentStock: 34,
      minStock: 12,
      location: 'Rak B3-09',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(3),
    },
  ];

  const logs: StockLog[] = [
    {
      id: 'log-01',
      materialId: 'mat-01',
      materialqcode: 'ELK-NYM-215',
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
    {
      id: 'log-02',
      materialId: 'mat-06',
      materialqcode: 'CON-GLV-NIT',
      materialName: 'Sarung Tangan Karet Nitrile Heavy Duty',
      materialUnit: 'box',
      type: 'KELUAR',
      quantity: 5,
      stockBefore: 5,
      stockAfter: 0,
      party: 'Tim Maintenance Shift Pagi',
      pic: 'Rina Wijaya',
      notes: 'Pengambilan stok terakhir untuk tim mekanik',
      createdAt: hoursAgo(3),
    },
    {
      id: 'log-03',
      materialId: 'mat-02',
      materialqcode: 'MEK-BLT-M12',
      materialName: 'Baut Hex Baja M12 x 50mm Galvanis',
      materialUnit: 'pcs',
      type: 'KELUAR',
      quantity: 80,
      stockBefore: 80,
      stockAfter: 0,
      party: 'Line Assembly Conveyor #3',
      pic: 'Dimas Pratama',
      notes: 'Perakitan rangka bracket jalur konveyor baru',
      createdAt: hoursAgo(4),
    },
    {
      id: 'log-04',
      materialId: 'mat-03',
      materialqcode: 'PKG-STR-500',
      materialName: 'Stretch Film Wrapping 50cm x 300m',
      materialUnit: 'roll',
      type: 'MASUK',
      quantity: 20,
      stockBefore: 22,
      stockAfter: 42,
      party: 'PT Kemas Jaya Abadi',
      pic: 'Budi Santoso',
      notes: 'PO #2026-1148 diterima sesuai surat jalan',
      createdAt: hoursAgo(5),
    },
    {
      id: 'log-05',
      materialId: 'mat-04',
      materialqcode: 'APD-HLM-PRO',
      materialName: 'Helm Safety Proyek Standar SNI (Putih)',
      materialUnit: 'pcs',
      type: 'KELUAR',
      quantity: 4,
      stockBefore: 12,
      stockAfter: 8,
      party: 'Tim Inspeksi Lapangan',
      pic: 'Rina Wijaya',
      notes: 'Perlengkapan teknisi kontraktor baru',
      createdAt: hoursAgo(6),
    },
    {
      id: 'log-06',
      materialId: 'mat-08',
      materialqcode: 'ELK-MCB-16A',
      materialName: 'MCB Schneider 1 Phase 16A C-Curve',
      materialUnit: 'pcs',
      type: 'KELUAR',
      quantity: 5,
      stockBefore: 14,
      stockAfter: 9,
      party: 'Perbaikan Panel Sektor Barat',
      pic: 'Dimas Pratama',
      notes: 'Penggantian MCB panel distribusi utama',
      createdAt: hoursAgo(7),
    },
    {
      id: 'log-07',
      materialId: 'mat-05',
      materialqcode: 'RAW-PIP-040',
      materialName: 'Pipa Besi Galvanis Schedule 40 (2 Inch)',
      materialUnit: 'meter',
      type: 'MASUK',
      quantity: 60,
      stockBefore: 60,
      stockAfter: 120,
      party: 'CV Baja Makmur Sentosa',
      pic: 'Budi Santoso',
      notes: 'Restock mingguan batch ke-2, kualitas dicek OK',
      createdAt: daysAgo(1),
    },
    {
      id: 'log-08',
      materialId: 'mat-09',
      materialqcode: 'PKG-KRD-L60',
      materialName: 'Kardus Packing Double Wall 60x40x40cm',
      materialUnit: 'pcs',
      type: 'MASUK',
      quantity: 100,
      stockBefore: 85,
      stockAfter: 185,
      party: 'PT Karton Nusantara',
      pic: 'Rina Wijaya',
      notes: 'Restock kemasan pengiriman reguler',
      createdAt: daysAgo(1),
    },
  ];

  return { materials, logs };
}

function ensureDb(): WarehouseDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = buildInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as WarehouseDatabase;
  } catch {
    const seed = buildInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

function saveDb(db: WarehouseDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// In-process mutex queue to guarantee atomic read-modify-write for stock movements
let writeQueue: Promise<unknown> = Promise.resolve();
function runAtomic<T>(fn: (db: WarehouseDatabase) => T): Promise<T> {
  const next = writeQueue.then(() => {
    const db = ensureDb();
    const result = fn(db);
    saveDb(db);
    return result;
  });
  writeQueue = next.catch(() => undefined);
  return next;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GET /api/materials
  app.get('/api/materials', (_req, res) => {
    const db = ensureDb();
    res.json({ materials: db.materials });
  });

  // POST /api/materials
  app.post('/api/materials', async (req, res) => {
    try {
      const payload = req.body as CreateMaterialInput;
      const qcode = String(payload.qcode || '').trim().toUpperCase();
      const name = String(payload.name || '').trim();
      const location = String(payload.location || '').trim();
      const currentStock = Number(payload.currentStock);
      const minStock = Number(payload.minStock);

      if (!qcode || !name || !location) {
        return res.status(400).json({ error: 'qcode, Nama Material, dan Lokasi Rak wajib diisi.' });
      }
      if (!Number.isFinite(currentStock) || currentStock < 0) {
        return res.status(400).json({ error: 'Stok awal tidak boleh kurang dari 0.' });
      }
      if (!Number.isFinite(minStock) || minStock < 0) {
        return res.status(400).json({ error: 'Batas minimum stok tidak boleh kurang dari 0.' });
      }

      const created = await runAtomic((db) => {
        const duplicate = db.materials.find((m) => m.qcode.toUpperCase() === qcode);
        if (duplicate) {
          throw new Error(`qcode "${qcode}" sudah terdaftar pada material "${duplicate.name}".`);
        }
        const nowIso = new Date().toISOString();
        const material: Material = {
          id: `mat-${crypto.randomUUID().slice(0, 8)}`,
          qcode,
          name,
          category: payload.category,
          unit: payload.unit,
          currentStock,
          minStock,
          location,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.materials.unshift(material);

        if (currentStock > 0) {
          db.logs.unshift({
            id: `log-${crypto.randomUUID().slice(0, 8)}`,
            materialId: material.id,
            materialqcode: material.qcode,
            materialName: material.name,
            materialUnit: material.unit,
            type: 'MASUK',
            quantity: currentStock,
            stockBefore: 0,
            stockAfter: currentStock,
            party: 'Saldo Awal Master Material',
            pic: 'Admin Gudang',
            notes: 'Registrasi material baru ke sistem inventaris',
            createdAt: nowIso,
          });
        }
        return material;
      });

      res.status(201).json({ material: created });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Gagal menambahkan material.' });
    }
  });

  // PATCH /api/materials/:id
  app.patch('/api/materials/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body as UpdateMaterialInput;
      const qcode = String(payload.qcode || '').trim().toUpperCase();
      const name = String(payload.name || '').trim();
      const location = String(payload.location || '').trim();
      const minStock = Number(payload.minStock);

      if (!qcode || !name || !location) {
        return res.status(400).json({ error: 'qcode, Nama Material, dan Lokasi Rak wajib diisi.' });
      }
      if (!Number.isFinite(minStock) || minStock < 0) {
        return res.status(400).json({ error: 'Batas minimum stok tidak boleh negatif.' });
      }

      const updated = await runAtomic((db) => {
        const index = db.materials.findIndex((m) => m.id === id);
        if (index === -1) {
          throw new Error('Material tidak ditemukan.');
        }
        const duplicate = db.materials.find((m) => m.id !== id && m.qcode.toUpperCase() === qcode);
        if (duplicate) {
          throw new Error(`qcode "${qcode}" sudah digunakan oleh material lain.`);
        }
        const existing = db.materials[index];
        const next: Material = {
          ...existing,
          qcode,
          name,
          category: payload.category,
          unit: payload.unit,
          minStock,
          location,
          updatedAt: new Date().toISOString(),
        };
        db.materials[index] = next;
        return next;
      });

      res.json({ material: updated });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Gagal memperbarui material.' });
    }
  });

  // POST /api/transactions — Atomic stock in/out matching PostgreSQL RPC record_stock_movement
  app.post('/api/transactions', async (req, res) => {
    try {
      const payload = req.body as StockTransactionInput;
      const quantity = Number(payload.quantity);
      const party = String(payload.party || '').trim();
      const pic = String(payload.pic || '').trim() || 'Staf Gudang';
      const notes = String(payload.notes || '').trim();

      if (!payload.materialId) {
        return res.status(400).json({ error: 'Material harus dipilih.' });
      }
      if (payload.type !== 'MASUK' && payload.type !== 'KELUAR') {
        return res.status(400).json({ error: 'Jenis transaksi harus MASUK atau KELUAR.' });
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Jumlah transaksi harus lebih dari 0.' });
      }
      if (!party) {
        return res.status(400).json({
          error:
            payload.type === 'MASUK'
              ? 'Sumber / Supplier wajib diisi.'
              : 'Pemohon / Proyek wajib diisi.',
        });
      }

      const result = await runAtomic((db) => {
        const index = db.materials.findIndex((m) => m.id === payload.materialId);
        if (index === -1) {
          throw new Error('Material tidak ditemukan.');
        }
        const material = db.materials[index];
        const stockBefore = material.currentStock;
        const stockAfter =
          payload.type === 'MASUK' ? stockBefore + quantity : stockBefore - quantity;

        if (stockAfter < 0) {
          throw new Error(
            `Stok tidak mencukupi! Stok tersedia ${stockBefore} ${material.unit}, diminta ${quantity} ${material.unit}.`
          );
        }

        const nowIso = new Date().toISOString();
        const updatedMaterial: Material = {
          ...material,
          currentStock: stockAfter,
          updatedAt: nowIso,
        };
        db.materials[index] = updatedMaterial;

        const logEntry: StockLog = {
          id: `log-${crypto.randomUUID().slice(0, 8)}`,
          materialId: material.id,
          materialqcode: material.qcode,
          materialName: material.name,
          materialUnit: material.unit,
          type: payload.type,
          quantity,
          stockBefore,
          stockAfter,
          party,
          pic,
          notes,
          createdAt: nowIso,
        };
        db.logs.unshift(logEntry);

        return { material: updatedMaterial, log: logEntry };
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Gagal mencatat transaksi stok.' });
    }
  });

  // GET /api/logs
  app.get('/api/logs', (_req, res) => {
    const db = ensureDb();
    res.json({ logs: db.logs });
  });

  // Vite integration in development / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GudangPro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
