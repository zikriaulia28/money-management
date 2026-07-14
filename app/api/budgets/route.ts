import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createBudgetSchema } from "@/lib/validations";

export const runtime = "nodejs";

function getDefaultHousehold() {
  return prisma.household.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
}

// Hitung total pengeluaran aktual per kategori di bulan tertentu
async function getSpentByCategory(householdId: string, period: string) {
  const start = new Date(`${period}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const txs = await prisma.transaction.findMany({
    where: {
      user: { householdId },
      type: "pengeluaran",
      date: { gte: start, lt: end },
    },
    include: { category: { select: { name: true } } },
  });

  const spent: Record<string, number> = {};
  for (const tx of txs) {
    const name = tx.category.name;
    spent[name] = (spent[name] || 0) + Math.abs(tx.amount);
  }
  return spent;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const periodQuery = url.searchParams.get("period");

    const household = await getDefaultHousehold();
    if (!household) {
      return NextResponse.json({ budgets: [] });
    }

    const where: any = { householdId: household.id };
    if (periodQuery) {
      where.period = periodQuery;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: { select: { id: true, name: true, icon: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Ambil data spent dari transaksi aktual
    const spentMap = periodQuery ? await getSpentByCategory(household.id, periodQuery) : {};

    // Map ke format frontend-friendly
    const result = budgets.map((b) => ({
      id: b.id,
      category: b.category.name,
      amount: b.limit,
      spent: spentMap[b.category.name] || 0,
      month: b.period,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json({ budgets: result });
  } catch (error) {
    console.error("[GET /api/budgets]", error);
    return NextResponse.json({ error: "Gagal memuat budget" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createBudgetSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }
    const { category: categoryName, amount: budgetAmount, month: budgetPeriod } = parsed.data;

    // 1. Dapatkan atau buat Household
    let household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
    if (!household) {
      household = await prisma.household.create({
        data: { id: "default-household", name: "Keluarga" },
      });
    }

    // 2. Resolve Category ID — cari atau buat
    let categoryRecord = await prisma.category.findFirst({ where: { name: categoryName } });
    if (!categoryRecord) {
      // Auto-create jika belum ada
      const isIncome = ["Gaji", "Bonus/THR"].includes(categoryName);
      categoryRecord = await prisma.category.create({
        data: {
          name: categoryName,
          icon: "Circle",
          type: isIncome ? "pemasukan" : "pengeluaran",
        },
      });
    }

    // 3. Upsert budget
    const budget = await prisma.budget.upsert({
      where: {
        categoryId_period_householdId: {
          categoryId: categoryRecord.id,
          period: budgetPeriod,
          householdId: household.id,
        },
      },
      update: { limit: Number(budgetAmount) },
      create: {
        categoryId: categoryRecord.id,
        limit: Number(budgetAmount),
        period: budgetPeriod,
        householdId: household.id,
      },
      include: { category: { select: { name: true } } },
    });

    return NextResponse.json({
      budget: {
        id: budget.id,
        category: budget.category.name,
        amount: budget.limit,
        month: budget.period,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/budgets]", error);
    return NextResponse.json({ error: "Gagal menyimpan budget" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Budget ID tidak valid" }, { status: 400 });
    }

    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/budgets]", error);
    return NextResponse.json({ error: "Gagal menghapus budget" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
