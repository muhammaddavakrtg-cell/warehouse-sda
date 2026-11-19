import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'warehouse.json');
const AUTH_SECRET = process.env.AUTH_SECRET || 'gudangku-local-session-key-2026';

interface StoredStaff {
  id: string;
  email: string;
  full_name: string;
  role: string;
  password_hash: string;
}

interface StoredMaterial {
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

interface StoredTransaction {
  id: string;
  material_id: string;
  material_code: string;
  material_name: string;
  unit: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_no: string;
  notes: string;
  staff_email: string;
  created_at: string;
}

interface WarehouseStore {
  staff: StoredStaff[];
  materials: StoredMaterial[];
  transactions: StoredTransaction[];
}

function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return `${s}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, original] = stored.split(':');
  if (!salt || !original) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(original, 'hex'));
}

function signToken(payload: { id: string; email: string; full_name: string; role: string }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token: string): { id: string; email: string; full_name: string; role: string } | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp < Date.now()) return null;
    return { id: parsed.id, email: parsed.email, full_name: parsed.full_name, role: parsed.role };
  } catch {
    return null;
  }
}

function createInitialSeed(): WarehouseStore {
  const now = Date.now();
  const daysAgo = (d: number, hour = 9) => {
    const dt = new Date(now - d * 86400000);
    dt.setHours(hour, 15, 0, 0);
    return dt.toISOString();
  };

  const materials: StoredMaterial[] = [
    {
      id: 'mat-1',
      code: 'MAT-AL-001',
      name: 'Plat Aluminium 6061 (2mm)',
      category: 'Logam & Plat',
      current_stock: 42,
      unit: 'Lembar',
      min_stock: 25,
      created_at: daysAgo(20),
      updated_at: daysAgo(0),
    },
    {
      id: 'mat-2',
      code: 'MAT-BS-014',
      name: 'Besi Siku Galvanis 40x40',
      category: 'Logam & Plat',
      current_stock: 14,
      unit: 'Pcs',
      min_stock: 30,
      created_at: daysAgo(18),
      updated_at: daysAgo(1),
    },
    {
      id: 'mat-3',
      code: 'MAT-FS-102',
      name: 'Baut Flange M10 Stainless 304',
      category: 'Fastener & Baut',
      current_stock: 680,
      unit: 'Pcs',
      min_stock: 250,
      created_at: daysAgo(16),
      updated_at: daysAgo(0),
    },
    {
      id: 'mat-4',
      code: 'MAT-EL-029',
      name: 'Kabel NYYHY 3x2.5mm Supreme',
      category: 'Kelistrikan',
      current_stock: 4,
      unit: 'Roll',
      min_stock: 10,
      created_at: daysAgo(15),
      updated_at: daysAgo(1),
    },
    {
      id: 'mat-5',
      code: 'MAT-PP-008',
      name: 'Pipa Seamless Schedule 40 (2 Inch)',
      category: 'Pipa & Fitting',
      current_stock: 86,
      unit: 'Meter',
      min_stock: 40,
      created_at: daysAgo(14),
      updated_at: daysAgo(2),
    },
    {
      id: 'mat-6',
      code: 'MAT-KM-005',
      name: 'Karton Box Heavy Duty Double Wall',
      category: 'Kemasan & Palet',
      current_stock: 110,
      unit: 'Box',
      min_stock: 150,
      created_at: daysAgo(12),
      updated_at: daysAgo(0),
    },
    {
      id: 'mat-7',
      code: 'MAT-CH-019',
      name: 'Pelumas Hidrolik ISO VG 46',
      category: 'Bahan Kimia',
      current_stock: 95,
      unit: 'Liter',
      min_stock: 60,
      created_at: daysAgo(10),
      updated_at: daysAgo(2),
    },
    {
      id: 'mat-8',
      code: 'MAT-EL-044',
      name: 'MCB 3 Phase 32A Schneider',
      category: 'Kelistrikan',
      current_stock: 18,
      unit: 'Pcs',
      min_stock: 20,
      created_at: daysAgo(9),
      updated_at: daysAgo(0),
    },
  ];

  const transactions: StoredTransaction[] = [
    {
      id: 'tx-1',
      material_id: 'mat-1',
      material_code: 'MAT-AL-001',
      material_name: 'Plat Aluminium 6061 (2mm)',
      unit: 'Lembar',
      type: 'inbound',
      quantity: 30,
      stock_before: 24,
      stock_after: 54,
      reference_no: 'SJ-2026-0841',
      notes: 'Pengiriman batch rutin vendor PT Alumindo',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(11, 10),
    },
    {
      id: 'tx-2',
      material_id: 'mat-1',
      material_code: 'MAT-AL-001',
      material_name: 'Plat Aluminium 6061 (2mm)',
      unit: 'Lembar',
      type: 'outbound',
      quantity: 12,
      stock_before: 54,
      stock_after: 42,
      reference_no: 'WO-PROD-412',
      notes: 'Pengambilan lini fabrikasi panel',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(8, 14),
    },
    {
      id: 'tx-3',
      material_id: 'mat-3',
      material_code: 'MAT-FS-102',
      material_name: 'Baut Flange M10 Stainless 304',
      unit: 'Pcs',
      type: 'inbound',
      quantity: 500,
      stock_before: 330,
      stock_after: 830,
      reference_no: 'PO-2026-192',
      notes: 'Restock fastener rak B-04',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(6, 9),
    },
    {
      id: 'tx-4',
      material_id: 'mat-2',
      material_code: 'MAT-BS-014',
      material_name: 'Besi Siku Galvanis 40x40',
      unit: 'Pcs',
      type: 'outbound',
      quantity: 26,
      stock_before: 40,
      stock_after: 14,
      reference_no: 'WO-PROJ-109',
      notes: 'Proyek rangka konveyor zona C',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(5, 11),
    },
    {
      id: 'tx-5',
      material_id: 'mat-5',
      material_code: 'MAT-PP-008',
      material_name: 'Pipa Seamless Schedule 40 (2 Inch)',
      unit: 'Meter',
      type: 'inbound',
      quantity: 60,
      stock_before: 46,
      stock_after: 106,
      reference_no: 'SJ-2026-0879',
      notes: 'Kedatangan kontainer pipa batch 2',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(4, 15),
    },
    {
      id: 'tx-6',
      material_id: 'mat-4',
      material_code: 'MAT-EL-029',
      material_name: 'Kabel NYYHY 3x2.5mm Supreme',
      unit: 'Roll',
      type: 'outbound',
      quantity: 8,
      stock_before: 12,
      stock_after: 4,
      reference_no: 'WO-MNT-088',
      notes: 'Instalasi panel distribusi gudang timur',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(3, 13),
    },
    {
      id: 'tx-7',
      material_id: 'mat-3',
      material_code: 'MAT-FS-102',
      material_name: 'Baut Flange M10 Stainless 304',
      unit: 'Pcs',
      type: 'outbound',
      quantity: 150,
      stock_before: 830,
      stock_after: 680,
      reference_no: 'WO-ASM-221',
      notes: 'Perakitan modul rangka batch #14',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(2, 10),
    },
    {
      id: 'tx-8',
      material_id: 'mat-6',
      material_code: 'MAT-KM-005',
      material_name: 'Karton Box Heavy Duty Double Wall',
      unit: 'Box',
      type: 'outbound',
      quantity: 90,
      stock_before: 200,
      stock_after: 110,
      reference_no: 'DO-EXP-774',
      notes: 'Pengemasan pengiriman ekspor Surabaya',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(1, 16),
    },
    {
      id: 'tx-9',
      material_id: 'mat-7',
      material_code: 'MAT-CH-019',
      material_name: 'Pelumas Hidrolik ISO VG 46',
      unit: 'Liter',
      type: 'inbound',
      quantity: 40,
      stock_before: 55,
      stock_after: 95,
      reference_no: 'SJ-2026-0912',
      notes: 'Pengisian drum penyimpanan bahan kimia',
      staff_email: 'staf@gudangku.id',
      created_at: daysAgo(0, 8),
    },
  ];

  return {
    staff: [
      {
        id: 'staff-1',
        email: 'staf@gudangku.id',
        full_name: 'Supriadi Pratama',
        role: 'Kepala Shift Gudang',
        password_hash: hashPassword('Gudang2026!'),
      },
    ],
    materials,
    transactions,
  };
}

function loadStore(): WarehouseStore {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const seed = createInitialSeed();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as WarehouseStore;
}

function saveStore(store: WarehouseStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

let store = loadStore();

// SSE clients for real-time updates
const sseClients = new Set<express.Response>();
function broadcastRealtimeEvent(eventType: string, payload: unknown) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    res.write(data);
  }
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Sesi tidak valid. Silakan masuk kembali.' });
    return;
  }
  (req as express.Request & { staffUser: typeof user }).staffUser = user;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // SSE Realtime Stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);

    sseClients.add(res);
    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Auth routes
  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    const staff = store.staff.find((s) => s.email.toLowerCase() === email);
    if (!staff || !verifyPassword(password, staff.password_hash)) {
      res.status(401).json({ error: 'Email atau kata sandi staf salah.' });
      return;
    }

    const user = { id: staff.id, email: staff.email, full_name: staff.full_name, role: staff.role };
    const token = signToken(user);
    res.json({ user, token });
  });

  app.post('/api/auth/register', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const full_name = String(req.body?.full_name || '').trim() || email.split('@')[0];

    if (!email || password.length < 6) {
      res.status(400).json({ error: 'Gunakan email valid dan kata sandi minimal 6 karakter.' });
      return;
    }

    if (store.staff.some((s) => s.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'Email staf sudah terdaftar.' });
      return;
    }

    const newStaff: StoredStaff = {
      id: `staff-${crypto.randomUUID().slice(0, 8)}`,
      email,
      full_name,
      role: 'Staf Operasional Gudang',
      password_hash: hashPassword(password),
    };
    store.staff.push(newStaff);
    saveStore(store);

    const user = { id: newStaff.id, email: newStaff.email, full_name: newStaff.full_name, role: newStaff.role };
    const token = signToken(user);
    res.status(201).json({ user, token });
  });

  app.get('/api/auth/session', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const user = verifyToken(token);
    if (!user) {
      res.status(401).json({ user: null });
      return;
    }
    res.json({ user });
  });

  // Materials CRUD
  app.get('/api/materials', requireAuth, (_req, res) => {
    const sorted = [...store.materials].sort((a, b) => a.code.localeCompare(b.code));
    res.json(sorted);
  });

  app.post('/api/materials', requireAuth, (req, res) => {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const name = String(req.body?.name || '').trim();
    const category = String(req.body?.category || '').trim();
    const unit = String(req.body?.unit || '').trim();
    const current_stock = Number(req.body?.current_stock ?? 0);
    const min_stock = Number(req.body?.min_stock ?? 0);

    if (!code || !name || !category || !unit) {
      res.status(400).json({ error: 'Kode barang, nama, kategori, dan satuan wajib diisi.' });
      return;
    }
    if (Number.isNaN(current_stock) || current_stock < 0 || Number.isNaN(min_stock) || min_stock < 0) {
      res.status(400).json({ error: 'Stok saat ini dan batas minimum tidak boleh bernilai negatif.' });
      return;
    }
    if (store.materials.some((m) => m.code.toUpperCase() === code)) {
      res.status(409).json({ error: `Kode barang ${code} sudah terdaftar.` });
      return;
    }

    const now = new Date().toISOString();
    const created: StoredMaterial = {
      id: `mat-${crypto.randomUUID().slice(0, 8)}`,
      code,
      name,
      category,
      current_stock: Math.floor(current_stock),
      unit,
      min_stock: Math.floor(min_stock),
      created_at: now,
      updated_at: now,
    };

    store.materials.push(created);
    saveStore(store);
    broadcastRealtimeEvent('warehouse_update', { entity: 'materials', action: 'insert', material: created });
    res.status(201).json(created);
  });

  app.put('/api/materials/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const index = store.materials.findIndex((m) => m.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Material tidak ditemukan.' });
      return;
    }

    const code = String(req.body?.code || '').trim().toUpperCase();
    const name = String(req.body?.name || '').trim();
    const category = String(req.body?.category || '').trim();
    const unit = String(req.body?.unit || '').trim();
    const current_stock = Number(req.body?.current_stock ?? store.materials[index].current_stock);
    const min_stock = Number(req.body?.min_stock ?? store.materials[index].min_stock);

    if (!code || !name || !category || !unit) {
      res.status(400).json({ error: 'Kode barang, nama, kategori, dan satuan wajib diisi.' });
      return;
    }
    if (Number.isNaN(current_stock) || current_stock < 0 || Number.isNaN(min_stock) || min_stock < 0) {
      res.status(400).json({ error: 'Stok dan batas minimum harus 0 atau lebih.' });
      return;
    }
    if (store.materials.some((m) => m.id !== id && m.code.toUpperCase() === code)) {
      res.status(409).json({ error: `Kode barang ${code} sudah digunakan material lain.` });
      return;
    }

    const updated: StoredMaterial = {
      ...store.materials[index],
      code,
      name,
      category,
      current_stock: Math.floor(current_stock),
      unit,
      min_stock: Math.floor(min_stock),
      updated_at: new Date().toISOString(),
    };
    store.materials[index] = updated;
    saveStore(store);
    broadcastRealtimeEvent('warehouse_update', { entity: 'materials', action: 'update', material: updated });
    res.json(updated);
  });

  app.delete('/api/materials/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const index = store.materials.findIndex((m) => m.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Material tidak ditemukan.' });
      return;
    }
    const [removed] = store.materials.splice(index, 1);
    store.transactions = store.transactions.filter((t) => t.material_id !== id);
    saveStore(store);
    broadcastRealtimeEvent('warehouse_update', { entity: 'materials', action: 'delete', id: removed.id });
    res.json({ deleted: true, id: removed.id });
  });

  // Transactions (Inbound & Outbound)
  app.get('/api/transactions', requireAuth, (_req, res) => {
    const sorted = [...store.transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json(sorted);
  });

  app.post('/api/transactions', requireAuth, (req, res) => {
    const staffUser = (req as express.Request & { staffUser: { email: string } }).staffUser;
    const material_id = String(req.body?.material_id || '');
    const type = req.body?.type as 'inbound' | 'outbound';
    const quantity = Math.floor(Number(req.body?.quantity || 0));
    const reference_no = String(req.body?.reference_no || '').trim();
    const notes = String(req.body?.notes || '').trim();

    if (!material_id || (type !== 'inbound' && type !== 'outbound') || quantity <= 0) {
      res.status(400).json({ error: 'Material, tipe transaksi, dan jumlah (> 0) wajib valid.' });
      return;
    }

    const matIndex = store.materials.findIndex((m) => m.id === material_id);
    if (matIndex === -1) {
      res.status(404).json({ error: 'Material tidak ditemukan.' });
      return;
    }

    const material = store.materials[matIndex];
    if (type === 'outbound' && material.current_stock < quantity) {
      res.status(400).json({
        error: `Stok tidak mencukupi. Tersedia ${material.current_stock} ${material.unit}, diminta ${quantity} ${material.unit}.`,
      });
      return;
    }

    const stock_before = material.current_stock;
    const stock_after = type === 'inbound' ? stock_before + quantity : stock_before - quantity;
    const now = new Date().toISOString();

    store.materials[matIndex] = {
      ...material,
      current_stock: stock_after,
      updated_at: now,
    };

    const tx: StoredTransaction = {
      id: `tx-${crypto.randomUUID().slice(0, 8)}`,
      material_id: material.id,
      material_code: material.code,
      material_name: material.name,
      unit: material.unit,
      type,
      quantity,
      stock_before,
      stock_after,
      reference_no: reference_no || (type === 'inbound' ? `SJ-${Date.now().toString().slice(-6)}` : `WO-${Date.now().toString().slice(-6)}`),
      notes,
      staff_email: staffUser.email,
      created_at: now,
    };

    store.transactions.unshift(tx);
    saveStore(store);

    broadcastRealtimeEvent('warehouse_update', {
      entity: 'transactions',
      action: 'insert',
      transaction: tx,
      material: store.materials[matIndex],
    });

    res.status(201).json({ transaction: tx, material: store.materials[matIndex] });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GudangKu WMS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
