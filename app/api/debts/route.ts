import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createDebtSchema, debtActionSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Always filter by household (Keluarga) - shared data
    const household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
    const where: Record<string, unknown> = {};
    if (household) {
      where.householdId = household.id;
    }

    const debts = await prisma.debt.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ debts });
  } catch (error) {
    console.error("[GET /api/debts]", error);
    return NextResponse.json({ error: "Gagal memuat cicilan" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ── Check if this is an action (pay / toggle-status / delete) ──
    if (body.action) {
      const parsed = debtActionSchema.safeParse(body);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        return NextResponse.json({ error: firstError.message }, { status: 400 });
      }
      const { action, id, payAmount } = parsed.data;

      if (action === "pay" && id) {
        const debt = await prisma.debt.findUnique({ where: { id } });

        if (!debt) {
          return NextResponse.json({ error: "Cicilan tidak ditemukan" }, { status: 404 });
        }

        const amount = Number(payAmount ?? 0);
        const safeAmount = Number.isNaN(amount) ? 0 : amount;
        const newRemaining = Math.max(0, debt.remaining - safeAmount);
        const monthlyNum = Number(debt.monthly);

        const updated = await prisma.debt.update({
          where: { id: debt.id },
          data: {
            remaining: newRemaining,
            monthly: Number.isNaN(monthlyNum) ? debt.monthly : monthlyNum,
            dueStatus: newRemaining <= 0 ? "paid" : debt.dueStatus,
          },
        });

        return NextResponse.json({ debt: updated });
      }

      if (action === "toggle-status" && id) {
        const debt = await prisma.debt.findUnique({ where: { id } });
        if (!debt) {
          return NextResponse.json({ error: "Cicilan tidak ditemukan" }, { status: 404 });
        }

        const nextStatus = debt.dueStatus === "paid" ? "warning" : "paid";

        const updated = await prisma.debt.update({
          where: { id: debt.id },
          data: { dueStatus: nextStatus },
        });

        return NextResponse.json({ debt: updated });
      }

      if (action === "delete" && id) {
        const debt = await prisma.debt.findUnique({ where: { id } });
        if (!debt) {
          return NextResponse.json({ error: "Cicilan tidak ditemukan" }, { status: 404 });
        }

        await prisma.debt.delete({ where: { id } });

        return NextResponse.json({ success: true });
      }
    }

    // ── Create ──
    const parsed = createDebtSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }
    const { name, lender, category, total, monthly, dueDate, interestRate, user } = parsed.data;

    // 1. Dapatkan atau buat Household default
    let household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
    if (!household) {
      household = await prisma.household.create({
        data: { id: "default-household", name: "Keluarga" },
      });
    }

    // 2. Dapatkan atau buat User (berdasarkan role "Suami" atau "Istri")
    let dbUser = await prisma.user.findFirst({ where: { role: user } });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: { 
          id: `user-${user.toLowerCase()}`, 
          role: user, 
          name: user,
          householdId: household.id 
        },
      });
    }

    const debt = await prisma.debt.create({
      data: {
        name,
        lender,
        category: category || "Lainnya",
        total: Number(total),
        remaining: Number(total),
        monthly: Number(monthly),
        dueDate: new Date(dueDate),
        interestRate: interestRate ? Number(interestRate) : undefined,
        userId: dbUser.id,
        householdId: household.id,
        dueStatus: "warning",
      },
    });

    return NextResponse.json({ debt }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/debts]", error);
    return NextResponse.json({ error: "Gagal menyimpan cicilan" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
