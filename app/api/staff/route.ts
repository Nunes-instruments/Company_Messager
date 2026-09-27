import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, requireUser } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10).max(200),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).default("STAFF"),
});

export async function GET() {
  try {
    await requireUser(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      passwordChangedAt: true,
      _count: {
        select: {
          assignedLeads: true,
          assignedServiceJobs: true,
          conversations: true,
        },
      },
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = await requireUser(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid staff data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      role: parsed.data.role,
      active: true,
      passwordHash: hashPassword(parsed.data.password),
      passwordChangedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "STAFF_CREATED",
      entityType: "User",
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
