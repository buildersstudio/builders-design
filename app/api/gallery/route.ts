import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Removes a picture from a venture's gallery. Locally it deletes the file;
// on Vercel it deletes it on GitHub (GITHUB_TOKEN + GITHUB_REPO), which redeploys.

const HREF = /^\/ventures\/([a-z0-9][a-z0-9-]*)\/gallery\/[a-z0-9-]+\/[A-Za-z0-9._-]+$/;

export async function DELETE(req: Request) {
  const { href } = await req.json().catch(() => ({}));
  const m = HREF.exec(href ?? "");
  if (!m || href.includes("..")) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const rel = `public${href}`;
  const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPO, branch = process.env.GITHUB_BRANCH ?? "main";
  if (token && repo) {
    const api = `https://api.github.com/repos/${repo}/contents/${rel}`;
    const h = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
    const cur = await fetch(`${api}?ref=${branch}`, { headers: h, cache: "no-store" });
    if (!cur.ok) return NextResponse.json({ error: "File not found on GitHub" }, { status: 404 });
    const { sha } = await cur.json();
    const del = await fetch(api, { method: "DELETE", headers: h, body: JSON.stringify({ message: `Remove ${href.split("/").pop()} from the ${m[1]} gallery`, sha, branch }) });
    if (!del.ok) return NextResponse.json({ error: "GitHub rejected the removal" }, { status: 502 });
    return NextResponse.json({ message: "Removed. Gone for everyone in about a minute" });
  }
  if (process.env.NODE_ENV === "development") {
    await fs.unlink(path.join(process.cwd(), rel)).catch(() => {});
    return NextResponse.json({ message: "Removed" });
  }
  return NextResponse.json({ error: "Removing needs GITHUB_TOKEN and GITHUB_REPO on Vercel" }, { status: 501 });
}
