"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Plus, X, Trash2 } from "lucide-react";

type Item = {
  id: string;
  code: string;
  name: string;
  stock: number;
  category: { name: string; slug: string; id: string };
};

export default function CategoryItemsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/items?category=${params.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`
    );
    const data = await res.json();
    setItems(data);
    if (data[0]) {
      setCategoryId(data[0].category.id);
      setCategoryName(data[0].category.name);
    } else if (!categoryName) {
      // fallback: fetch categories to get name/id if no items match
      const catsRes = await fetch("/api/categories");
      const cats = await catsRes.json();
      const found = cats.find((c: any) => c.slug === params.slug);
      if (found) {
        setCategoryId(found.id);
        setCategoryName(found.name);
      }
    }
    setLoading(false);
  }, [params.slug, query]); // eslint-disable-line

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !categoryId) return;
    setSaving(true);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, code: newCode, categoryId }),
    });
    setSaving(false);
    if (res.ok) {
      setNewName("");
      setNewCode("");
      setShowAdd(false);
      load();
    }
  }

  async function handleDeleteItem(item: Item) {
    const confirmed = window.confirm(`Yakin ingin menghapus barang "${item.name}"?`);
    if (!confirmed) return;

    setDeletingId(item.id);
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      load();
    } else {
      const err = await res.json();
      alert(err.error || "Gagal menghapus barang.");
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{categoryName || "..."}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Tambah Barang
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau kode barang..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Memuat barang...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">Tidak ada barang ditemukan.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Nama Barang</th>
                <th className="px-4 py-3 font-medium text-right">Stok</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{item.code}</td>
                  <td className="px-4 py-3 text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.stock > 0
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteItem(item)}
                      disabled={deletingId === item.id}
                      title="Hapus barang"
                      className="text-gray-300 hover:text-red-500 disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900">Tambah Barang Baru</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Barang
                </label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="cth: STAPLER BESAR"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Barang (opsional)
                </label>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Otomatis jika dikosongkan"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Barang"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}