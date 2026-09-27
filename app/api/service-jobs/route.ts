import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serviceJobCreateSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  const jobs = await db.serviceJob.findMany({
    where: status
      ? { status: status as "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "READY" | "CLOSED" }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      customer: true,
      instrument: true,
      assignedUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
  const parsed = serviceJobCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service job data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const job = await db.serviceJob.create({ data: parsed.data });
  return NextResponse.json({ job }, { status: 201 });
}
