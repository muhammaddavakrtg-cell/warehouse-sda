import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { runAtomic, type Material, type StockLog, type StockTransactionInput } from './_db.js';

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
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const payload = (await readJsonBody(req)) as StockTransactionInput;
    const quantity = Number(payload.quantity);
    const party = String(payload.party || '').trim();
    const pic = String(payload.pic || '').trim() || 'Staf Gudang';
    const notes = String(payload.notes || '').trim();

    if (!payload.materialId) {
      return sendJson(res, 400, { error: 'Material harus dipilih.' });
    }
    if (payload.type !== 'MASUK' && payload.type !== 'KELUAR') {
      return sendJson(res, 400, { error: 'Jenis transaksi harus MASUK atau KELUAR.' });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return sendJson(res, 400, { error: 'Jumlah transaksi harus lebih dari 0.' });
    }
    if (!party) {
      return sendJson(res, 400, {
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
        materialSku: material.sku,
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

    return sendJson(res, 201, result);
  } catch (err: any) {
    return sendJson(res, 400, { error: err?.message || 'Gagal mencatat transaksi stok.' });
  }
}