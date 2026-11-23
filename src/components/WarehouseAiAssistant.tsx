import { useMemo, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import type { Material, StockLog } from '../types/warehouse';
import { formatNumber, getStockStatus, isToday } from '../utils/warehouse';

interface WarehouseAiAssistantProps {
  materials: Material[];
  logs: StockLog[];
  onQuickRestock?: (materialId: string) => void;
  onBeforeOpen?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  actionMaterialId?: string;
  actionLabel?: string;
}

const QUICK_PROMPTS = [
  'Stok apa saja yang menipis/habis?',
  'Ringkasan aktivitas hari ini',
  'Total stok seluruh material',
  'Saran prioritas restock',
];

export function WarehouseAiAssistant({
  materials,
  logs,
  onQuickRestock,
  onBeforeOpen,
}: WarehouseAiAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo! Saya Asisten AI Inventory SD Plant. Tanyakan stok material (ketik QCODE/nama), daftar stok menipis, atau ringkasan aktivitas hari ini.',
    },
  ]);

  const stats = useMemo(() => {
    const habis = materials.filter((m) => getStockStatus(m.currentStock, m.minStock) === 'HABIS');
    const menipis = materials.filter((m) => getStockStatus(m.currentStock, m.minStock) === 'MENIPIS');
    const todayLogs = logs.filter((l) => isToday(l.createdAt));
    const masukToday = todayLogs.filter((l) => l.type === 'MASUK');
    const keluarToday = todayLogs.filter((l) => l.type === 'KELUAR');
    return { habis, menipis, todayLogs, masukToday, keluarToday };
  }, [materials, logs]);

  const generateReply = (rawQuestion: string): ChatMessage => {
    const q = rawQuestion.trim().toLowerCase();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (
      q.includes('habis') ||
      q.includes('menipis') ||
      q.includes('kritis') ||
      q.includes('restock') ||
      q.includes('prioritas')
    ) {
      const totalKritis = stats.habis.length + stats.menipis.length;
      if (totalKritis === 0) {
        return {
          id,
          sender: 'ai',
          text: 'Semua stok material saat ini dalam kondisi AMAN. Tidak ada item yang habis atau menipis.',
        };
      }

      const lines: string[] = [];
      if (stats.habis.length > 0) {
        lines.push(`🔴 Stok Habis (${stats.habis.length}):`);
        stats.habis.slice(0, 5).forEach((m) => {
          lines.push(`• ${m.sku} — ${m.name} (0 ${m.unit})`);
        });
      }
      if (stats.menipis.length > 0) {
        lines.push(`🟡 Stok Menipis (${stats.menipis.length}):`);
        stats.menipis.slice(0, 5).forEach((m) => {
          lines.push(
            `• ${m.sku} — ${m.name} (sisa ${formatNumber(m.currentStock)}/${formatNumber(m.minStock)} ${m.unit})`
          );
        });
      }

      const topPriority = stats.habis[0] ?? stats.menipis[0];
      return {
        id,
        sender: 'ai',
        text: lines.join('\n'),
        actionMaterialId: topPriority?.id,
        actionLabel: topPriority ? `Restock ${topPriority.sku}` : undefined,
      };
    }

    if (
      q.includes('hari ini') ||
      q.includes('aktivitas') ||
      q.includes('transaksi') ||
      q.includes('ringkasan')
    ) {
      if (stats.todayLogs.length === 0) {
        return {
          id,
          sender: 'ai',
          text: 'Belum ada transaksi masuk maupun keluar yang tercatat hari ini.',
        };
      }
      return {
        id,
        sender: 'ai',
        text: `📊 Ringkasan Aktivitas Hari Ini:\n• Total Transaksi: ${stats.todayLogs.length} kali\n• Material Masuk: ${stats.masukToday.length} transaksi\n• Material Keluar: ${stats.keluarToday.length} transaksi\n• Terakhir: ${stats.todayLogs[0].materialName} (${stats.todayLogs[0].type === 'MASUK' ? '+' : '-'}${stats.todayLogs[0].quantity} ${stats.todayLogs[0].materialUnit})`,
      };
    }

    if (q.includes('total') || q.includes('berapa material') || q.includes('jumlah sku')) {
      return {
        id,
        sender: 'ai',
        text: `📦 Saat ini terdaftar ${formatNumber(materials.length)} SKU material di sistem:\n• Aman: ${formatNumber(materials.length - stats.habis.length - stats.menipis.length)} SKU\n• Menipis: ${formatNumber(stats.menipis.length)} SKU\n• Stok Habis: ${formatNumber(stats.habis.length)} SKU`,
      };
    }

    const matched = materials.filter(
      (m) =>
        m.sku.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        q.includes(m.sku.toLowerCase())
    );

    if (matched.length > 0) {
      const item = matched[0];
      const status = getStockStatus(item.currentStock, item.minStock);
      const extra =
        matched.length > 1
          ? `\n\nDitemukan ${matched.length} material cocok, menampilkan hasil teratas.`
          : '';
      return {
        id,
        sender: 'ai',
        text: `🔎 ${item.sku} — ${item.name}\n• Sisa Stok: ${formatNumber(item.currentStock)} ${item.unit} (Status: ${status})\n• Minimum Stok: ${formatNumber(item.minStock)} ${item.unit}\n• Deskripsi: ${item.description || '-'}${extra}`,
        actionMaterialId: status !== 'AMAN' ? item.id : undefined,
        actionLabel: status !== 'AMAN' ? `Restock ${item.sku}` : undefined,
      };
    }

    return {
      id,
      sender: 'ai',
      text: 'Saya belum menemukan material dengan kata kunci tersebut. Coba ketik kode QCODE (contoh: QC-001), nama material, atau pilih pertanyaan cepat di bawah.',
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
    };
    const aiReply = generateReply(query);

    setMessages((prev) => [...prev, userMsg, aiReply]);
    if (!textToSend) setInput('');
  };

  const handleOpen = () => {
    onBeforeOpen?.();
    setOpen(true);
  };

  return (
    <>
      {/* Tombol Menu di Bawah "Profil Saya" */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1D4ED8] dark:text-[#60A5FA] bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/80 dark:hover:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 transition-colors duration-150 cursor-pointer whitespace-nowrap"
      >
        <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Bantuan AI</span>
      </button>

      {/* Modal Jendela Percakapan AI */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#111827] shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
            {/* Header AI */}
            <div className="px-4 py-3 bg-[#1D4ED8] dark:bg-[#2563EB] text-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight truncate">Asisten AI Gudang</p>
                  <p className="text-[11px] text-blue-100 truncate">Cek stok & ringkasan cepat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup Asisten AI"
                className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Area Percakapan */}
            <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                      m.sender === 'user'
                        ? 'bg-[#1D4ED8] text-white rounded-br-xs'
                        : 'bg-white dark:bg-[#111827] text-[#0F172A] dark:text-[#F9FAFB] border border-[#CBD5E1] dark:border-[#374151] rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.sender === 'ai' && m.actionMaterialId && m.actionLabel && onQuickRestock && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onQuickRestock(m.actionMaterialId!);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#15803D] text-white hover:bg-green-800 cursor-pointer"
                    >
                      <span>+ {m.actionLabel}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pertanyaan Cepat */}
            <div className="px-3 py-2 border-t border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#111827] flex gap-1.5 overflow-x-auto shrink-0">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] dark:border-[#374151] text-[11px] font-semibold text-[#334155] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-gray-800 whitespace-nowrap cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Pertanyaan */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 border-t border-[#CBD5E1] dark:border-[#374151] bg-white dark:bg-[#111827] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik QCODE, nama material, atau tanya..."
                className="flex-1 h-9 px-3 rounded-xl border border-[#CBD5E1] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#090D16] text-xs focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              <button
                type="submit"
                aria-label="Kirim pertanyaan"
                className="w-9 h-9 rounded-xl bg-[#1D4ED8] text-white hover:bg-blue-800 flex items-center justify-center cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}