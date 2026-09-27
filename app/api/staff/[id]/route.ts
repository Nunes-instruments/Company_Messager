import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, requireUser } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(10).max(200).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireUser(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid staff update", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (id === admin.id && parsed.data.active === false) {
    return NextResponse.json(
      { error: "You cannot disable your own active session account" },
      { status: 409 }
    );
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;

  if (parsed.data.password) {
    data.passwordHash = hashPassword(parsed.data.password);
    data.passwordChangedAt = new Date();
  }

  const user = await db.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  if (parsed.data.password || parsed.data.active === false) {
    await db.staffSession.deleteMany({ where: { userId: id } });
  }

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "STAFF_UPDATED",
      entityType: "User",
      entityId: user.id,
      metadata: {
        role: parsed.data.role,
        active: parsed.data.active,
        passwordReset: Boolean(parsed.data.password),
      },
    },
  });

  return NextResponse.json({ user });
}
