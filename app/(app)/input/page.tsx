"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Check, Clock, XCircle } from "lucide-react";
import SearchableSelect from "@/components/SearchLabelSelect";

type Category = { id: string; name: string; slug: string };
type Item = { id: string; name: string; code: string; unit: string };
type StockIn = {
  id: string;
  qty: number;
  totalPrice: number;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  item: { name: string; code: string; unit: string; category: { name: string } };
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};
const statusLabel: Record<string, string> = {
  PENDING: "Menunggu Verifikasi",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
};

export default function InputPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [list, setList] = useState<StockIn[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
    loadHistory();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setItems([]);
      return;
    }
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    fetch(`/api/items?category=${cat.slug}`)
      .then((r) => r.json())
      .then(setItems);
  }, [categoryId, categories]);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/stock-in");
    const data = await res.json();
    setList(data);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!itemId || !qty || !totalPrice) return;
    setSubmitting(true);
    const res = await fetch("/api/stock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, qty: Number(qty), totalPrice: Number(totalPrice) }),
    });
    setSubmitting(false);
    if (res.ok) {
      setMessage("Input barang berhasil dikirim, menunggu verifikasi admin.");
      setItemId("");
      setQty("");
      setTotalPrice("");
      setCategoryId("");
      loadHistory();
    } else {
      const err = await res.json();
      setMessage(err.error || "Gagal menyimpan data.");
    }
  }

  function startEdit(row: StockIn) {
    setEditingId(row.id);
    setEditQty(String(row.qty));
    setEditPrice(String(row.totalPrice));
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/stock-in/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: Number(editQty), totalPrice: Number(editPrice) }),
    });
    if (res.ok) {
      setEditingId(null);
      loadHistory();
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Input Barang</h1>
      <p className="text-gray-500 text-sm mb-6">
        Catat penerimaan barang baru. Setelah dikirim, data akan menunggu verifikasi admin.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 mb-10"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              required
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setItemId("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barang</label>
            <SearchableSelect
              disabled={!categoryId}
              value={itemId}
              onChange={setItemId}
              placeholder="Pilih barang"
              options={items.map((it) => ({
                id: it.id,
                label: it.name,
                sublabel: it.unit,
              }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Barang
              {itemId && (
                <span className="text-gray-400 font-normal">
                  {" "}
                  ({items.find((i) => i.id === itemId)?.unit || "pcs"})
                </span>
              )}
            </label>
            <input
              required
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="cth: 50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Harga (Rp)</label>
            <input
              required
              type="number"
              min={0}
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="cth: 250000"
            />
          </div>
        </div>

        {message && (
          <p className="text-sm rounded-lg px-3 py-2 bg-brand-50 text-brand-700">{message}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-lg disabled:opacity-60"
        >
          {submitting ? "Mengirim..." : "Kirim Input Barang"}
        </button>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Input Terbaru Saya</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Barang</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Total Harga</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
                    `${row.qty} ${row.item.unit || ""}`
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === row.id ? (
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    `Rp ${row.totalPrice.toLocaleString("id-ID")}`
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[row.status]}`}
                  >
                    {row.status === "PENDING" && <Clock size={12} />}
                    {row.status === "VERIFIED" && <Check size={12} />}
                    {row.status === "REJECTED" && <XCircle size={12} />}
                    {statusLabel[row.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {row.status === "PENDING" &&
                    (editingId === row.id ? (
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
                    ))}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Belum ada data input.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
