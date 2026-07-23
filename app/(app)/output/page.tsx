"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, ArrowLeft } from "lucide-react";
import { Pencil as PencilIcon, Cpu, Sparkles, Package } from "lucide-react";

type Category = { id: string; name: string; slug: string; icon: string };
type Item = { id: string; name: string; code: string; unit: string; stock: number };
type StockOut = {
  id: string;
  qty: number;
  destination: string;
  createdAt: string;
  item: { name: string; category: { name: string } };
};

const iconMap: Record<string, any> = { Pencil: PencilIcon, Cpu, Sparkles, Package };
const destinations = ["Warehouse", "Accounting", "Security", "HRD", "Produksi", "Lainnya"];

export default function OutputPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [destination, setDestination] = useState("");
  const [customDest, setCustomDest] = useState("");
  const [qty, setQty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [list, setList] = useState<StockOut[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editDest, setEditDest] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/stock-out");
    setList(await res.json());
  }, []);

  async function openCategory(cat: Category) {
    setSelectedCat(cat);
    setSelectedItem(null);
    setMessage("");
    const res = await fetch(`/api/items?category=${cat.slug}`);
    const data: Item[] = await res.json();
    setItems(data.filter((i) => i.stock > 0));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const finalDest = destination === "Lainnya" ? customDest.trim() : destination;
    if (!selectedItem || !qty || !finalDest) return;
    setSubmitting(true);
    const res = await fetch("/api/stock-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: selectedItem.id, qty: Number(qty), destination: finalDest }),
    });
    setSubmitting(false);
    if (res.ok) {
      setMessage("Output barang berhasil dicatat.");
      setSelectedItem(null);
      setQty("");
      setDestination("");
      setCustomDest("");
      if (selectedCat) openCategory(selectedCat);
      loadHistory();
    } else {
      const err = await res.json();
      setMessage(err.error || "Gagal menyimpan data.");
    }
  }

  function startEdit(row: StockOut) {
    setEditingId(row.id);
    setEditQty(String(row.qty));
    setEditDest(row.destination);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/stock-out/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: Number(editQty), destination: editDest }),
    });
    if (res.ok) {
      setEditingId(null);
      loadHistory();
      if (selectedCat) openCategory(selectedCat);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Output Barang</h1>
      <p className="text-gray-500 text-sm mb-6">
        Pilih kategori, lalu barang yang tersedia untuk dikeluarkan dan tujuannya.
      </p>

      {!selectedCat ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Package;
            return (
              <button
                key={cat.id}
                onClick={() => openCategory(cat)}
                className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedCat(null)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={16} /> Kembali ke kategori
          </button>

          <h2 className="font-semibold text-lg text-gray-900 mb-3">{selectedCat.name}</h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-gray-400 text-sm p-4">Tidak ada barang dengan stok tersedia.</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 flex justify-between items-center hover:bg-gray-50 ${
                      selectedItem?.id === item.id ? "bg-brand-50" : ""
                    }`}
                  >
                    <span className="text-sm text-gray-800">{item.name}</span>
                    <span className="text-xs text-gray-400">
                      Stok: {item.stock} {item.unit}
                    </span>
                  </button>
                ))
              )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 h-fit">
              <p className="text-sm font-medium text-gray-700">
                Barang dipilih:{" "}
                <span className="text-brand-700">{selectedItem?.name || "-"}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah
                  {selectedItem && (
                    <span className="text-gray-400 font-normal"> ({selectedItem.unit})</span>
                  )}
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  max={selectedItem?.stock}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  disabled={!selectedItem}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Output</label>
                <select
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={!selectedItem}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
                >
                  <option value="">Pilih tujuan</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              {destination === "Lainnya" && (
                <input
                  required
                  placeholder="Tulis tujuan lain..."
                  value={customDest}
                  onChange={(e) => setCustomDest(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}

              {message && (
                <p className="text-sm rounded-lg px-3 py-2 bg-brand-50 text-brand-700">{message}</p>
              )}

              <button
                type="submit"
                disabled={!selectedItem || submitting}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : "Catat Output Barang"}
              </button>
            </form>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mt-10 mb-3">Output Terbaru</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Barang</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Tujuan</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{row.item.name}</td>
                <td className="px-4 py-3">
                  {editingId === row.id ? (
                    <input
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.qty
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === row.id ? (
                    <input
                      value={editDest}
                      onChange={(e) => setEditDest(e.target.value)}
                      className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.destination
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === row.id ? (
                    <button
                      onClick={() => saveEdit(row.id)}
                      className="text-brand-600 text-xs font-medium hover:underline"
                    >
                      Simpan
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(row)}
                      className="text-gray-400 hover:text-gray-700"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Belum ada data output.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
