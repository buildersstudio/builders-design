import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Brand, Deck } from "./types";

export * from "./types";

const ROOT = path.join(process.cwd(), "public", "ventures");

export const SECTIONS = [
  { key: "brand", label: "Brand book" },
  { key: "gallery", label: "Gallery" },
  { key: "presentations", label: "Presentations" },
  { key: "variants", label: "Brand variants" },
  { key: "competitors", label: "Competitors" },
  // Landing pages and Social are parked: their routes and folders still work, they are just not in the menu.
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

export type Venture = {
  slug: string;
  name: string;
  url?: string;
  sector?: string;
  since?: string;
  order: number;
  brief: string;
  badge?: string;
};

export type Competitor = { name: string; url: string; kind?: string; host: string; shot?: string };

export type Page = { id: string; title: string; href: string; created?: string; note?: string };

export type Asset = { id: string; title: string; href: string; kind: "image" | "html" };

const pub = (...p: string[]) => "/" + path.posix.join("ventures", ...p);
const exists = (p: string) => fs.existsSync(p);
const readJSON = <T>(p: string, fallback: T): T => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
};
const dirs = (p: string) =>
  exists(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name) : [];

export function getVentures(): Venture[] {
  return dirs(ROOT)
    .map((slug) => getVenture(slug))
    .filter((v): v is Venture => !!v)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function getVenture(slug: string): Venture | null {
  const file = path.join(ROOT, slug, "venture.md");
  if (!exists(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const badge = ["badge.svg", "badge.png"].find((f) => exists(path.join(ROOT, slug, f)));
  return {
    slug,
    name: data.name ?? slug,
    url: data.url,
    sector: data.sector,
    since: data.since ? String(data.since) : undefined,
    order: Number(data.order ?? 99),
    brief: content.trim(),
    badge: badge ? pub(slug, badge) : undefined,
  };
}

export function getCompetitors(slug: string): Competitor[] {
  const list = readJSON<Omit<Competitor, "host">[]>(path.join(ROOT, slug, "competitors.json"), []);
  return list.map((c) => {
    const host = new URL(c.url).hostname.replace(/^www\./, "");
    const shot = ["jpg", "png", "webp"].map((e) => `${host}.${e}`).find((f) => exists(path.join(ROOT, slug, "competitors", f)));
    return { ...c, host, shot: shot ? pub(slug, "competitors", shot) : undefined };
  });
}

function titleOf(html: string) {
  return html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
}

/** Folders that each hold an index.html (brand variants, landing pages). */
export function getPages(slug: string, kind: "variants" | "landing"): Page[] {
  const base = path.join(ROOT, slug, kind);
  return dirs(base)
    .filter((id) => exists(path.join(base, id, "index.html")))
    .map((id) => {
      const meta = readJSON<{ title?: string; created?: string; note?: string }>(path.join(base, id, "meta.json"), {});
      const html = fs.readFileSync(path.join(base, id, "index.html"), "utf8");
      return { id, title: meta.title ?? titleOf(html) ?? id, created: meta.created, note: meta.note, href: pub(slug, kind, id, "index.html") };
    })
    .sort((a, b) => (b.created ?? b.id).localeCompare(a.created ?? a.id));
}

export function getSocial(slug: string): Asset[] {
  const base = path.join(ROOT, slug, "social");
  if (!exists(base)) return [];
  const out: Asset[] = [];
  for (const d of fs.readdirSync(base, { withFileTypes: true })) {
    if (d.name.startsWith(".")) continue;
    if (d.isDirectory() && exists(path.join(base, d.name, "index.html")))
      out.push({ id: d.name, title: d.name, href: pub(slug, "social", d.name, "index.html"), kind: "html" });
    else if (/\.(png|jpe?g|webp|svg|gif)$/i.test(d.name))
      out.push({ id: d.name, title: d.name.replace(/\.[^.]+$/, ""), href: pub(slug, "social", d.name), kind: "image" });
  }
  return out.sort((a, b) => b.id.localeCompare(a.id));
}

export type Picture = { id: string; href: string; group: string; name: string };

const IMG = /\.(png|jpe?g|webp|avif|gif|svg)$/i;

/** gallery/<group>/<file>, or loose files in gallery/ (group "other"). */
export function getGallery(slug: string): Picture[] {
  const base = path.join(ROOT, slug, "gallery");
  if (!exists(base)) return [];
  const out: Picture[] = [];
  const add = (group: string, file: string, ...rel: string[]) =>
    out.push({ id: [...rel, file].join("/"), href: pub(slug, "gallery", ...rel, file), group, name: file.replace(/\.[^.]+$/, "") });
  for (const d of fs.readdirSync(base, { withFileTypes: true })) {
    if (d.name.startsWith(".")) continue;
    if (d.isDirectory()) fs.readdirSync(path.join(base, d.name)).filter((f) => IMG.test(f)).sort().forEach((f) => add(d.name, f, d.name));
    else if (IMG.test(d.name)) add("other", d.name);
  }
  return out;
}

export function getBrand(slug: string): Brand {
  const b = readJSON<Partial<Brand>>(path.join(ROOT, slug, "brand", "brand.json"), {});
  const file = (f: string) => (exists(path.join(ROOT, slug, "brand", f)) ? pub(slug, "brand", f) : undefined);
  return {
    tagline: b.tagline,
    deck: b.deck,
    colors: b.colors ?? [
      { name: "Ink", hex: "#0A0A0A", role: "ink" },
      { name: "Paper", hex: "#FFFFFF", role: "paper" },
    ],
    type: b.type ?? [],
    logo: file("logo.svg"),
    mark: file("mark.svg"),
  };
}

export function getDecks(slug: string): (Deck & { id: string })[] {
  const base = path.join(ROOT, slug, "decks");
  return dirs(base)
    .map((id) => {
      const html = exists(path.join(base, id, "index.html")) && !exists(path.join(base, id, "deck.json"));
      if (html) {
        const meta = readJSON<{ title?: string; created?: string }>(path.join(base, id, "meta.json"), {});
        const t = titleOf(fs.readFileSync(path.join(base, id, "index.html"), "utf8"))?.replace(/&mdash;/g, "·");
        return { id, title: meta.title ?? t ?? id, created: meta.created, slides: [], html: pub(slug, "decks", id, "index.html") };
      }
      return { id, ...readJSON<Deck>(path.join(base, id, "deck.json"), { title: id, slides: [] }) };
    })
    .filter((d) => d.slides.length || d.html)
    .sort((a, b) => (b.created ?? b.id).localeCompare(a.created ?? a.id));
}

export function getDeck(slug: string, id: string): Deck | null {
  const p = path.join(ROOT, slug, "decks", id, "deck.json");
  return exists(p) ? readJSON<Deck | null>(p, null) : null;
}

export function counts(slug: string): Record<SectionKey, number> {
  return {
    competitors: getCompetitors(slug).length,
    variants: getPages(slug, "variants").length,
    brand: exists(path.join(ROOT, slug, "brand", "brand.json")) ? 1 : 0,
    gallery: getGallery(slug).length,
    presentations: getDecks(slug).length,
  };
}
