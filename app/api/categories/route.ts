import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name } = body;
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
  }

  const trimmedName = name.trim();
  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: trimmedName }, { slug }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Kategori dengan nama ini sudah ada" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name: trimmedName,
      slug,
      icon: "Package",
    },
  });

  return NextResponse.json(category, { status: 201 });
}