import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const householdId = searchParams.get("householdId");

    // Always filter by household (Keluarga) - shared data
    const household = await prisma.household.findFirst({ where: { name: "Keluarga" } });
    const where: Record<string, unknown> = {};
    if (household) {
      where.householdId = household.id;
    }

    const goals = await prisma.savingGoal.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("[GET /api/goals]", error);
    return NextResponse.json({ error: "Gagal memuat tabungan" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, target, deadline, user } = body ?? {};

    if (!name || target == null || !user) {
      return NextResponse.json({ error: "Data tabungan tidak lengkap" }, { status: 400 });
    }

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

    const goal = await prisma.savingGoal.create({
      data: {
        name,
        target: Number(target),
        deadline: deadline ? new Date(deadline) : null,
        collected: 0,
        completed: false,
        userId: dbUser.id,
        householdId: household.id,
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/goals]", error);
    return NextResponse.json({ error: "Gagal menambah tabungan" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const amount = searchParams.get("amount");
    const complete = searchParams.get("complete");

    if (!id) {
      return NextResponse.json({ error: "Goal ID tidak valid" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (amount !== null && amount !== "") {
      const amountNum = Number(amount);
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
      }

      const existing = await prisma.savingGoal.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });
      }

      const collected = (existing.collected + amountNum) as number;
      updateData.collected = collected;
      if (!existing.completed && collected >= existing.target) {
        updateData.completed = true;
      }
    }

    if (complete !== null) {
      updateData.completed = complete === "true";
    }

    const goal = await prisma.savingGoal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("[PATCH /api/goals]", error);
    return NextResponse.json({ error: "Gagal memperbarui tabungan" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Goal ID tidak valid" }, { status: 400 });
    }

    await prisma.savingGoal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/goals]", error);
    return NextResponse.json({ error: "Gagal menghapus tabungan" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
