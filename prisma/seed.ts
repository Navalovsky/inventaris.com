import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ---- Users ----
  const karyawanPassword = await bcrypt.hash("karyawan123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "karyawan@company.com" },
    update: {},
    create: {
      name: "Karyawan Gudang",
      email: "karyawan@company.com",
      password: karyawanPassword,
      role: "KARYAWAN",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      name: "Admin Inventaris",
      email: "admin@company.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // ---- Categories ----
  const categories = [
    { name: "ATK", slug: "atk", icon: "Pencil" },
    { name: "Elektronik", slug: "elektronik", icon: "Cpu" },
    { name: "Kebersihan", slug: "kebersihan", icon: "Sparkles" },
    { name: "Lainnya", slug: "lainnya", icon: "Package" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    categoryMap[c.slug] = cat.id;
  }

  // ---- Items from Excel (LIST_ATK.xlsx) ----
  const seedPath = path.join(__dirname, "items_seed.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  const data: { atk: { code: string; name: string }[]; elektronik: { code: string; name: string }[] } =
    JSON.parse(raw);

  for (const item of data.atk) {
    await prisma.item.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        name: item.name,
        stock: 0,
        categoryId: categoryMap["atk"],
      },
    });
  }

  for (const item of data.elektronik) {
    await prisma.item.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        name: item.name,
        stock: 0,
        categoryId: categoryMap["elektronik"],
      },
    });
  }

  console.log(`Seed selesai: ${data.atk.length} item ATK, ${data.elektronik.length} item Elektronik.`);
  console.log("Akun Karyawan -> email: karyawan@company.com | password: karyawan123");
  console.log("Akun Admin    -> email: admin@company.com    | password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
