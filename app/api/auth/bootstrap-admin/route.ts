import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(200),
  name: z.string().min(2).max(120).optional(),
});

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.ADMIN_ACTION_SECRET;
  const suppliedSecret = request.headers.get("x-admin-action-secret");

  if (!configuredSecret || suppliedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid admin setup", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existingAdmin = await db.user.findFirst({
    where: { role: "ADMIN", active: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingAdmin?.passwordHash) {
    return NextResponse.json(
      { error: "Admin login is already configured" },
      { status: 409 }
    );
  }

  let user;

  if (existingAdmin && !existingAdmin.passwordHash) {
    user = await db.user.update({
      where: { id: existingAdmin.id },
      data: {
        email,
        name: parsed.data.name ?? existingAdmin.name,
        passwordHash: hashPassword(parsed.data.password),
        passwordChangedAt: new Date(),
      },
    });
  } else {
    user = await db.user.upsert({
      where: { email },
      update: {
        name: parsed.data.name ?? "Nunes Admin",
        role: "ADMIN",
        active: true,
        passwordHash: hashPassword(parsed.data.password),
        passwordChangedAt: new Date(),
      },
      create: {
        name: parsed.data.name ?? "Nunes Admin",
        email,
        role: "ADMIN",
        active: true,
        passwordHash: hashPassword(parsed.data.password),
        passwordChangedAt: new Date(),
      },
    });
  }

  await db.staffSession.deleteMany({ where: { userId: user.id } });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_PASSWORD_CONFIGURED",
      entityType: "User",
      entityId: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
