import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Starts a new website version by copying an existing one, so the old version stays as it was.
// Works locally (it copies the folder and updates site.json); on Vercel, new versions are made by
// a model through the repo, since a whole site is too many files for one commit from the browser.

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export async function POST(req: Request) {
  const { venture, from, id, title, note } = await req.json().catch(() => ({}));
  if (![venture, from, id].every((x) => SLUG.test(x ?? "")) || !title) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (process.env.NODE_ENV !== "development")
    return NextResponse.json({ error: "New versions are made through the repo: copy the prompt and ask your model" }, { status: 501 });
  const root = path.join(process.cwd(), "public", "ventures", venture, "website");
  const src = path.join(root, "versions", from), dst = path.join(root, "versions", id);
  try { await fs.access(dst); return NextResponse.json({ error: "That version already exists" }, { status: 409 }); } catch {}
  await fs.cp(src, dst, { recursive: true });
  const sitePath = path.join(root, "site.json");
  const site = JSON.parse(await fs.readFile(sitePath, "utf8"));
  site.versions.push({ id, title, created: new Date().toISOString().slice(0, 10), note, status: "draft", source: "built" });
  await fs.writeFile(sitePath, JSON.stringify(site, null, 2) + "\n");
  return NextResponse.json({ message: "New draft version created", site });
}
