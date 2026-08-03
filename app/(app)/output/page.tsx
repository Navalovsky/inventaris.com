"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, ArrowLeft } from "lucide-react";
import { Pencil as PencilIcon, Cpu, Sparkles, Package } from "lucide-react";

type Category = { id: string; name: string; slug: string; icon: string };
type StockRow = { itemId: string; itemName: string; itemCode: string; unit: string; available: number };
type StockOut = {
  id: string;
  qty: number;
  unit: string;
  plant: string;
  departemen: string;
  createdAt: string;
  item: { name: string; category: { name: string } };
};

const iconMap: Record<string, any> = { Pencil: PencilIcon, Cpu, Sparkles, Package };
const plants = ["RTE", "RPA", "NUGGET"];
const departemens = [
  "PRODUCTION",
  "MAINTENANCE",
  "PROCUREMENT",
  "LOGISTIC",
  "QC",
  "F&A",
  "PGA",
];
const unitOptions = [
  "pcs", "box", "pack", "rim", "roll", "lusin", "unit", "botol", "set",
  "lembar", "buah", "pasang", "karton", "kg", "gram", "liter", "meter",
  "galon", "sak", "tube", "kaleng",
];

export default function OutputPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<StockRow | null>(null);
  const [unit, setUnit] = useState("");
  const [plant, setPlant] = useState("");
  const [departemen, setDepartemen] = useState("");
  const [qty, setQty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [list, setList] = useState<StockOut[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editPlant, setEditPlant] = useState("");
  const [editDepartemen, setEditDepartemen] = useState("");

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

  // Kategori "Lainnya" (catch-all bawaan) disembunyikan, sama seperti di Dashboard.
  const visibleCategories = categories.filter((c) => c.slug !== "lainnya");

  async function openCategory(cat: Category) {
    setSelectedCat(cat);
    setSelectedRow(null);
    setMessage("");
    const res = await fetch(`/api/output-stock?category=${cat.slug}`);
    const data: StockRow[] = await res.json();
    setStockRows(data);
  }

  function selectRow(row: StockRow) {
    setSelectedRow(row);
    setUnit(row.unit);
    setQty("");
  }

  // Ketika satuan diganti manual, cari sisa stok untuk kombinasi barang+satuan yang baru itu.
  const availableForChosenUnit =
    selectedRow &&
    (stockRows.find((r) => r.itemId === selectedRow.itemId && r.unit === unit)?.available ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!selectedRow || !qty || !unit || !plant || !departemen) return;
    setSubmitting(true);
    const res = await fetch("/api/stock-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: selectedRow.itemId, qty: Number(qty), unit, plant, departemen }),
    });
    setSubmitting(false);
    if (res.ok) {
      setMessage("Output barang berhasil dicatat.");
      setSelectedRow(null);
      setQty("");
      setUnit("");
      setPlant("");
      setDepartemen("");
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
    setEditUnit(row.unit);
    setEditPlant(row.plant);
    setEditDepartemen(row.departemen);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/stock-out/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qty: Number(editQty),
        unit: editUnit,
        plant: editPlant,
        departemen: editDepartemen,
      }),
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
        Pilih kategori, lalu barang & satuan yang tersedia untuk dikeluarkan, plant, dan
        departemen tujuan.
      </p>

      {!selectedCat ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCategories.map((cat) => {
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
              {stockRows.length === 0 ? (
                <p className="text-gray-400 text-sm p-4">Tidak ada barang dengan stok tersedia.</p>
              ) : (
                stockRows.map((row) => (
                  <button
                    key={`${row.itemId}-${row.unit}`}
                    onClick={() => selectRow(row)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 flex justify-between items-center hover:bg-gray-50 ${
                      selectedRow?.itemId === row.itemId && selectedRow?.unit === row.unit
                        ? "bg-brand-50"
                        : ""
                    }`}
                  >
                    <span className="text-sm text-gray-800">{row.itemName}</span>
                    <span className="text-xs text-gray-400">
                      Stok: {row.available} {row.unit}
                    </span>
                  </button>
                ))
              )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 h-fit">
              <p className="text-sm font-medium text-gray-700">
                Barang dipilih:{" "}
                <span className="text-brand-700">{selectedRow?.itemName || "-"}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                <select
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  disabled={!selectedRow}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
                >
                  <option value="">Pilih satuan</option>
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {selectedRow && unit && (
                  <p className="text-xs text-gray-400 mt-1">
                    Sisa stok untuk satuan ini: {availableForChosenUnit ?? 0}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={availableForChosenUnit ?? undefined}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  disabled={!selectedRow}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plant</label>
                <select
                  required
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  disabled={!selectedRow}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
                >
                  <option value="">Pilih plant</option>
                  {plants.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
                <select
                  required
                  value={departemen}
                  onChange={(e) => setDepartemen(e.target.value)}
                  disabled={!selectedRow}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
                >
                  <option value="">Pilih departemen</option>
                  {departemens.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {message && (
                <p className="text-sm rounded-lg px-3 py-2 bg-brand-50 text-brand-700">{message}</p>
              )}

              <button
                type="submit"
                disabled={!selectedRow || submitting}
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
              <th className="px-4 py-3 font-medium">Satuan</th>
              <th className="px-4 py-3 font-medium">Plant</th>
              <th className="px-4 py-3 font-medium">Departemen</th>
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
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    row.qty
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === row.id ? (
                    <select
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="rounded border border-gray-300 px-1 py-1 text-sm"
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    row.unit
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === row.id ? (
                    <select
                      value={editPlant}
                      onChange={(e) => setEditPlant(e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      {plants.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  ) : (
                    row.plant
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === row.id ? (
                    <select
                      value={editDepartemen}
                      onChange={(e) => setEditDepartemen(e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      {departemens.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    row.departemen
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
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
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