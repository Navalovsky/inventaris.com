"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, Clock } from "lucide-react";

type StockIn = {
  id: string;
  qty: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  item: { name: string; category: { name: string } };
  user: { name: string };
};

export default function VerifyPage() {
  const [pending, setPending] = useState<StockIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/stock-in?status=PENDING");
    setPending(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "verify" | "reject") {
    setProcessingId(id);
    await fetch(`/api/stock-in/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setProcessingId(null);
    load();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Verifikasi Input Barang</h1>
      <p className="text-gray-500 text-sm mb-6">
        Setujui atau tolak input barang yang dikirim oleh karyawan. Stok akan bertambah otomatis
        setelah disetujui.
      </p>

      {loading ? (
        <p className="text-gray-400 text-sm">Memuat data...</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          Tidak ada input barang yang menunggu verifikasi.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-gray-900">{row.item.name}</p>
                <p className="text-sm text-gray-500">
                  {row.item.category.name} · {row.qty} unit · Rp{" "}
                  {row.totalPrice.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock size={12} /> Diinput oleh {row.user.name} ·{" "}
                  {new Date(row.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(row.id, "verify")}
                  disabled={processingId === row.id}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  <Check size={16} /> Setujui
                </button>
                <button
                  onClick={() => act(row.id, "reject")}
                  disabled={processingId === row.id}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  <X size={16} /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
