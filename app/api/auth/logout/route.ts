import { NextResponse } from "next/server";
import { destroyCurrentSession, currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await currentUser();

  if (user) {
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "STAFF_LOGOUT",
        entityType: "User",
        entityId: user.id,
      },
    });
  }

  await destroyCurrentSession();
  return NextResponse.json({ ok: true });
}
