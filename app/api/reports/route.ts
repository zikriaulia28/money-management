import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // "2026-07"
    if (!monthParam) {
      return NextResponse.json({ error: "Parameter month wajib" }, { status: 400 });
    }

    const [year, month] = monthParam.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59);

    const [transactions, prevTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: { date: { gte: start, lte: end } },
        include: { category: true, user: true },
        orderBy: { date: "asc" },
      }),
      prisma.transaction.findMany({
        where: { date: { gte: prevStart, lte: prevEnd } },
      }),
    ]);

    // Summary
    let income = 0;
    let expense = 0;
    const catMap: Record<string, { spent: number; count: number }> = {};
    const userMap: Record<string, number> = {};
    const dayMap: Record<string, number> = {};
    const allExpense: typeof transactions = [];

    for (const tx of transactions) {
      if (tx.amount > 0) income += tx.amount;
      else {
        const abs = Math.abs(tx.amount);
        expense += abs;
        allExpense.push(tx);
        const catName = tx.category.name;
        if (!catMap[catName]) catMap[catName] = { spent: 0, count: 0 };
        catMap[catName].spent += abs;
        catMap[catName].count += 1;
        const user = tx.user.role;
        userMap[user] = (userMap[user] || 0) + abs;
      }
      // Daily trend (all transactions)
      const dayKey = tx.date.toISOString().split("T")[0];
      if (tx.amount < 0) {
        dayMap[dayKey] = (dayMap[dayKey] || 0) + Math.abs(tx.amount);
      }
    }

    const balance = income - expense;

    // Spending by category
    const totalCatSpend = Object.values(catMap).reduce((s, v) => s + v.spent, 0);
    const spendingByCategory = Object.entries(catMap)
      .map(([name, { spent, count }]) => ({
        name,
        spent,
        count,
        pct: totalCatSpend > 0 ? Math.round((spent / totalCatSpend) * 100) : 0,
      }))
      .sort((a, b) => b.spent - a.spent);

    // Daily trend (fill all days in month)
    const daysInMonth = end.getDate();
    const dailyTrend: { day: string; amount: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const key = dateObj.toISOString().split("T")[0];
      dailyTrend.push({
        day: String(d),
        amount: dayMap[key] || 0,
      });
    }

    // Top 5 expenses
    const topTransactions = allExpense
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5)
      .map((tx) => ({
        id: tx.id,
        name: tx.name,
        amount: Math.abs(tx.amount),
        category: tx.category.name,
        date: tx.date.toISOString(),
        user: tx.user.role,
      }));

    // Per user
    const perUser = Object.entries(userMap)
      .map(([name, spent]) => ({ name, spent }))
      .sort((a, b) => b.spent - a.spent);

    // Previous month comparison
    let prevIncome = 0;
    let prevExpense = 0;
    for (const tx of prevTransactions) {
      if (tx.amount > 0) prevIncome += tx.amount;
      else prevExpense += Math.abs(tx.amount);
    }

    const incomeDiff = income - prevIncome;
    const expenseDiff = expense - prevExpense;
    const incomePct = prevIncome > 0 ? Math.round((incomeDiff / prevIncome) * 100) : 0;
    const expensePct = prevExpense > 0 ? Math.round((expenseDiff / prevExpense) * 100) : 0;

    return NextResponse.json({
      month: monthParam,
      income,
      expense,
      balance,
      transactionCount: transactions.length,
      spendingByCategory,
      dailyTrend,
      topTransactions,
      perUser,
      comparison: { incomeDiff, expenseDiff, incomePct, expensePct, prevIncome, prevExpense },
    });
  } catch (error) {
    console.error("[GET /api/reports]", error);
    return NextResponse.json({ error: "Gagal memuat laporan" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
