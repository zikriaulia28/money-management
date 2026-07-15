import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const household = await prisma.household.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!household) {
      return NextResponse.json({
        balance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        spendingByCategory: [],
        dailyTrend: [],
        recentTransactions: [],
      });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // All transactions for household
    const allTx = await prisma.transaction.findMany({
      where: { user: { householdId: household.id } },
      include: { category: true, user: true },
      orderBy: { date: "desc" },
    });

    // 1. Balance = sum all
    const balance = allTx.reduce((sum, t) => sum + t.amount, 0);

    // 2. Monthly income & expense
    const monthlyTx = allTx.filter((t) => t.date >= monthStart && t.date <= monthEnd);
    const monthlyIncome = monthlyTx
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = monthlyTx
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // 3. Spending by category (this month, expense only)
    const catMap = new Map<string, number>();
    for (const t of monthlyTx) {
      if (t.amount >= 0) continue;
      const name = t.category.name;
      catMap.set(name, (catMap.get(name) || 0) + Math.abs(t.amount));
    }
    const entries = Array.from(catMap);
    const totalCatExpense = entries.reduce((s, [, v]) => s + v, 0);
    const spendingByCategory = entries
      .map(([name, value]) => ({
        name,
        value,
        pct: totalCatExpense > 0 ? Math.round((value / totalCatExpense) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // 4. Daily trend (last 30 days, expense only)
    const expenseTx = allTx
      .filter((t) => t.amount < 0)
      .map((t) => ({ iso: t.date.toISOString().slice(0, 10), amount: Math.abs(t.amount) }));

    const dailyTrend: { day: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const total = expenseTx
        .filter((t) => t.iso === iso)
        .reduce((s, t) => s + t.amount, 0);
      dailyTrend.push({
        day: `${d.getDate()}/${d.getMonth() + 1}`,
        amount: total,
      });
    }

    // 5. Recent 5 transactions
    const recentTransactions = allTx.slice(0, 5).map((t) => ({
      id: t.id,
      name: t.name,
      amount: t.amount,
      category: t.category.name,
      date: t.date.toISOString(),
      user: t.user.role as "Suami" | "Istri",
    }));

    return NextResponse.json({
      balance,
      monthlyIncome,
      monthlyExpense,
      spendingByCategory,
      dailyTrend,
      recentTransactions,
    });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json({ error: "Gagal memuat dashboard" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
