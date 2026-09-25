import { NextResponse } from "next/server";
import { UNLOCKED_FLAG, UNLOCK_COOKIE, unlockToken } from "@/lib/private";

// Unlocks every private venture at once. The password lives in UNLOCK_PASSWORD, never in the repo.

const WEEKS = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  const pass = process.env.UNLOCK_PASSWORD;
  if (!pass) return NextResponse.json({ error: "Private ventures are not set up yet" }, { status: 501 });
  if (typeof password !== "string" || password.trim() !== pass) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That is not the password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  const base = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 26 * WEEKS };
  res.cookies.set(UNLOCK_COOKIE, await unlockToken(pass), { ...base, httpOnly: true });
  res.cookies.set(UNLOCKED_FLAG, "1", base);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(UNLOCK_COOKIE);
  res.cookies.delete(UNLOCKED_FLAG);
  return res;
}
