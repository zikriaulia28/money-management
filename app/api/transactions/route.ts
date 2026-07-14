import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function getPeriodRange(period: string | null) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (!period) return undefined;

  switch (period) {
    case "month": {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "lastMonth": {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "3months": {
      const start = new Date(year, month - 2, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "year": {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    default:
      return undefined;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get("user");
    const period = searchParams.get("period");
    const q = searchParams.get("q");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    // Filter by household (Keluarga) - all users share same data
    const household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
    if (household) {
      where.user = { householdId: household.id };
    }

    const range = getPeriodRange(period);
    if (range) {
      where.date = {
        gte: range.start,
        lte: range.end,
      };
    }

    if (q) {
      where.name = { contains: q };
    }

    if (category && category !== "Semua Kategori") {
      // Cari categoryId dulu
      const cat = await prisma.category.findFirst({
        where: { name: category },
        select: { id: true },
      });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { category: true, user: true },
      orderBy: { date: "desc" },
    });

    // Transform untuk frontend: category & user jadi string
    const mapped = transactions.map(tx => ({
      id: tx.id,
      name: tx.name,
      amount: tx.amount,
      type: tx.type,
      date: tx.date.toISOString(),
      category: tx.category.name,
      user: tx.user.role,
      note: tx.note,
      categoryId: tx.category.id,
      categoryIcon: tx.category.icon,
      categoryType: tx.category.type,
    }));

    return NextResponse.json({ transactions: mapped });
  } catch (error) {
    console.error("[GET /api/transactions]", error);
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, amount, type, date, category, user, note } = body ?? {};

    if (!name || amount == null || !type || !date || !category || !user) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 });
    }

    let household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
    if (!household) {
      household = await prisma.household.create({
        data: { id: "default-household", name: "Keluarga" },
      });
    }

    let dbUser = await prisma.user.findFirst({ where: { role: user } });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: { id: `user-${user.toLowerCase()}`, role: user, name: user, householdId: household.id },
      });
    }

    let dbCat = await prisma.category.findUnique({ where: { name: category } });
    if (!dbCat) {
      dbCat = await prisma.category.create({
        data: { name: category, icon: "Circle", type },
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        name,
        amount: Number(amount),
        type,
        date: new Date(date),
        categoryId: dbCat.id,
        userId: dbUser.id,
        note: note ?? null,
      },
      include: { category: true },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transactions]", error);
    return NextResponse.json({ error: "Gagal menambah transaksi" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, amount, type, date, category, user, note } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: "ID transaksi tidak ditemukan" }, { status: 400 });
    }

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (amount != null) updateData.amount = Number(amount);
    if (type) updateData.type = type;
    if (date) updateData.date = new Date(date);
    if (note !== undefined) updateData.note = note ?? null;

    if (category) {
      let dbCat = await prisma.category.findUnique({ where: { name: category } });
      if (!dbCat) {
        dbCat = await prisma.category.create({
          data: { name: category, icon: "Circle", type: type || "pengeluaran" },
        });
      }
      updateData.categoryId = dbCat.id;
    }

    if (user) {
      const dbUser = await prisma.user.findFirst({ where: { role: user } });
      if (dbUser) updateData.userId = dbUser.id;
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("[PUT /api/transactions]", error);
    return NextResponse.json({ error: "Gagal mengupdate transaksi" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID transaksi tidak ditemukan" }, { status: 400 });
    }
    
    console.log("[DELETE] id:", id);

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/transactions]", error);
    return NextResponse.json({ error: `Gagal menghapus transaksi: ${error instanceof Error ? error.message : "Unknown error"}` }, { status: 500 });
  }
}
