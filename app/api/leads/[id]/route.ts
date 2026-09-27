import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z.enum(["NEW", "ASSIGNED", "FOLLOW_UP", "QUOTATION", "WON", "LOST"]).optional(),
  assignedUserId: z.string().nullable().optional(),
  requirement: z.string().min(2).max(5000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid lead update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const lead = await db.lead.update({
    where: { id },
    data: parsed.data,
    include: {
      customer: true,
      assignedUser: { select: { id: true, name: true } },
    },
  });

  await db.auditLog.create({
    data: {
      customerId: lead.customerId,
      action: "LEAD_UPDATED",
      entityType: "Lead",
      entityId: lead.id,
      metadata: parsed.data,
    },
  });

  return NextResponse.json({ lead });
}
