import crypto from "crypto";
import { db } from "@/lib/db";

export function createPortalToken() {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashPortalToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashPortalToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function resolvePortalCustomer(rawToken: string) {
  const tokenHash = hashPortalToken(rawToken);
  const now = new Date();

  const access = await db.customerPortalToken.findUnique({
    where: { tokenHash },
    include: {
      customer: {
        include: {
          instruments: {
            orderBy: { updatedAt: "desc" },
            take: 20,
          },
          calibrations: {
            orderBy: { dueDate: "asc" },
            take: 20,
          },
          serviceJobs: {
            orderBy: { updatedAt: "desc" },
            take: 20,
          },
        },
      },
    },
  });

  if (!access || !access.active) return null;
  if (access.expiresAt && access.expiresAt <= now) return null;

  await db.customerPortalToken.update({
    where: { id: access.id },
    data: { lastUsedAt: now },
  });

  return access;
}
