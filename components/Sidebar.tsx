"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  ShieldCheck,
  LogOut,
  ScanBarcode,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/input", label: "Input Barang", icon: ArrowDownToLine },
  { href: "/output", label: "Output Barang", icon: ArrowUpFromLine },
  { href: "/scan", label: "Scan Barcode", icon: ScanBarcode },
  { href: "/history", label: "History", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const items = isAdmin
    ? [...navItems, { href: "/admin/verify", label: "Verifikasi", icon: ShieldCheck }]
    : navItems;

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            IV
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">Inventaris</p>
            <p className="text-xs text-gray-400">Manajemen Stok</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-gray-800 truncate">{session?.user?.name}</p>
          <p className="text-xs text-gray-400">
            {isAdmin ? "Admin" : "Karyawan"} · {session?.user?.email}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}