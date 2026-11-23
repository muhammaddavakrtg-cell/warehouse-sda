import type { IncomingMessage, ServerResponse } from 'http';
import { runAtomic, type Material, type UpdateMaterialInput } from '../_db.js';

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
  if (req.method !== 'PATCH') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const urlPath = (req.url || '').split('?')[0];
    const id = String((req as any).query?.id || urlPath.split('/').pop() || '');
    const payload = (await readJsonBody(req)) as UpdateMaterialInput;
    const qcode = String(payload.qcode || '').trim().toUpperCase();
    const name = String(payload.name || '').trim();
    const location = String(payload.location || '').trim();
    const minStock = Number(payload.minStock);

    if (!qcode || !name || !location) {
      return sendJson(res, 400, { error: 'qcode, Nama Material, dan Lokasi Rak wajib diisi.' });
    }
    if (!Number.isFinite(minStock) || minStock < 0) {
      return sendJson(res, 400, { error: 'Batas minimum stok tidak boleh negatif.' });
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

    return sendJson(res, 200, { material: updated });
  } catch (err: any) {
    return sendJson(res, 400, { error: err?.message || 'Gagal memperbarui material.' });
  }
}