"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Cpu, Sparkles, Package, ChevronRight } from "lucide-react";

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

useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

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
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Package;
            return (
              <Link
                key={cat.id}
                href={`/dashboard/${cat.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-md transition"
              >
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
        </div>
      )}
    </div>
  );
}
