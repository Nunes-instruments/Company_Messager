import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

const COOKIE_NAME = "nunes_session";
const SESSION_HOURS = 12;

function authSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 24) {
    throw new Error("AUTH_SECRET is missing or too short");
  }
  return value;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actual.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actual, expectedBuffer);
}

function signSession(rawToken: string, expiresAtMs: number) {
  return crypto
    .createHmac("sha256", authSecret())
    .update(`${rawToken}.${expiresAtMs}`)
    .digest("base64url");
}

export function hashSessionToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createStaffSession(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const signature = signSession(rawToken, expiresAt.getTime());

  await db.staffSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(rawToken),
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(
    COOKIE_NAME,
    `${rawToken}.${expiresAt.getTime()}.${signature}`,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    }
  );

  return expiresAt;
}

function parseAndVerifyCookie(value?: string | null) {
  if (!value) return null;
  const [rawToken, expiresRaw, signature] = value.split(".");
  const expiresAtMs = Number(expiresRaw);
  if (!rawToken || !signature || !Number.isFinite(expiresAtMs)) return null;
  if (expiresAtMs <= Date.now()) return null;

  const expected = signSession(rawToken, expiresAtMs);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return { rawToken, expiresAtMs };
}

export async function currentUser() {
  const store = await cookies();
  const parsed = parseAndVerifyCookie(store.get(COOKIE_NAME)?.value);
  if (!parsed) return null;

  const session = await db.staffSession.findUnique({
    where: { tokenHash: hashSessionToken(parsed.rawToken) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.active) {
    return null;
  }

  await db.staffSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return session.user;
}

export async function requireUser(roles?: Role[]) {
  const user = await currentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (roles && !roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function destroyCurrentSession() {
  const store = await cookies();
  const parsed = parseAndVerifyCookie(store.get(COOKIE_NAME)?.value);

  if (parsed) {
    await db.staffSession.deleteMany({
      where: { tokenHash: hashSessionToken(parsed.rawToken) },
    });
  }

  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
