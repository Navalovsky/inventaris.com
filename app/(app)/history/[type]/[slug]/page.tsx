"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type StockIn = {
  id: string;
  qty: number;
  unit: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  item: { name: string; category: { name: string } };
  user: { name: string };
  verifier?: { name: string } | null;
};

type StockOut = {
  id: string;
  qty: number;
  unit: string;
  plant: string;
  departemen: string;
  createdAt: string;
  item: { name: string; category: { name: string } };
  user: { name: string };
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
  };
}

export default function HistoryDetailPage() {
  const params = useParams<{ type: string; slug: string }>();
  const router = useRouter();
  const isIn = params.type === "in";
  const [rows, setRows] = useState<(StockIn | StockOut)[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = isIn ? "/api/stock-in" : "/api/stock-out";
    fetch(`${endpoint}?category=${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        if (data[0]) setCategoryName(data[0].item.category.name);
        setLoading(false);
      });
  }, [isIn, params.slug]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => router.push(`/history/${params.type}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} /> Kembali ke kategori
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        History {isIn ? "Input" : "Output"} — {categoryName || params.slug}
      </h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Memuat riwayat...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada riwayat pada kategori ini.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Jam</th>
                <th className="px-4 py-3 font-medium">Barang</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Satuan</th>
                {isIn ? (
                  <>
                    <th className="px-4 py-3 font-medium">Total Harga</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-medium">Plant</th>
                    <th className="px-4 py-3 font-medium">Departemen</th>
                  </>
                )}
                <th className="px-4 py-3 font-medium">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const { date, time } = formatDate(row.createdAt);
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{date}</td>
                    <td className="px-4 py-3 text-gray-500">{time}</td>
                    <td className="px-4 py-3 text-gray-900">{row.item.name}</td>
                    <td className="px-4 py-3">{row.qty}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {isIn ? (row as StockIn).unit : (row as StockOut).unit}
                    </td>
                    {isIn ? (
                      <>
                        <td className="px-4 py-3">
                          Rp {(row as StockIn).totalPrice.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusStyle[(row as StockIn).status]
                            }`}
                          >
                            {(row as StockIn).status}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-3">{(row as StockOut).plant}</td>
                    )}
                    {!isIn && (
                      <td className="px-4 py-3">{(row as StockOut).departemen}</td>
                    )}
                    <td className="px-4 py-3 text-gray-500">{row.user.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}