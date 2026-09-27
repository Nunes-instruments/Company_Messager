import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calibrationCreateSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const days = Math.max(1, Math.min(365, Number(request.nextUrl.searchParams.get("days") ?? 30)));
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + days);

  const calibrations = await db.calibrationRecord.findMany({
    where: {
      OR: [
        { dueDate: { gte: now, lte: until } },
        { status: "OVERDUE" },
      ],
    },
    orderBy: { dueDate: "asc" },
    take: 250,
    include: { customer: true, instrument: true },
  });

  return NextResponse.json({ calibrations });
}

export async function POST(request: NextRequest) {
  const parsed = calibrationCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid calibration data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dueDate = new Date(parsed.data.dueDate);
  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);

  const status =
    diffDays < 0 ? "OVERDUE" :
    diffDays <= 7 ? "DUE_SOON" :
    "UPCOMING";

  const calibration = await db.calibrationRecord.create({
    data: {
      customerId: parsed.data.customerId,
      instrumentId: parsed.data.instrumentId,
      dueDate,
      status,
    },
  });

  return NextResponse.json({ calibration }, { status: 201 });
}
