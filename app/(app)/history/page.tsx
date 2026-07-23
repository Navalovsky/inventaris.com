"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">History</h1>
      <p className="text-gray-500 text-sm mb-6">
        Pilih riwayat input atau output barang yang ingin dilihat.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/history/in"
          className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-md transition"
        >
          <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <ArrowDownToLine size={22} />
          </div>
          <h3 className="font-semibold text-gray-900">History Input</h3>
          <p className="text-sm text-gray-400 mt-1">Riwayat penerimaan barang</p>
          <div className="flex items-center gap-1 text-sm text-brand-600 font-medium mt-4 opacity-0 group-hover:opacity-100 transition">
            Lihat riwayat <ChevronRight size={16} />
          </div>
        </Link>

        <Link
          href="/history/out"
          className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-brand-400 hover:shadow-md transition"
        >
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
            <ArrowUpFromLine size={22} />
          </div>
          <h3 className="font-semibold text-gray-900">History Output</h3>
          <p className="text-sm text-gray-400 mt-1">Riwayat pengeluaran barang</p>
          <div className="flex items-center gap-1 text-sm text-brand-600 font-medium mt-4 opacity-0 group-hover:opacity-100 transition">
            Lihat riwayat <ChevronRight size={16} />
          </div>
        </Link>
      </div>
    </div>
  );
}
