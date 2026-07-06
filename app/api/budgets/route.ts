import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function getDefaultHousehold() {
  return prisma.household.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
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
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ budgets });
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
    const { categoryId, limit, period } = body ?? {};

    if (!categoryId || limit == null || !period) {
      return NextResponse.json({ error: "Data budget tidak lengkap" }, { status: 400 });
    }

    // Auto-create atau dapatkan Household default
    let household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
    if (!household) {
      household = await prisma.household.create({
        data: { id: "default-household", name: "Keluarga" },
      });
    }

    const budget = await prisma.budget.upsert({
      where: {
        categoryId_period_householdId: {
          categoryId,
          period,
          householdId: household.id,
        },
      },
      update: { limit: Number(limit) },
      create: {
        categoryId,
        limit: Number(limit),
        period,
        householdId: household.id,
      },
      include: { category: true },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/budgets]", error);
    return NextResponse.json({ error: "Gagal menyimpan budget" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
