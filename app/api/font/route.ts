import { NextResponse } from "next/server";

// Serves a Google Fonts family as an installable TTF: /api/font?family=Inter&weight=600
// Google returns TTF (not WOFF2) when the request carries no browser user agent.

export async function GET(req: Request) {
  const u = new URL(req.url);
  const family = u.searchParams.get("family") ?? "";
  const weight = u.searchParams.get("weight") ?? "400";
  if (!/^[\w ]{2,60}$/.test(family) || !/^\d{3}$/.test(weight)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`, { headers: { "User-Agent": "curl/8" } });
  const url = css.ok ? (await css.text()).match(/url\((https:[^)]+\.ttf)\)/)?.[1] : undefined;
  if (!url) return NextResponse.json({ error: "Font not found on Google Fonts" }, { status: 404 });

  const file = await fetch(url);
  return new NextResponse(file.body, {
    headers: {
      "Content-Type": "font/ttf",
      "Content-Disposition": `attachment; filename="${family.replace(/ /g, "")}-${weight}.ttf"`,
      "Cache-Control": "public, max-age=604800",
    },
  });
}
