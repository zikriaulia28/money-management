import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, icon: true, type: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = (body as any)?.name;
    const icon = (body as any)?.icon;
    const type = (body as any)?.type;

    if (!name || !icon || !type) {
      return NextResponse.json({ error: "Data kategori tidak lengkap" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name, icon, type: type.toLowerCase() },
      select: { id: true, name: true, icon: true, type: true },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/categories]", error);
    return NextResponse.json({ error: "Gagal menambah kategori" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
