import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Saves an edited deck. Locally it writes the file; on Vercel it commits the
// file to GitHub (GITHUB_TOKEN + GITHUB_REPO), which triggers a redeploy.

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export async function POST(req: Request) {
  const { venture, deck, content } = await req.json().catch(() => ({}));
  if (!SLUG.test(venture ?? "") || !SLUG.test(deck ?? "") || !Array.isArray(content?.slides))
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const rel = `public/ventures/${venture}/decks/${deck}/deck.json`;
  const body = JSON.stringify(content, null, 2) + "\n";

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/name"
  const branch = process.env.GITHUB_BRANCH ?? "main";

  if (token && repo) {
    const api = `https://api.github.com/repos/${repo}/contents/${rel}`;
    const h = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
    const cur = await fetch(`${api}?ref=${branch}`, { headers: h, cache: "no-store" });
    const sha = cur.ok ? (await cur.json()).sha : undefined;
    const put = await fetch(api, {
      method: "PUT",
      headers: h,
      body: JSON.stringify({ message: `Edit ${venture}/${deck} deck`, content: Buffer.from(body).toString("base64"), sha, branch }),
    });
    if (!put.ok) return NextResponse.json({ error: "GitHub rejected the save" }, { status: 502 });
    return NextResponse.json({ message: "Saved. Live in about a minute" });
  }

  if (process.env.NODE_ENV === "development") {
    await fs.writeFile(path.join(process.cwd(), rel), body);
    return NextResponse.json({ message: "Saved" });
  }

  return NextResponse.json({ error: "Saving needs GITHUB_TOKEN and GITHUB_REPO on Vercel" }, { status: 501 });
}
