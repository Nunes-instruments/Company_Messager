import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "nunes_session";

const PUBLIC_PREFIXES = [
  "/login",
  "/setup-admin",
  "/c/",
  "/api/auth/login",
  "/api/auth/bootstrap-admin",
  "/api/portal/",
  "/api/health",
  "/manifest.webmanifest",
  "/_next/",
  "/favicon.ico",
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function base64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function verifySignedCookie(value: string | undefined) {
  if (!value) return false;
  const [rawToken, expiresRaw, signature] = value.split(".");
  const expiresAt = Number(expiresRaw);

  if (!rawToken || !signature || !Number.isFinite(expiresAt)) return false;
  if (expiresAt <= Date.now()) return false;

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 24) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${rawToken}.${expiresAt}`)
  );

  return base64Url(signed) === signature;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const valid = await verifySignedCookie(
    request.cookies.get(COOKIE_NAME)?.value
  );

  if (valid) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
