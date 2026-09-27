import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerCreateSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const customers = await db.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      _count: {
        select: {
          conversations: true,
          instruments: true,
          serviceJobs: true,
          calibrations: true,
          leads: true,
        },
      },
    },
  });
  return NextResponse.json({ customers });
}

export async function POST(request: NextRequest) {
  const parsed = customerCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid customer data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const customer = await db.customer.create({ data: parsed.data });
  return NextResponse.json({ customer }, { status: 201 });
}
