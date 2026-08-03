import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, location, active } = body;

  const item = await prisma.item.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [stockInCount, stockOutCount] = await Promise.all([
    prisma.stockIn.count({ where: { itemId: params.id } }),
    prisma.stockOut.count({ where: { itemId: params.id } }),
  ]);

  if (stockInCount > 0 || stockOutCount > 0) {
    return NextResponse.json(
      { error: "Barang tidak bisa dihapus karena sudah memiliki riwayat input/output." },
      { status: 400 }
    );
  }

  await prisma.item.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}