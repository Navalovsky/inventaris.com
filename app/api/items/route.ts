import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  const items = await prisma.item.findMany({
    where: {
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { code: { contains: q } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, categoryId, code, unit } = body;

  if (!name || !categoryId) {
    return NextResponse.json({ error: "Nama dan kategori wajib diisi" }, { status: 400 });
  }

  const generatedCode = code?.trim() || `ITM-${Date.now().toString(36).toUpperCase()}`;

  const item = await prisma.item.create({
    data: {
      name: name.trim(),
      code: generatedCode,
      unit: unit?.trim() || "pcs",
      categoryId,
      stock: 0,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
