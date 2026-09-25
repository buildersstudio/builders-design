"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SiteFile, SiteMap, SitePage } from "@/lib/website";
import { toast } from "./ui";

/**
 * A venture's website: every version kept side by side, previewed per page, language and device,
 * mapped as a sitemap, and checked for SEO and LLM conventions straight from the published HTML.
 */

type Tab = "preview" | "sitemap" | "seo" | "versions";
const DEVICES = { desktop: 1440, tablet: 834, mobile: 390 } as const;
type Device = keyof typeof DEVICES;

export function WebsiteBuilder({ slug, site: initialSite, maps }: { slug: string; site: SiteFile; maps: Record<string, SiteMap> }) {
  const [site, setSite] = useState(initialSite);
  const [vid, setVid] = useState(site.current);
  const [lang, setLang] = useState(site.defaultLang);
  const [tab, setTab] = useState<Tab>("preview");
  const map = maps[vid] ?? { pages: [] };
  const [pageId, setPageId] = useState(map.pages[0]?.id);
  const [device, setDevice] = useState<Device>("desktop");
  const version = site.versions.find((v) => v.id === vid);
  const base = (id: string) => `/ventures/${slug}/website/versions/${id}/`;
  const page = map.pages.find((p) => p.id === pageId) ?? map.pages[0];
  const langsHere = site.languages.filter((l) => map.pages.some((p) => p.langs[l.code]));
  const file = page ? page.langs[lang] ?? page.langs[site.defaultLang] ?? Object.values(page.langs)[0] : undefined;
  const src = file ? base(vid) + file : undefined;

  useEffect(() => { if (!map.pages.some((p) => p.id === pageId)) setPageId(map.pages[0]?.id); if (!langsHere.some((l) => l.code === lang)) setLang(langsHere[0]?.code ?? site.defaultLang); }, [vid]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (p: SitePage) => { setPageId(p.id); setTab("preview"); };

  return (
    <div className="wb">
      <div className="wb-bar">
        <label className="wb-ver">
          <span>Version</span>
          <select value={vid} onChange={(e) => setVid(e.target.value)}>
            {[...site.versions].reverse().map((v) => <option key={v.id} value={v.id}>{v.title} · {v.created}{v.status ? ` · ${v.status}` : ""}</option>)}
          </select>
        </label>
        {langsHere.length > 1 && (
          <div className="wb-seg">
            {langsHere.map((l) => <button key={l.code} aria-pressed={l.code === lang} onClick={() => setLang(l.code)} title={l.label}>{l.code.toUpperCase()}</button>)}
          </div>
        )}
        <div className="wb-seg wb-tabs">
          {(["preview", "sitemap", "seo", "versions"] as Tab[]).map((t) => (
            <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>{{ preview: "Preview", sitemap: "Sitemap", seo: "SEO & LLM", versions: "Versions" }[t]}</button>
          ))}
        </div>
        {src && <a className="wb-open" href={src} target="_blank" rel="noreferrer">Open page ↗</a>}
      </div>

      {tab === "preview" && (
        <div className="wb-preview">
          <PageList map={map} current={page?.id} onPick={(p) => setPageId(p.id)} lang={lang} />
          <div className="wb-stage">
            <div className="wb-stage-bar">
              <div className="wb-seg">
                {(Object.keys(DEVICES) as Device[]).map((d) => <button key={d} aria-pressed={d === device} onClick={() => setDevice(d)}>{d[0].toUpperCase() + d.slice(1)}</button>)}
              </div>
              {page && <span className="wb-url">{site.domain ?? ""}{page.path}{lang !== site.defaultLang ? ` · ${lang}` : ""}</span>}
            </div>
            {src ? <Frame key={src + device} src={src} width={DEVICES[device]} phone={device !== "desktop"} /> : <div className="wb-none">This page has no file in this language.</div>}
          </div>
        </div>
      )}

      {tab === "sitemap" && <Sitemap map={map} lang={lang} onOpen={open} />}
      {tab === "seo" && <Seo key={vid + lang} base={base(vid)} map={map} site={site} lang={lang} onOpen={open} />}
      {tab === "versions" && (
        <Versions slug={slug} site={site} maps={maps} base={base} current={vid} onSite={setSite} onPick={(id) => { setVid(id); setTab("preview"); }} />
      )}

      {version?.note && tab === "preview" && <p className="wb-note">{version.title}: {version.note}</p>}
    </div>
  );
}

/* ---------- a page scaled to fit, at a real device width ---------- */

function Frame({ src, width, phone }: { src: string; width: number; phone?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const target = phone ? Math.min(width, size.w) : size.w;
  const scale = target ? Math.min(1, target / width) : 1;
  const w = width * scale;
  return (
    <div className="wb-frame-box" ref={box}>
      {size.w > 0 && (
        <div className={`wb-frame${phone ? " phone" : ""}`} style={{ width: w, height: size.h - (phone ? 8 : 0) }}>
          <iframe src={src} title="Page preview" style={{ width, height: (size.h - (phone ? 8 : 0)) / scale, transform: `scale(${scale})` }} />
        </div>
      )}
    </div>
  );
}

/* ---------- page list, grouped like the site ---------- */

function PageList({ map, current, onPick, lang }: { map: SiteMap; current?: string; onPick: (p: SitePage) => void; lang: string }) {
  const core = map.pages.filter((p) => p.type !== "cms");
  const cols = map.collections ?? [];
  const Item = ({ p }: { p: SitePage }) => (
    <button className={`wb-li${p.id === current ? " on" : ""}${p.langs[lang] ? "" : " missing"}`} onClick={() => onPick(p)} title={p.path}>
      <b>{p.title}</b><span>{p.path}</span>
    </button>
  );
  return (
    <nav className="wb-list">
      <span className="wb-lk">Pages</span>
      {core.map((p) => <Item key={p.id} p={p} />)}
      {cols.map((c) => {
        const items = map.pages.filter((p) => p.type === "cms" && p.collection === c.key);
        return items.length ? (
          <div key={c.key}>
            <span className="wb-lk">{c.label}<em>{items.length}</em></span>
            {items.map((p) => <Item key={p.id} p={p} />)}
          </div>
        ) : null;
      })}
    </nav>
  );
}

/* ---------- sitemap: the main tree, with CMS collections as stacks ---------- */

function Sitemap({ map, lang, onOpen }: { map: SiteMap; lang: string; onOpen: (p: SitePage) => void }) {
  const core = map.pages.filter((p) => p.type !== "cms");
  const home = core.find((p) => p.path === "/") ?? core[0];
  const top = core.filter((p) => p !== home && (!p.parent || p.parent === home?.id));
  const colFor = (p: SitePage) => (map.collections ?? []).find((c) => c.path && c.path === p.path);
  const loose = (map.collections ?? []).filter((c) => !core.some((p) => p !== home && colFor(p)?.key === c.key));
  const cms = (key: string) => map.pages.filter((p) => p.type === "cms" && p.collection === key);
  const langsOf = (p: SitePage) => Object.keys(p.langs);

  const Node = ({ p, small }: { p: SitePage; small?: boolean }) => (
    <button className={`wb-node${small ? " small" : ""}${p.nav ? " nav" : ""}`} onClick={() => onOpen(p)}>
      <b>{p.title}</b>
      <span>{p.path}</span>
      <em>{langsOf(p).map((l) => <i key={l} className={l === lang ? "on" : ""}>{l}</i>)}</em>
    </button>
  );
  const Stack = ({ label, pages }: { label: string; pages: SitePage[] }) => (
    <div className="wb-stack">
      <span className="wb-stack-k">CMS · {label}<em>{pages.length}</em></span>
      {pages.map((p) => <Node key={p.id} p={p} small />)}
    </div>
  );
  const Branch = ({ p }: { p: SitePage }): ReactNode => {
    const children = core.filter((c) => c.parent === p.id);
    const col = colFor(p);
    return (
      <li>
        <Node p={p} />
        {(children.length > 0 || col) && (
          <ul>
            {children.map((c) => <Branch key={c.id} p={c} />)}
            {col && <li><Stack label={col.label} pages={cms(col.key)} /></li>}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="wb-map">
      <div className="wb-map-legend">
        <span><i className="nav" /> In the main navigation</span>
        <span><i /> Page</span>
        <span><i className="cms" /> CMS item</span>
        <span>{map.pages.length} pages · {(map.collections ?? []).length} collections</span>
      </div>
      <div className="wb-tree">
        {home && (
          <ul>
            <li>
              <Node p={home} />
              <ul>
                {top.map((p) => <Branch key={p.id} p={p} />)}
                {loose.map((c) => <li key={c.key}><Stack label={c.label} pages={cms(c.key)} /></li>)}
              </ul>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- SEO and LLM checks, read from the published HTML ---------- */

type Check = { key: string; label: string; ok: boolean; detail?: string };

function checkPage(html: string, lang: string, langs: string[]): Check[] {
  const d = new DOMParser().parseFromString(html, "text/html");
  const meta = (sel: string) => d.querySelector(sel)?.getAttribute("content")?.trim() ?? "";
  const title = d.querySelector("title")?.textContent?.trim() ?? "";
  const desc = meta('meta[name="description"]');
  const h1 = d.querySelectorAll("h1").length;
  const imgs = [...d.querySelectorAll("img")];
  const noAlt = imgs.filter((i) => !i.hasAttribute("alt")).length;
  const hreflang = [...d.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute("hreflang"));
  const jsonld = [...d.querySelectorAll('script[type="application/ld+json"]')];
  let ldTypes: string[] = [];
  for (const s of jsonld) { try { const j = JSON.parse(s.textContent ?? "{}"); const all = Array.isArray(j) ? j : j["@graph"] ?? [j]; ldTypes = ldTypes.concat(all.map((x: { "@type"?: string }) => String(x["@type"] ?? ""))); } catch { ldTypes.push("invalid"); } }
  const viewport = meta('meta[name="viewport"]');
  return [
    { key: "lang", label: "html lang", ok: (d.documentElement.getAttribute("lang") ?? "").toLowerCase().startsWith(lang), detail: d.documentElement.getAttribute("lang") ?? "missing" },
    { key: "title", label: "Title 10 to 60 characters", ok: title.length >= 10 && title.length <= 60, detail: `${title.length}: ${title}` },
    { key: "desc", label: "Meta description 70 to 160", ok: desc.length >= 70 && desc.length <= 160, detail: `${desc.length} characters` },
    { key: "h1", label: "Exactly one h1", ok: h1 === 1, detail: `${h1}` },
    { key: "canonical", label: "Canonical URL", ok: !!d.querySelector('link[rel="canonical"]')?.getAttribute("href"), detail: d.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "missing" },
    { key: "hreflang", label: "hreflang for every language", ok: langs.length < 2 || langs.every((l) => hreflang.includes(l)), detail: hreflang.join(", ") || "none" },
    { key: "og", label: "Open Graph title, description, image", ok: !!meta('meta[property="og:title"]') && !!meta('meta[property="og:description"]') && !!meta('meta[property="og:image"]') },
    { key: "viewport", label: "Mobile viewport", ok: /width=device-width/.test(viewport), detail: viewport || "missing" },
    { key: "ld", label: "Structured data (JSON-LD)", ok: jsonld.length > 0 && !ldTypes.includes("invalid"), detail: ldTypes.filter(Boolean).join(", ") || "none" },
    { key: "alt", label: "Every image has alt text", ok: noAlt === 0, detail: `${imgs.length - noAlt} of ${imgs.length}` },
  ];
}

function Seo({ base, map, site, lang, onOpen }: { base: string; map: SiteMap; site: SiteFile; lang: string; onOpen: (p: SitePage) => void }) {
  const [rows, setRows] = useState<{ p: SitePage; checks: Check[] }[] | null>(null);
  const [files, setFiles] = useState<Record<string, boolean>>({});
  const [openRow, setOpenRow] = useState<string | null>(null);
  const langs = useMemo(() => site.languages.map((l) => l.code).filter((c) => map.pages.some((p) => p.langs[c])), [site, map]);

  useEffect(() => {
    let dead = false;
    (async () => {
      const out: { p: SitePage; checks: Check[] }[] = [];
      for (const p of map.pages) {
        const f = p.langs[lang];
        if (!f) continue;
        const r = await fetch(base + f).catch(() => null);
        out.push({ p, checks: r?.ok ? checkPage(await r.text(), lang, langs) : [{ key: "404", label: "Page file loads", ok: false, detail: f }] });
      }
      const fx: Record<string, boolean> = {};
      for (const f of ["robots.txt", "sitemap.xml", "llms.txt", "llms-full.txt"]) fx[f] = !!(await fetch(base + f, { method: "HEAD" }).catch(() => null))?.ok;
      if (!dead) { setRows(out); setFiles(fx); }
    })();
    return () => { dead = true; };
  }, [base, map, lang, langs]);

  if (!rows) return <div className="wb-none">Reading every page…</div>;
  const total = rows.reduce((n, r) => n + r.checks.length, 0), passed = rows.reduce((n, r) => n + r.checks.filter((c) => c.ok).length, 0);
  const score = total ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="wb-seo">
      <div className="wb-seo-top">
        <div className="wb-score"><b>{score}</b><span>of {total} page checks pass in {lang.toUpperCase()}</span></div>
        <div className="wb-files">
          {Object.entries(files).map(([f, ok]) => (
            <a key={f} className={ok ? "ok" : "no"} href={ok ? base + f : undefined} target="_blank" rel="noreferrer"><i />{f}</a>
          ))}
          <span className="wb-files-k">Site files for search engines and AI crawlers</span>
        </div>
      </div>
      <div className="wb-seo-rows">
        {rows.map(({ p, checks }) => {
          const bad = checks.filter((c) => !c.ok);
          return (
            <div key={p.id} className={`wb-seo-row${openRow === p.id ? " open" : ""}`}>
              <button className="wb-seo-head" onClick={() => setOpenRow(openRow === p.id ? null : p.id)}>
                <span className={`wb-pip${bad.length ? (bad.length > 2 ? " bad" : " warn") : ""}`} />
                <b>{p.title}</b>
                <span className="wb-seo-path">{p.path}</span>
                <span className="wb-seo-n">{checks.length - bad.length}/{checks.length}</span>
              </button>
              {openRow === p.id && (
                <div className="wb-seo-detail">
                  {checks.map((c) => <div key={c.key} className={c.ok ? "ok" : "no"}><i />{c.label}{c.detail && <em>{c.detail}</em>}</div>)}
                  <button className="wb-seo-open" onClick={() => onOpen(p)}>Preview this page</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- versions: the evolution, a side by side compare, a new version ---------- */

function Versions({ slug, site, maps, base, current, onSite, onPick }: {
  slug: string; site: SiteFile; maps: Record<string, SiteMap>; base: (id: string) => string; current: string; onSite: (s: SiteFile) => void; onPick: (id: string) => void;
}) {
  const router = useRouter();
  const list = [...site.versions].reverse();
  const [a, setA] = useState(list[1]?.id ?? list[0]?.id);
  const [b, setB] = useState(list[0]?.id);
  const paths = [...new Set([...(maps[a]?.pages ?? []), ...(maps[b]?.pages ?? [])].map((p) => p.path))];
  const [path, setPath] = useState("/");
  const fileFor = (id: string) => { const p = maps[id]?.pages.find((x) => x.path === path); return p ? base(id) + (p.langs[site.defaultLang] ?? Object.values(p.langs)[0]) : undefined; };
  const [draft, setDraft] = useState<{ title: string; note: string } | null>(null);

  const create = async () => {
    if (!draft?.title.trim()) return;
    const n = site.versions.length + 1;
    const id = `${new Date().toISOString().slice(0, 10)}-v${n}`;
    const r = await fetch("/api/website", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ venture: slug, from: current, id, title: draft.title.trim(), note: draft.note.trim() }) });
    const j = await r.json().catch(() => ({}));
    toast(r.ok ? j.message : j.error ?? "Could not create the version");
    if (r.ok) { onSite(j.site); setDraft(null); router.refresh(); }
  };

  return (
    <div className="wb-versions">
      <div className="wb-timeline">
        {list.map((v) => (
          <div key={v.id} className={`wb-vcard${v.id === current ? " on" : ""}`}>
            <div className="wb-vtop"><span className={`wb-status ${v.status ?? ""}`}>{v.status ?? "version"}</span><span>{v.created}</span></div>
            <b>{v.title}</b>
            {v.note && <p>{v.note}</p>}
            <div className="wb-vfoot">
              <span>{maps[v.id]?.pages.length ?? 0} pages{v.source === "imported" ? " · imported" : ""}</span>
              <button onClick={() => onPick(v.id)}>Preview</button>
            </div>
          </div>
        ))}
        <div className="wb-vcard wb-vnew">
          {draft ? (
            <>
              <b>New version from {site.versions.find((v) => v.id === current)?.title}</b>
              <input placeholder="Title, e.g. Pricing and security pages" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <textarea placeholder="What changes and why" rows={3} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
              <div className="wb-vfoot"><button onClick={() => setDraft(null)}>Cancel</button><button className="solid" onClick={create}>Create draft</button></div>
            </>
          ) : (
            <>
              <b>Start a new version</b>
              <p>For a new direction or a restructure. Small edits belong in the current version, so the history stays readable.</p>
              <div className="wb-vfoot"><span /><button className="solid" onClick={() => setDraft({ title: "", note: "" })}>New version</button></div>
            </>
          )}
        </div>
      </div>

      {site.versions.length > 1 && (
        <div className="wb-compare">
          <div className="wb-compare-bar">
            <span className="wb-lk">Compare</span>
            <select value={a} onChange={(e) => setA(e.target.value)}>{list.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</select>
            <span>with</span>
            <select value={b} onChange={(e) => setB(e.target.value)}>{list.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</select>
            <span>on</span>
            <select value={path} onChange={(e) => setPath(e.target.value)}>{paths.map((p) => <option key={p} value={p}>{p}</option>)}</select>
          </div>
          <div className="wb-compare-grid">
            {[a, b].map((id, k) => {
              const f = fileFor(id);
              return (
                <div key={k} className="wb-compare-cell">
                  <span className="wb-lk">{site.versions.find((v) => v.id === id)?.title}</span>
                  {f ? <Frame key={f} src={f} width={1440} /> : <div className="wb-none">Not in this version</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
