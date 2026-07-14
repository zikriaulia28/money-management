import { PrismaClient } from '@prisma/client';
async function main() {
const p = new PrismaClient();

// Simulasi persis seperti API GET /api/transactions
const household = await p.household.findFirst({ where: { name: "Keluarga" } });
console.log("=== HOUSEHOLD ===", JSON.stringify(household));

const where: Record<string, unknown> = {};
if (household) {
  where.user = { householdId: household.id };
}
console.log("=== WHERE ===", JSON.stringify(where, null, 2));

const transactions = await p.transaction.findMany({
  where: Object.keys(where).length > 0 ? where : undefined,
  include: { category: true, user: true },
  orderBy: { date: "desc" },
  take: 100,
});
console.log(`=== TRANSACTIONS COUNT === ${transactions.length}`);

// Transform persis seperti API
const mapped = transactions.map(tx => ({
  id: tx.id,
  name: tx.name,
  amount: Number(tx.amount),
  type: tx.type,
  date: tx.date.toISOString(),
  category: tx.category.name,
  user: tx.user.role,
  note: tx.note,
  categoryId: tx.category.id,
  categoryIcon: tx.category.icon,
  categoryType: tx.category.type,
}));

// Hitung persis seperti SummaryCards
const totalIncome = mapped.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
const totalExpense = mapped.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
const balance = totalIncome - totalExpense;
console.log(`=== SUMMARY === income=${totalIncome} expense=${totalExpense} balance=${balance}`);

// Cek apakah ada transaksi dengan amount=0
const zeros = mapped.filter(t => t.amount === 0);
console.log(`=== ZERO AMOUNT TX === ${zeros.length}`);

// Print 3 newest dan 3 oldest
console.log("=== NEWEST 3 ===");
mapped.slice(0, 3).forEach(t => console.log(`  ${t.date.slice(0,10)} | ${t.name} | ${t.amount} | ${t.user}`));
console.log("=== OLDEST 3 ===");
mapped.slice(-3).forEach(t => console.log(`  ${t.date.slice(0,10)} | ${t.name} | ${t.amount} | ${t.user}`));

await p.$disconnect();
}
main();
