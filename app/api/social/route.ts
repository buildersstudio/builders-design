import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Saves a venture's social posts (social/posts.json). Locally it writes the file;
// on Vercel it commits it to GitHub (GITHUB_TOKEN + GITHUB_REPO), which redeploys.

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export async function POST(req: Request) {
  const { venture, posts } = await req.json().catch(() => ({}));
  if (!SLUG.test(venture ?? "") || !Array.isArray(posts)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const rel = `public/ventures/${venture}/social/posts.json`;
  const body = JSON.stringify(posts, null, 2) + "\n";
  const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPO, branch = process.env.GITHUB_BRANCH ?? "main";
  if (token && repo) {
    const api = `https://api.github.com/repos/${repo}/contents/${rel}`;
    const h = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
    const cur = await fetch(`${api}?ref=${branch}`, { headers: h, cache: "no-store" });
    const sha = cur.ok ? (await cur.json()).sha : undefined;
    const put = await fetch(api, { method: "PUT", headers: h, body: JSON.stringify({ message: `Edit ${venture} social posts`, content: Buffer.from(body).toString("base64"), sha, branch }) });
    if (!put.ok) return NextResponse.json({ error: "GitHub rejected the save" }, { status: 502 });
    return NextResponse.json({ message: "Saved. Live in about a minute" });
  }
  if (process.env.NODE_ENV === "development") {
    await fs.mkdir(path.dirname(path.join(process.cwd(), rel)), { recursive: true });
    await fs.writeFile(path.join(process.cwd(), rel), body);
    return NextResponse.json({ message: "Saved" });
  }
  return NextResponse.json({ error: "Saving needs GITHUB_TOKEN and GITHUB_REPO on Vercel" }, { status: 501 });
}
