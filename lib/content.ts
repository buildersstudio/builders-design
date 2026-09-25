import fs from "node:fs";
import type { JourneyFile } from "./journeys";
import type { VisionBoard } from "./vision";
import type { SiteFile, SiteMap } from "./website";
import path from "node:path";
import matter from "gray-matter";
import type { Brand, Deck } from "./types";
import { isHidden } from "./private";

export * from "./types";

const ROOT = path.join(process.cwd(), "public", "ventures");

export const SECTIONS = [
  // product
  { key: "journeys", label: "Journeys", group: "product" },
  { key: "competitors", label: "Competitors", group: "product" },
  { key: "vision", label: "Vision", group: "product" },
  // marketing
  { key: "variants", label: "Brand variants", group: "marketing" },
  { key: "brand", label: "Brand book", group: "marketing" },
  { key: "website", label: "Website", group: "marketing" },
  { key: "social", label: "Social", group: "marketing" },
  { key: "presentations", label: "Presentations", group: "marketing" },
  { key: "gallery", label: "Gallery", group: "marketing" },
  // Landing pages are parked: their routes and folders still work, they are just not in the menu.
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
  /** the badge's own background colour (the logo sits smaller on it), or "cover" to fill the badge with the image */
  badgeBg?: string;
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
    .filter((v): v is Venture => !!v && !isHidden(v.slug))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function getVenture(slug: string): Venture | null {
  const file = path.join(ROOT, slug, "venture.md");
  if (!exists(file) || (isHidden(slug) && process.env.NODE_ENV !== "development")) return null;
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
    badgeBg: data.badge_fit === "cover" ? "cover" : data.badge_bg,
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

/** social/posts.json: the venture's finished posts, each with its visual settings and three caption variants. */
export function getSocialPosts(slug: string): Record<string, unknown>[] {
  return readJSON<Record<string, unknown>[]>(path.join(ROOT, slug, "social", "posts.json"), []);
}

/** Website builder: site.json and the sitemap of every version (website/versions/<id>/sitemap.json). */
export function getSite(slug: string): { site: SiteFile; maps: Record<string, SiteMap> } | null {
  const site = readJSON<SiteFile | null>(path.join(ROOT, slug, "website", "site.json"), null);
  if (!site) return null;
  const maps: Record<string, SiteMap> = {};
  for (const v of site.versions) maps[v.id] = readJSON<SiteMap>(path.join(ROOT, slug, "website", "versions", v.id, "sitemap.json"), { pages: [] });
  return { site, maps };
}

/** Product vision: research and the initiative board (vision/board.json), see the "Vision" section of AGENTS.md. */
export function getVision(slug: string): VisionBoard | null {
  return readJSON<VisionBoard | null>(path.join(ROOT, slug, "vision", "board.json"), null);
}

/** Customer journeys and ICPs (journeys/journeys.json), see the "Journeys" section of AGENTS.md. */
export function getJourneys(slug: string): JourneyFile | null {
  return readJSON<JourneyFile | null>(path.join(ROOT, slug, "journeys", "journeys.json"), null);
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
    .map((id) => ({ id, ...readJSON<Deck>(path.join(base, id, "deck.json"), { title: id, slides: [] }) }))
    .filter((d) => d.slides.length)
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
    social: getSocialPosts(slug).length,
    journeys: getJourneys(slug)?.journeys?.length ?? 0,
    vision: getVision(slug)?.initiatives?.length ?? 0,
    website: (() => { const s = getSite(slug); return s ? s.maps[s.site.current]?.pages.length ?? 0 : 0; })(),
  };
}
