"use client";

import { toPng } from "html-to-image";
import { useRef, useState, type CSSProperties } from "react";
import type { Picture } from "@/lib/content";
import type { Brand, Theme } from "@/lib/types";
import { rich } from "./Slide";
import { toast, useFit } from "./ui";

const FORMATS = [
  { key: "portrait", label: "4:5", w: 1080, h: 1350 },
  { key: "square", label: "1:1", w: 1080, h: 1080 },
  { key: "landscape", label: "1.91:1", w: 1200, h: 627 },
] as const;
const LAYOUTS = [
  { key: "type", label: "Type" },
  { key: "photo", label: "Photo" },
  { key: "split", label: "Split" },
] as const;

type Post = {
  format: (typeof FORMATS)[number]["key"];
  layout: (typeof LAYOUTS)[number]["key"];
  dark: boolean;
  label: string;
  title: string;
  photo?: string;
};

/**
 * The smallest useful social tool: one branded LinkedIn image, three formats, three layouts,
 * a headline, a label, a picture from the venture's gallery, and a PNG out.
 */
export function Social({ slug, name, brand, theme, pictures }: { slug: string; name: string; brand: Brand; theme: Theme; pictures: Picture[] }) {
  const photos = pictures.filter((p) => !/\.svg$/i.test(p.href) && p.group !== "icons");
  const [post, setPost] = useState<Post>({
    format: "portrait",
    layout: "type",
    dark: theme.deck.style !== "pixel",
    label: name,
    title: brand.tagline ?? `${name}.`,
    photo: photos.find((p) => p.group === "photos" || p.group === "backgrounds")?.href ?? photos[0]?.href,
  });
  const set = <K extends keyof Post>(k: K, v: Post[K]) => setPost((p) => ({ ...p, [k]: v }));
  const f = FORMATS.find((x) => x.key === post.format)!;
  const [box, scale] = useFit<HTMLDivElement>(f.w, f.h);
  const art = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!art.current) return;
    setBusy(true);
    try {
      const url = await toPng(art.current, { width: f.w, height: f.h, pixelRatio: 2, cacheBust: true, style: { transform: "none" } });
      Object.assign(document.createElement("a"), { href: url, download: `${slug}-${post.layout}-${f.w}x${f.h}.png` }).click();
      toast("PNG saved");
    } catch {
      toast("Could not render the PNG");
    }
    setBusy(false);
  };

  return (
    <div className="social">
      <div className="social-stage" ref={box}>
        {scale > 0 && (
          <div style={{ width: f.w * scale, height: f.h * scale, position: "relative", boxShadow: "0 0 0 1px var(--line), 0 30px 80px -40px rgba(0,0,0,.3)", borderRadius: 6, overflow: "hidden" }}>
            <div ref={art} style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
              <Artwork post={post} w={f.w} h={f.h} theme={theme} brand={brand} />
            </div>
          </div>
        )}
      </div>

      <aside className="social-panel">
        <Field label="Format">
          <Seg options={FORMATS.map((x) => [x.key, x.label])} value={post.format} onChange={(v) => set("format", v as Post["format"])} />
        </Field>
        <Field label="Layout">
          <Seg options={LAYOUTS.map((x) => [x.key, x.label])} value={post.layout} onChange={(v) => set("layout", v as Post["layout"])} />
        </Field>
        <Field label="Ground">
          <Seg options={[["dark", "Dark"], ["light", "Light"]]} value={post.dark ? "dark" : "light"} onChange={(v) => set("dark", v === "dark")} />
        </Field>
        <Field label="Label">
          <input className="social-input" value={post.label} onChange={(e) => set("label", e.target.value)} />
        </Field>
        <Field label="Headline" hint="*words* for emphasis">
          <textarea className="social-input" rows={4} value={post.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        {post.layout !== "type" && !!photos.length && (
          <Field label="Picture">
            <div className="social-pics">
              {photos.slice(0, 40).map((p) => (
                <button key={p.id} aria-pressed={post.photo === p.href} onClick={() => set("photo", p.href)} style={{ backgroundImage: `url("${p.href}")` }} title={p.name} />
              ))}
            </div>
          </Field>
        )}
        <button className="icon-btn solid social-dl" onClick={download} disabled={busy}>{busy ? "Rendering" : `Download PNG · ${f.w}×${f.h}`}</button>
      </aside>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="social-field">
      <span>{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  );
}

function Seg({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="chips" style={{ margin: 0 }}>
      {options.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

/* ---------- the artwork itself, in the venture's brand ---------- */

function Pixels({ w, h, x0, color, seed = 5 }: { w: number; h: number; x0: number; color: string; seed?: number }) {
  let r = seed;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const cell = Math.round(w / 22), out: React.ReactNode[] = [];
  for (let x = x0 - cell * 5; x < w; x += cell)
    for (let y = 0; y < h; y += cell) {
      const low = y / h, edge = Math.abs(x - x0) / (w * 0.4);
      const p = x >= x0 ? 0.03 + 0.6 * low ** 1.7 * Math.max(0, 1 - edge) : 0.4 * low ** 2.4 * Math.max(0, 1 - edge * 1.8);
      if (rnd() < p) out.push(<div key={`${x}-${y}`} style={{ position: "absolute", left: x, top: y, width: cell, height: cell, background: color }} />);
    }
  return <>{out}</>;
}

function Artwork({ post, w, h, theme, brand }: { post: Post; w: number; h: number; theme: Theme; brand: Brand }) {
  const d = theme.deck;
  const style = d.style ?? "plain";
  const u = w / 1080;                       // type scale unit
  const wide = w / h > 1.4;
  const dark = post.dark;
  const ground = dark ? (style === "gradient" ? "#000" : theme.ink) : style === "gradient" ? "#fff" : theme.paper;
  const fg = dark ? "#fff" : theme.ink;
  const soft = dark ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.5)";
  const emColor = style === "pixel" ? theme.accent : style === "gradient" ? soft : dark ? "#fff" : theme.accent;
  const titleFace = style === "gradient" ? theme.label : style === "pixel" && post.layout !== "photo" ? theme.label : theme.display;
  const caps = style === "gradient";
  const grad = d.gradients?.[d.variant ?? "builders"] ?? d.gradients?.builders;
  const pool = d.backgrounds ?? [];
  const photo = post.photo ?? pool[0];
  const pad = Math.round(80 * u);

  const root: CSSProperties = {
    width: w, height: h, position: "relative", overflow: "hidden", background: ground, color: fg, fontFamily: theme.text,
    ["--em-font" as string]: style === "imagery" ? d.serif ?? "inherit" : "inherit",
    ["--em-style" as string]: style === "imagery" ? "italic" : "normal",
    ["--em-weight" as string]: "inherit", ["--em-color" as string]: emColor, ["--em-track" as string]: "inherit",
  };
  const size = (post.layout === "split" && !wide ? 70 : wide ? 64 : 92) * u * (style === "pixel" && titleFace === theme.label ? 1.35 : 1) * (caps ? 0.86 : 1);
  const title: CSSProperties = {
    fontFamily: titleFace, fontWeight: style === "pixel" && titleFace === theme.label ? 700 : style === "imagery" ? d.displayWeight ?? 300 : 500,
    fontSize: size, lineHeight: caps ? 1.02 : 1.04, letterSpacing: caps ? "0" : "-0.03em", textTransform: caps ? "uppercase" : "none", margin: 0,
  };
  const label: CSSProperties = { fontFamily: caps ? theme.label : theme.text, fontSize: 20 * u, letterSpacing: "0.16em", textTransform: "uppercase", color: soft };
  const logoH = 34 * u;
  const logo = brand.logo && (
    <img src={brand.logo} alt="" style={{ height: logoH, filter: dark || post.layout === "photo" ? "brightness(0) invert(1)" : undefined }} />
  );
  const bmark = style === "gradient" && <img src="/ventures/builders/gallery/illustrations/builders-b-mark-white.png" alt="" style={{ position: "absolute", right: pad, bottom: pad, height: 54 * u, filter: dark || post.layout === "photo" ? undefined : "brightness(0)" }} />;

  const text = (extra: CSSProperties = {}) => (
    <div style={{ position: "absolute", left: pad, right: pad, bottom: pad + (style === "gradient" ? 70 * u : 0), ...extra }}>
      <div style={{ ...label, marginBottom: 26 * u }}>{post.label}</div>
      <h1 style={title} dangerouslySetInnerHTML={{ __html: rich(post.title) }} />
    </div>
  );
  const top = <div style={{ position: "absolute", left: pad, top: pad }}>{style !== "gradient" && logo}</div>;

  // backgrounds per style
  const layers: React.ReactNode[] = [];
  if (post.layout === "photo" && photo) {
    layers.push(<div key="p" style={{ position: "absolute", inset: 0, background: `center / cover url("${photo}")` }} />);
    layers.push(<div key="s" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,0) 35%, rgba(0,0,0,.7))" }} />);
    if (style === "gradient" && grad) layers.push(<div key="g" style={{ position: "absolute", inset: 0, background: `center bottom / cover url("${grad.overlay}")` }} />);
  } else if (post.layout === "type") {
    if (style === "gradient" && grad) layers.push(<div key="g" style={{ position: "absolute", inset: 0, background: `center bottom / cover url("${dark ? grad.full : grad.overlay}")` }} />);
    if (style === "imagery" && pool.length) {
      layers.push(<div key="i" style={{ position: "absolute", inset: 0, background: `center / cover url("${photo}")` }} />);
      layers.push(<div key="s" style={{ position: "absolute", inset: 0, background: dark ? "linear-gradient(180deg, rgba(10,10,10,.2), rgba(10,10,10,.75))" : "linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.85))" }} />);
    }
    if (style === "pixel") layers.push(<Pixels key="px" w={w} h={h} x0={w * 0.62} color={d.pixel ?? theme.accent} />);
    if (style === "plain") layers.push(<div key="a" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14 * u, background: theme.accent }} />);
  }

  if (post.layout === "split") {
    const sideways = wide;
    return (
      <div style={root}>
        <div style={{ position: "absolute", background: `center / cover url("${photo}")`, ...(sideways ? { top: 0, bottom: 0, right: 0, width: "46%" } : { left: 0, right: 0, top: 0, height: "50%" }) }} />
        {style === "pixel" && (
          <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: sideways ? h : h * 0.56, overflow: "hidden" }}>
            <Pixels w={w} h={sideways ? h : h * 0.56} x0={sideways ? w * 0.54 : w * 0.5} color={d.pixel ?? theme.accent} seed={11} />
          </div>
        )}
        {style === "gradient" && grad && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "30%", background: `center bottom / cover url("${grad.overlay}")` }} />}
        <div style={{ position: "absolute", left: pad, top: pad }}>{style !== "gradient" && brand.logo && <img src={brand.logo} alt="" style={{ height: logoH, filter: dark && !sideways ? "brightness(0) invert(1)" : dark ? "brightness(0) invert(1)" : undefined, opacity: sideways ? 1 : 0 }} />}</div>
        {text(sideways ? { right: w * 0.46 + pad } : {})}
        {bmark}
      </div>
    );
  }

  return (
    <div style={root}>
      {layers}
      {top}
      {text()}
      {bmark}
    </div>
  );
}
