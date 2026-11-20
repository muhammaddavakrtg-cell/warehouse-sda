import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { ensureDb, runAtomic, type CreateMaterialInput, type Material } from './_db.js';

async function readJsonBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body && typeof (req as any).body === 'object') {
    return (req as any).body;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'GET') {
    const db = ensureDb();
    return sendJson(res, 200, { materials: db.materials });
  }

  if (req.method === 'POST') {
    try {
      const payload = (await readJsonBody(req)) as CreateMaterialInput;
      const sku = String(payload.sku || '').trim().toUpperCase();
      const name = String(payload.name || '').trim();
      const location = String(payload.location || '').trim();
      const currentStock = Number(payload.currentStock);
      const minStock = Number(payload.minStock);

      if (!sku || !name || !location) {
        return sendJson(res, 400, { error: 'SKU, Nama Material, dan Lokasi Rak wajib diisi.' });
      }
      if (!Number.isFinite(currentStock) || currentStock < 0) {
        return sendJson(res, 400, { error: 'Stok awal tidak boleh kurang dari 0.' });
      }
      if (!Number.isFinite(minStock) || minStock < 0) {
        return sendJson(res, 400, { error: 'Batas minimum stok tidak boleh kurang dari 0.' });
      }

      const created = await runAtomic((db) => {
        const duplicate = db.materials.find((m) => m.sku.toUpperCase() === sku);
        if (duplicate) {
          throw new Error(`SKU "${sku}" sudah terdaftar pada material "${duplicate.name}".`);
        }
        const nowIso = new Date().toISOString();
        const material: Material = {
          id: `mat-${crypto.randomUUID().slice(0, 8)}`,
          sku,
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
            materialSku: material.sku,
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

      return sendJson(res, 201, { material: created });
    } catch (err: any) {
      return sendJson(res, 400, { error: err?.message || 'Gagal menambahkan material.' });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}