import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createTransactionSchema, updateTransactionSchema } from "@/lib/validations";

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
    const userParam = searchParams.get("user");
    const period = searchParams.get("period");
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "6", 10);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    // Filter by household (Keluarga) - all users share same data
    const household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
    if (household) {
      where.user = { householdId: household.id };
    }

    // Filter by user role (Suami/Istri) - this is what frontend calls with ?user=...
    if (userParam && (userParam === "Suami" || userParam === "Istri")) {
      where.user = {
        ...(where.user as object),
        role: userParam
      };
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

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: { category: true, user: true },
        orderBy: { date: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

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

    return NextResponse.json({ transactions: mapped, total: totalCount });
  } catch (error) {
    console.error("[GET /api/transactions]", error);
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }
    const { name, amount, type, date, category, user: userRole, note } = parsed.data;
    const user = userRole!; // Zod schema guarantees this exists

    let dbUser = await prisma.user.findFirst({ where: { role: user } });
    if (!dbUser) {
      const household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
      if (!household) {
        return NextResponse.json({ error: "Household tidak ditemukan" }, { status: 400 });
      }
      dbUser = await prisma.user.create({
        data: { id: `user-${user.toLowerCase()}`, role: user, name: user, householdId: household.id },
      });
    }

    let dbCat = await prisma.category.findUnique({ where: { name: category! } });
        if (!dbCat) {
          dbCat = await prisma.category.create({
            data: {
              name: category!,
              icon: "MoreHorizontal",
              type: type === "pengeluaran" ? "expense" : "income",
            },
          });
        }

    const tx = await prisma.transaction.create({
      data: {
        name,
        amount: type === "pengeluaran" ? -Math.abs(amount) : Math.abs(amount),
        type,
        date: new Date(date),
        categoryId: dbCat.id,
        userId: dbUser.id,
        note,
      },
      include: { category: true, user: true },
    });

    const mapped = {
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
    };

    return NextResponse.json({ transaction: mapped });
  } catch (error) {
    console.error("[POST /api/transactions]", error);
    return NextResponse.json({ error: "Gagal membuat transaksi" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || body.id;
    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }
    const { name, amount, type, date, category, user: userRole, note } = parsed.data;
    const user = userRole!; // Zod schema guarantees this exists

    let dbUser = await prisma.user.findFirst({ where: { role: user } });
    if (!dbUser) {
      const household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
      if (!household) {
        return NextResponse.json({ error: "Household tidak ditemukan" }, { status: 400 });
      }
      dbUser = await prisma.user.create({
        data: { id: `user-${user.toLowerCase()}`, role: user, name: user, householdId: household.id },
      });
    }

    let dbCat = await prisma.category.findUnique({ where: { name: category! } });
    if (!dbCat) {
      dbCat = await prisma.category.create({
        data: {
          name: category!,
          icon: "MoreHorizontal",
          type: type === "pengeluaran" ? "expense" : "income",
        },
      });
    }

    let tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    tx = await prisma.transaction.update({
      where: { id },
      data: {
        name,
        amount: amount !== undefined ? (type === "pengeluaran" ? -Math.abs(amount) : Math.abs(amount)) : undefined,
        type,
        date: date ? new Date(date) : undefined,  // only set date if provided
        categoryId: dbCat.id,
        userId: dbUser.id,
        note,
      },
      include: { category: true, user: true },
    });

    // Fetch category and user separately for mapping
    const categoryData = await prisma.category.findUnique({ where: { id: dbCat.id } });
    const userData = await prisma.user.findUnique({ where: { id: dbUser.id } });

    // Use the included data for mapping (no need to fetch separately)
    const mapped = {
      id: tx.id,
      name: tx.name,
      amount: tx.amount,
      type: tx.type,
      date: tx.date.toISOString(),
      category: categoryData?.name || "",
      user: userData?.role || "",
      note: tx.note,
      categoryId: categoryData?.id || "",
      categoryIcon: categoryData?.icon || "",
      categoryType: categoryData?.type || "",
    };

    return NextResponse.json({ transaction: mapped });
  } catch (error) {
    console.error("[PUT /api/transactions]", error);
    return NextResponse.json({ error: "Gagal memperbarui transaksi" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    // Check if transaction exists before deleting
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // Reverse side effects if transaction came from saving or debt
    if (existing.sourceType === "saving" && existing.sourceId) {
      const goal = await prisma.savingGoal.findUnique({ where: { id: existing.sourceId } });
      if (goal) {
        const reversedCollected = Math.max(0, goal.collected - Math.abs(existing.amount));
        await prisma.savingGoal.update({
          where: { id: goal.id },
          data: {
            collected: reversedCollected,
            completed: reversedCollected >= goal.target,
          },
        });
        // Delete latest deposit that matches this transaction amount
        await prisma.savingDeposit.deleteMany({
          where: {
            goalId: goal.id,
            amount: Math.abs(existing.amount),
          },
        });
      }
    }

    if (existing.sourceType === "debt" && existing.sourceId) {
      const debt = await prisma.debt.findUnique({ where: { id: existing.sourceId } });
      if (debt) {
        const reversedRemaining = debt.remaining + Math.abs(existing.amount);
        await prisma.debt.update({
          where: { id: debt.id },
          data: {
            remaining: reversedRemaining,
            dueStatus: reversedRemaining > 0 ? "warning" : debt.dueStatus,
          },
        });
      }
    }

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/transactions]", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}