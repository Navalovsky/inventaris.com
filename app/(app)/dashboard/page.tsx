"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Pencil, Cpu, Sparkles, Package, ChevronRight, Plus, X, Trash2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  _count: { items: number };
};

const iconMap: Record<string, any> = {
  Pencil,
  Cpu,
  Sparkles,
  Package,
};

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newCategoryName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    setSaving(false);
    if (res.ok) {
      setNewCategoryName("");
      setShowAdd(false);
      loadCategories();
    } else {
      const err = await res.json();
      setError(err.error || "Gagal menambah kategori.");
    }
  }

  async function handleDeleteCategory(e: React.MouseEvent, cat: Category) {
    e.preventDefault();
    e.stopPropagation();
    if (cat._count.items > 0) {
      alert(
        `Kategori "${cat.name}" tidak bisa dihapus karena masih memiliki ${cat._count.items} barang di dalamnya. Hapus dulu semua barangnya.`
      );
      return;
    }
    const confirmed = window.confirm(`Yakin ingin menghapus kategori "${cat.name}"?`);
    if (!confirmed) return;

    setDeletingId(cat.id);
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      loadCategories();
    } else {
      const err = await res.json();
      alert(err.error || "Gagal menghapus kategori.");
    }
  }

  // Kategori "Lainnya" (catch-all bawaan) disembunyikan dari grid,
  // digantikan tombol "Tambah Kategori" di bawah ini.
  const visibleCategories = categories.filter((c) => c.slug !== "lainnya");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Pilih kategori untuk melihat daftar barang dan stok saat ini.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Memuat kategori...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCategories.map((cat) => {
            const Icon = iconMap[cat.icon] || Package;
            return (
              <Link
                key={cat.id}
                href={`/dashboard/${cat.slug}`}
                className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-md transition"
              >
                <button
                  onClick={(e) => handleDeleteCategory(e, cat)}
                  disabled={deletingId === cat.id}
                  title="Hapus kategori"
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
                <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{cat._count.items} jenis barang</p>
                <div className="flex items-center gap-1 text-sm text-brand-600 font-medium mt-4 opacity-0 group-hover:opacity-100 transition">
                  Lihat barang <ChevronRight size={16} />
                </div>
              </Link>
            );
          })}

          <button
            onClick={() => setShowAdd(true)}
            className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border-2 border-dashed border-gray-300 p-6 hover:border-brand-400 hover:bg-brand-50/40 transition text-gray-400 hover:text-brand-600 min-h-[168px]"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
              <Plus size={22} />
            </div>
            <span className="text-sm font-medium">Tambah Kategori</span>
          </button>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900">Tambah Kategori Baru</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kategori
                </label>
                <input
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="cth: Bahan Makanan"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Setelah dibuat, kamu bisa langsung menambahkan barang (misal: keju, saos, dll)
                  ke dalam kategori ini lewat tombol "Tambah Barang".
                </p>
              </div>

              {error && (
                <p className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Kategori"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}