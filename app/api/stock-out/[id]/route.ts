import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.stockOut.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const { qty, unit, plant, departemen } = body;
  const newQty = qty != null ? Number(qty) : existing.qty;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (newQty !== existing.qty) {
        const diff = newQty - existing.qty; // positive = ambil lebih banyak stok lagi
        const item = await tx.item.findUnique({ where: { id: existing.itemId } });
        if (item && item.stock - diff < 0) {
          throw new Error(`Stok tidak mencukupi. Sisa stok saat ini: ${item.stock}`);
        }
        await tx.item.update({
          where: { id: existing.itemId },
          data: { stock: { decrement: diff } },
        });
      }

      return tx.stockOut.update({
        where: { id: params.id },
        data: {
          ...(qty != null ? { qty: newQty } : {}),
          ...(unit ? { unit } : {}),
          ...(plant ? { plant } : {}),
          ...(departemen ? { departemen } : {}),
        },
        include: { item: true },
      });
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal memperbarui data" }, { status: 400 });
  }
}