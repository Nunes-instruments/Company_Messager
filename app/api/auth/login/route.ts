import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createStaffSession,
  verifyPassword,
} from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login details" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email },
  });

  if (
    !user ||
    !user.active ||
    !user.passwordHash ||
    !verifyPassword(parsed.data.password, user.passwordHash)
  ) {
    return NextResponse.json(
      { error: "Email or password is incorrect" },
      { status: 401 }
    );
  }

  const expiresAt = await createStaffSession(user.id);

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "STAFF_LOGIN",
      entityType: "User",
      entityId: user.id,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    expiresAt,
  });
}
