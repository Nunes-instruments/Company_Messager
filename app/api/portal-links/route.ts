import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPortalToken } from "@/lib/portal-token";
import { requireUser } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  customerId: z.string().min(1),
  label: z.string().max(100).optional().nullable(),
  expiresInDays: z.number().int().min(1).max(3650).optional().default(365),
});

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = await requireUser(["ADMIN", "MANAGER"]);
  } catch {
    return NextResponse.json({ error: "Manager or Admin access required" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid portal link request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const customer = await db.customer.findUnique({
    where: { id: parsed.data.customerId },
    select: { id: true, name: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { rawToken, tokenHash } = createPortalToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

  const portalAccess = await db.customerPortalToken.create({
    data: {
      customerId: customer.id,
      tokenHash,
      label: parsed.data.label ?? "Customer portal link",
      expiresAt,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actor.id,
      customerId: customer.id,
      action: "CUSTOMER_PORTAL_LINK_CREATED",
      entityType: "CustomerPortalToken",
      entityId: portalAccess.id,
      metadata: { expiresAt },
    },
  });

  return NextResponse.json(
    {
      customer: { id: customer.id, name: customer.name },
      token: rawToken,
      path: `/c/${rawToken}`,
      expiresAt,
    },
    { status: 201 }
  );
}
