import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const existing = await prisma.stockIn.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  // --- Admin verifies / rejects a pending entry ---
  if (body.action === "verify" || body.action === "reject") {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya admin yang bisa memverifikasi" }, { status: 403 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Data ini sudah diproses" }, { status: 400 });
    }

    const newStatus = body.action === "verify" ? "VERIFIED" : "REJECTED";

    const updated = await prisma.$transaction(async (tx) => {
      const updatedStockIn = await tx.stockIn.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          verifierId: session.user.id,
          verifiedAt: new Date(),
        },
        include: { item: true, user: { select: { name: true } } },
      });

      if (newStatus === "VERIFIED") {
        await tx.item.update({
          where: { id: updatedStockIn.itemId },
          data: { stock: { increment: updatedStockIn.qty } },
        });
      }

      return updatedStockIn;
    });

    return NextResponse.json(updated);
  }

  // --- Owner edits a still-pending entry ---
  if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Data yang sudah diverifikasi tidak bisa diedit" },
      { status: 400 }
    );
  }

  const { qty, totalPrice, itemId } = body;
  const updated = await prisma.stockIn.update({
    where: { id: params.id },
    data: {
      ...(qty ? { qty: Number(qty) } : {}),
      ...(totalPrice != null ? { totalPrice: Number(totalPrice) } : {}),
      ...(itemId ? { itemId } : {}),
    },
    include: { item: true },
  });

  return NextResponse.json(updated);
}
