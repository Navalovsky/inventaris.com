"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Cpu, Sparkles, Package } from "lucide-react";

type Category = { id: string; name: string; slug: string; icon: string };

const iconMap: Record<string, any> = { Pencil, Cpu, Sparkles, Package };

export default function HistoryTypePage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const typeLabel = params.type === "in" ? "Input" : "Output";

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  if (params.type !== "in" && params.type !== "out") {
    return <p className="p-8 text-gray-500">Tipe history tidak valid.</p>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.push("/history")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} /> Kembali
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">History {typeLabel} — Pilih Kategori</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Package;
          return (
            <Link
              key={cat.id}
              href={`/history/${params.type}/${cat.slug}`}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-md transition"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
