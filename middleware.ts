import { NextResponse, type NextRequest } from "next/server";

// Optional gate. Set SITE_PASSWORD on Vercel to require it (any username).
// Shared presentations (/p/...) and the files they load stay open.

export const config = { matcher: ["/((?!p/|ventures/|brand/|_next/|favicon).*)"] };

export function middleware(req: NextRequest) {
  const pass = process.env.SITE_PASSWORD;
  if (!pass) return NextResponse.next();
  const [, encoded] = (req.headers.get("authorization") ?? "").split(" ");
  const given = encoded ? atob(encoded).split(":").slice(1).join(":") : "";
  if (given === pass) return NextResponse.next();
  return new NextResponse("Password required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Builders Design"' } });
}
