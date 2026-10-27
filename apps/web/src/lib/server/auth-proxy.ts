import { NextResponse } from "next/server";

const API = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const TOKEN_COOKIE = "jc27_token";
const STAFF_COOKIE = "jc27_staff";

/**
 * Forwards a verification request (code or link) to the Laravel API and keeps the Sanctum token
 * in an httpOnly cookie, so it never reaches client-side JavaScript.
 */
export async function proxyVerify(
  request: Request,
  path: "/auth/verify" | "/auth/verify-link" | "/admin/auth/verify" | "/admin/auth/verify-link",
) {
  const staff = path.startsWith("/admin");
  let upstream: Response;
  try {
    upstream = await fetch(`${API()}${path}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Can't reach the server. Try again shortly.", code: "network" }, { status: 502 });
  }

  const body = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json(body, { status: upstream.status });

  const { token, ...meta } = body.meta ?? {};
  const res = NextResponse.json({ ...body, meta }, { status: upstream.status });
  // Staff sessions are kept shorter than attendees': a shared office laptop should not stay signed in for months.
  res.cookies.set(staff ? STAFF_COOKIE : TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: staff ? 60 * 60 * 12 : 60 * 60 * 24 * 90,
  });
  return res;
}
