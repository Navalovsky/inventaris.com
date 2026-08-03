import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const categorySlug = searchParams.get("category");

  const stockIns = await prisma.stockIn.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(categorySlug ? { item: { category: { slug: categorySlug } } } : {}),
    },
    include: {
      item: { include: { category: true } },
      user: { select: { id: true, name: true } },
      verifier: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(stockIns);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { itemId, qty, unit, totalPrice } = body;

  if (!itemId || !qty || qty <= 0 || !unit || totalPrice == null || totalPrice < 0) {
    return NextResponse.json({ error: "Data tidak lengkap atau tidak valid" }, { status: 400 });
  }

  const stockIn = await prisma.stockIn.create({
    data: {
      itemId,
      qty: Number(qty),
      unit,
      totalPrice: Number(totalPrice),
      userId: session.user.id,
      status: "PENDING",
    },
    include: { item: true },
  });

  return NextResponse.json(stockIn, { status: 201 });
}