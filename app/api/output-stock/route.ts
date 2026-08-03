import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  if (!categorySlug) {
    return NextResponse.json({ error: "Kategori wajib diisi" }, { status: 400 });
  }

  const items = await prisma.item.findMany({
    where: { category: { slug: categorySlug } },
    select: { id: true, name: true, code: true },
  });
  const itemIds = items.map((i) => i.id);
  const itemMap = new Map(items.map((i) => [i.id, i]));

  const inGroups = await prisma.stockIn.groupBy({
    by: ["itemId", "unit"],
    where: { itemId: { in: itemIds }, status: "VERIFIED" },
    _sum: { qty: true },
  });

  const outGroups = await prisma.stockOut.groupBy({
    by: ["itemId", "unit"],
    where: { itemId: { in: itemIds } },
    _sum: { qty: true },
  });

  const balances = new Map<string, number>();
  for (const g of inGroups) {
    const key = `${g.itemId}|${g.unit}`;
    balances.set(key, (balances.get(key) || 0) + (g._sum.qty || 0));
  }
  for (const g of outGroups) {
    const key = `${g.itemId}|${g.unit}`;
    balances.set(key, (balances.get(key) || 0) - (g._sum.qty || 0));
  }

  const result = Array.from(balances.entries())
    .map(([key, available]) => {
      const [itemId, unit] = key.split("|");
      const item = itemMap.get(itemId);
      return {
        itemId,
        itemName: item?.name || "",
        itemCode: item?.code || "",
        unit,
        available,
      };
    })
    .filter((row) => row.available > 0)
    .sort((a, b) => a.itemName.localeCompare(b.itemName));

  return NextResponse.json(result);
}