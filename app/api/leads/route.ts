import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadCreateSchema } from "@/lib/validators";

export async function GET() {
  const leads = await db.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: true,
      assignedUser: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  const parsed = leadCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid lead data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const lead = await db.lead.create({ data: parsed.data });
  return NextResponse.json({ lead }, { status: 201 });
}
