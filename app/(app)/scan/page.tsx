"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ScanBarcode,
  Camera,
  X,
  Pencil,
  Trash2,
  Plus,
  MapPin,
  Clock,
} from "lucide-react";

type Movement = {
  id: string;
  fromLocation: string | null;
  toLocation: string;
  note: string | null;
  createdAt: string;
  user: { name: string };
};

type Item = {
  id: string;
  code: string;
  name: string;
  stock: number;
  unit: string;
  location: string | null;
  active: boolean;
  category: { name: string };
  movements: Movement[];
};

type Category = { id: string; name: string; slug: string };

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function ScanPage() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ totalItems: 0, totalCategories: 0, scansToday: 0 });

  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editActive, setEditActive] = useState(true);

  const [showMovement, setShowMovement] = useState(false);
  const [movementLocation, setMovementLocation] = useState("");
  const [movementNote, setMovementNote] = useState("");

  const [showAddItem, setShowAddItem] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [savingNewItem, setSavingNewItem] = useState(false);

  const barcodeSvgRef = useRef<SVGSVGElement>(null);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/scan-stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    loadStats();
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.filter((c: any) => c.slug !== "lainnya")));
  }, [loadStats]);

  // Render barcode visual setiap kali barang berhasil ditemukan.
  useEffect(() => {
    if (item && barcodeSvgRef.current) {
      import("jsbarcode").then(({ default: JsBarcode }) => {
        try {
          JsBarcode(barcodeSvgRef.current, item.code, {
            format: "CODE128",
            displayValue: true,
            height: 60,
            fontSize: 14,
            margin: 8,
          });
        } catch (e) {
          // kode tidak valid untuk format barcode ini, abaikan render
        }
      });
    }
  }, [item]);

  async function lookupBarcode(code: string) {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/items/lookup?code=${encodeURIComponent(code.trim())}`);
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setItem(data);
      loadStats();
    } else {
      const err = await res.json();
      setItem(null);
      setError(err.error || "Barang tidak ditemukan.");
    }
  }

  async function startScanning() {
    setScanning(true);
    setError("");
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText: string) => {
          await stopScanning();
          setBarcodeInput(decodedText);
          lookupBarcode(decodedText);
        },
        () => {
          // frame tanpa barcode terdeteksi, abaikan (dipanggil terus-menerus saat scanning)
        }
      );
    } catch (e) {
      setError(
        "Tidak bisa mengakses kamera. Pastikan browser diizinkan mengakses kamera, dan situs diakses lewat HTTPS (atau localhost)."
      );
      setScanning(false);
    }
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // sudah berhenti, abaikan
      }
    }
    setScanning(false);
  }

  function openEdit() {
    if (!item) return;
    setEditName(item.name);
    setEditLocation(item.location || "");
    setEditActive(item.active);
    setShowEdit(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, location: editLocation, active: editActive }),
    });
    if (res.ok) {
      setShowEdit(false);
      lookupBarcode(item.code);
    }
  }

  async function handleDeleteItem() {
    if (!item) return;
    const confirmed = window.confirm(`Yakin ingin menghapus barang "${item.name}"?`);
    if (!confirmed) return;
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItem(null);
      setBarcodeInput("");
      loadStats();
    } else {
      const err = await res.json();
      alert(err.error || "Gagal menghapus barang.");
    }
  }

  async function submitMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !movementLocation.trim()) return;
    const res = await fetch(`/api/items/${item.id}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toLocation: movementLocation, note: movementNote }),
    });
    if (res.ok) {
      setShowMovement(false);
      setMovementLocation("");
      setMovementNote("");
      lookupBarcode(item.code);
    }
  }

  async function deleteMovement(movementId: string) {
    if (!item) return;
    const confirmed = window.confirm("Hapus riwayat pergerakan ini?");
    if (!confirmed) return;
    const res = await fetch(`/api/items/${item.id}/movements/${movementId}`, {
      method: "DELETE",
    });
    if (res.ok) lookupBarcode(item.code);
  }

  async function handleAddNewItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCategoryId) return;
    setSavingNewItem(true);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newItemName, categoryId: newItemCategoryId }),
    });
    setSavingNewItem(false);
    if (res.ok) {
      const created = await res.json();
      setNewItemName("");
      setNewItemCategoryId("");
      setShowAddItem(false);
      setBarcodeInput(created.code);
      lookupBarcode(created.code);
    }
  }

  function printBarcode() {
    if (!barcodeSvgRef.current || !item) return;
    const svgMarkup = barcodeSvgRef.current.outerHTML;
    const win = window.open("", "_blank", "width=400,height=300");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Barcode - ${item.name}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;padding:20px;">
          <p style="font-weight:600;margin-bottom:8px;">${item.name}</p>
          ${svgMarkup}
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Scan Barcode</h1>
      <p className="text-gray-500 text-sm mb-6">
        Scan atau masukkan barcode untuk melihat detail barang, history pergerakan, dan mengelola
        data.
      </p>

      {/* Kotak input + scan */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3">
            <ScanBarcode size={18} className="text-gray-400 shrink-0" />
            <input
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupBarcode(barcodeInput)}
              placeholder="Masukkan atau scan barcode di sini..."
              className="w-full py-2.5 text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={() => (scanning ? stopScanning() : startScanning())}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium ${
              scanning
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Camera size={16} /> {scanning ? "Stop Kamera" : "Buka Kamera"}
          </button>
          <button
            onClick={() => lookupBarcode(barcodeInput)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg"
          >
            Cari
          </button>
        </div>

        {scanning && (
          <div className="mt-4">
            <div id="barcode-reader" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden" />
            <p className="text-xs text-gray-400 text-center mt-2">
              Arahkan kamera ke barcode barang. Butuh izin kamera browser (perlu HTTPS kecuali di
              localhost).
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-600 mt-3">{error}</p>
        )}
        {loading && <p className="text-sm text-gray-400 mt-3">Mencari barang...</p>}
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAddItem(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Tambah Barang Baru
        </button>
      </div>

      {/* Detail barang */}
      {item && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4">
              <svg ref={barcodeSvgRef}></svg>
              <button
                onClick={printBarcode}
                className="mt-3 text-xs text-brand-600 hover:underline font-medium"
              >
                Cetak barcode ini
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Nama</p>
                <p className="font-semibold text-gray-900">{item.name}</p>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-gray-400">Kategori</p>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                    {item.category.name}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span
                    className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Lokasi</p>
                <p className="text-sm text-gray-700 flex items-center gap-1 mt-0.5">
                  <MapPin size={14} className="text-gray-400" />
                  {item.location || "Belum diatur"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Stok</p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {item.stock} {item.unit}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={handleDeleteItem}
                  className="flex items-center gap-1.5 border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={14} /> Hapus
                </button>
                <button
                  onClick={() => setShowMovement(true)}
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg ml-auto"
                >
                  <Plus size={14} /> Tambah History
                </button>
              </div>
            </div>
          </div>

          {/* History pergerakan */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-3">History Pergerakan</h3>
            {item.movements.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada riwayat pergerakan.</p>
            ) : (
              <div className="space-y-2">
                {item.movements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between gap-3 bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-800">
                          {m.fromLocation ? `${m.fromLocation} → ` : ""}
                          <span className="font-medium">{m.toLocation}</span>
                        </p>
                        {m.note && <p className="text-xs text-gray-500 mt-0.5">{m.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDateTime(m.createdAt)} · oleh {m.user.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMovement(m.id)}
                      className="text-gray-300 hover:text-red-500 shrink-0"
                      title="Hapus riwayat ini"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistik ringkas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400">Total Barang</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400">Kategori</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCategories}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400">Scan Hari Ini</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.scansToday}</p>
        </div>
      </div>

      {/* Modal: Edit barang */}
      {showEdit && item && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900">Edit Barang</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="cth: Gedung A - Lantai 3 - Ruang IT"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Barang aktif digunakan
              </label>
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah history pergerakan */}
      {showMovement && item && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900">Tambah History Pergerakan</h2>
              <button
                onClick={() => setShowMovement(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitMovement} className="space-y-4">
              <p className="text-sm text-gray-500">
                Lokasi saat ini: <span className="font-medium">{item.location || "Belum diatur"}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pindah ke lokasi
                </label>
                <input
                  required
                  value={movementLocation}
                  onChange={(e) => setMovementLocation(e.target.value)}
                  placeholder="cth: Gedung B - Lantai 1 - Gudang"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (opsional)
                </label>
                <input
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="cth: dipindah untuk perbaikan"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg"
              >
                Simpan History
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah barang baru */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900">Tambah Barang Baru</h2>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  required
                  value={newItemCategoryId}
                  onChange={(e) => setNewItemCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Ingin bikin kategori baru dulu? Buka menu Dashboard.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                <input
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="cth: Laptop Dell Latitude 5420"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Barcode akan dibuat otomatis dari kode barang setelah disimpan.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingNewItem}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-60"
              >
                {savingNewItem ? "Menyimpan..." : "Simpan & Buat Barcode"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}