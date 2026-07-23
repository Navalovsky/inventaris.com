import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");

  const stockOuts = await prisma.stockOut.findMany({
    where: {
      ...(categorySlug ? { item: { category: { slug: categorySlug } } } : {}),
    },
    include: {
      item: { include: { category: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(stockOuts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { itemId, qty, destination } = body;

  if (!itemId || !qty || qty <= 0 || !destination) {
    return NextResponse.json({ error: "Data tidak lengkap atau tidak valid" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
  if (item.stock < Number(qty)) {
    return NextResponse.json({ error: `Stok tidak mencukupi. Sisa stok: ${item.stock}` }, { status: 400 });
  }

  const stockOut = await prisma.$transaction(async (tx) => {
    const created = await tx.stockOut.create({
      data: {
        itemId,
        qty: Number(qty),
        destination,
        userId: session.user.id,
      },
      include: { item: true },
    });

    await tx.item.update({
      where: { id: itemId },
      data: { stock: { decrement: Number(qty) } },
    });

    return created;
  });

  return NextResponse.json(stockOut, { status: 201 });
}
