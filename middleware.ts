import { NextResponse, type NextRequest } from "next/server";
import { UNLOCK_COOKIE, isHidden, isPrivate, unlockToken } from "./lib/private";

// Two gates.
// 1. Optional: SITE_PASSWORD on Vercel puts the whole platform behind basic auth (shared decks stay open).
// 2. Private ventures (lib/private.ts): their pages and files need the unlock password (UNLOCK_PASSWORD).

export const config = { matcher: ["/((?!_next/|favicon|brand/|unlock|api/unlock).*)"] };

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const seg = path.split("/").filter(Boolean);

  const site = process.env.SITE_PASSWORD;
  if (site && !["p", "ventures"].includes(seg[0] ?? "")) {
    const [, encoded] = (req.headers.get("authorization") ?? "").split(" ");
    const given = encoded ? atob(encoded).split(":").slice(1).join(":") : "";
    if (given !== site) return new NextResponse("Password required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Builders Design"' } });
  }

  const slug = seg[0] === "ventures" ? seg[1] : seg[0] === "p" || seg[0] === "api" ? undefined : seg[0];
  if (isHidden(slug) && process.env.NODE_ENV !== "development") return new NextResponse("Not found", { status: 404, headers: { "x-robots-tag": "noindex" } });
  if (!isPrivate(slug)) return NextResponse.next();
  // badges stay visible, so the dock and the home grid can show a private venture with its lock
  if (seg[0] === "ventures" && seg.length === 3 && /^badge\./.test(seg[2])) return NextResponse.next();

  const pass = process.env.UNLOCK_PASSWORD;
  if (!pass && process.env.NODE_ENV === "development") return NextResponse.next();
  const ok = !!pass && req.cookies.get(UNLOCK_COOKIE)?.value === (await unlockToken(pass));
  if (ok) return NextResponse.next();
  if (seg[0] === "ventures") return new NextResponse("This venture is private", { status: 401, headers: { "x-robots-tag": "noindex" } });
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = `?next=${encodeURIComponent(path)}`;
  return NextResponse.redirect(url);
}
