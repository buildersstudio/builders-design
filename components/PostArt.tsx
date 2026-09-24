"use client";

import type { CSSProperties } from "react";
import type { Brand, Theme } from "@/lib/types";
import { isCutout, luminance } from "@/lib/types";
import { fieldSVG } from "@/lib/fields.mjs";
import { rich } from "./Slide";

/* ---------- one engine for every social post, in the venture's brand ---------- */

export const FORMATS = [
  { key: "portrait", label: "4:5", w: 1080, h: 1350 },
  { key: "square", label: "1:1", w: 1080, h: 1080 },
  { key: "landscape", label: "1.91:1", w: 1200, h: 627 },
] as const;

export const LAYOUTS = [
  { key: "type", label: "Type" },
  { key: "photo", label: "Photo" },
  { key: "split", label: "Split" },
  { key: "product", label: "Product" },
  { key: "stat", label: "Stat" },
] as const;

export type Format = (typeof FORMATS)[number]["key"];
export type Layout = (typeof LAYOUTS)[number]["key"];

export type Post = {
  format: Format;
  layout: Layout;
  dark: boolean;
  /** darken or lighten the picture behind the headline */
  shade: boolean;
  /** paint the post in a named brand colour (brands with a deck palette) */
  color?: string;
  label: string;
  title: string;
  /** a short line under the headline (stat and product layouts) */
  body?: string;
  photo?: string;
  stat?: string;
};

export const sizeOf = (f: Format) => FORMATS.find((x) => x.key === f)!;

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

/** Krans-style field on the post's own cell grid, anchored to an edge. */
function Field({ kind, color, left, top, width, height, cell }: { kind: string; color: string; left: number; top: number; width: number; height: number; cell: number }) {
  const cols = Math.round(width / cell), rows = Math.round(height / cell);
  const svg = fieldSVG({ kind, color, cols, rows, width: cols * cell, height: rows * cell, floor: 0, gap: 0.2 });
  return <div aria-hidden style={{ position: "absolute", left, top, width: cols * cell, height: rows * cell, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Artwork({ post, theme, brand }: { post: Post; theme: Theme; brand: Brand }) {
  const { w, h } = sizeOf(post.format);
  const d = theme.deck;
  const style = d.style ?? "plain";
  const u = w / 1080;
  const wide = w / h > 1.4;
  const pad = Math.round(80 * u);
  const pal = d.palette ?? {};
  const painted = style === "field" && post.color && pal[post.color];
  const dark = painted ? luminance(pal[post.color!]) < 0.56 : post.dark;
  const ground = painted ? pal[post.color!] : dark ? (style === "gradient" ? "#000" : theme.ink) : style === "gradient" ? "#fff" : theme.paper;
  const fg = dark ? (style === "field" ? theme.paper : "#fff") : theme.ink;
  const soft = dark ? "rgba(255,255,255,.66)" : "rgba(0,0,0,.52)";
  const emColor = style === "pixel" ? theme.accent : style === "gradient" ? soft : painted ? fg : dark ? "#fff" : theme.accent;
  const caps = style === "gradient" && d.titles !== "normal";
  const titleFace = caps ? theme.label : style === "pixel" && post.layout !== "photo" ? theme.label : theme.display;
  const grad = d.gradients?.[d.variant ?? "builders"] ?? d.gradients?.builders ?? Object.values(d.gradients ?? {})[0];
  const paint = (u2: string) => (u2.includes("gradient(") ? u2 : `center bottom / cover no-repeat url("${u2}")`);
  const pool = d.backgrounds ?? [];
  const photo = post.photo ?? pool[0];
  const topText = style === "field" || post.layout === "product" || post.layout === "stat";

  const root: CSSProperties = {
    width: w, height: h, position: "relative", overflow: "hidden", background: ground, color: fg, fontFamily: theme.text,
    ["--em-font" as string]: style === "imagery" ? d.serif ?? "inherit" : "inherit",
    ["--em-style" as string]: style === "imagery" ? "italic" : "normal",
    ["--em-weight" as string]: "inherit", ["--em-color" as string]: emColor, ["--em-track" as string]: "inherit",
  };
  const base = post.layout === "split" && !wide ? 70 : wide ? 66 : style === "field" && post.layout === "type" ? 112 : topText ? 88 : 92;
  const size = base * u * (style === "pixel" && titleFace === theme.label ? 1.35 : 1) * (caps ? 0.86 : 1);
  const title: CSSProperties = {
    fontFamily: titleFace, fontWeight: style === "pixel" && titleFace === theme.label ? 700 : style === "imagery" ? d.displayWeight ?? 300 : style === "gradient" && !caps ? 800 : 500,
    fontSize: size, lineHeight: caps ? 1.02 : 1.05, letterSpacing: caps ? "0" : "-0.03em", textTransform: caps ? "uppercase" : "none", margin: 0,
  };
  const label: CSSProperties = { fontFamily: caps ? theme.label : theme.text, fontSize: 22 * u, letterSpacing: "0.16em", textTransform: "uppercase", color: soft };
  const logoH = 34 * u;
  const onPhoto = post.layout === "photo";
  const logoImg = brand.logo && <img src={brand.logo} alt="" style={{ height: logoH, display: "block", filter: dark || (onPhoto && post.dark) ? "brightness(0) invert(1)" : undefined }} />;
  const mark = style === "gradient" && (d.mark ?? brand.logo) && (
    <img src={d.mark ?? brand.logo} alt="" style={{ position: "absolute", right: pad, bottom: pad, height: (d.mark ? 54 : 32) * u, filter: dark || (onPhoto && post.dark) ? "brightness(0) invert(1)" : "brightness(0)" }} />
  );
  const logoTop = style !== "gradient" && <div style={{ position: "absolute", left: pad, top: pad }}>{logoImg}</div>;

  const headline = (extra: CSSProperties = {}) => (
    <div style={{ position: "absolute", left: pad, right: pad, ...(topText ? { top: pad + (style !== "gradient" ? 120 * u : 0) } : { bottom: pad + (style === "gradient" ? 70 * u : 0) }), ...extra }}>
      {post.label && <div style={{ ...label, marginBottom: 24 * u }}>{post.label}</div>}
      <h1 style={title} dangerouslySetInnerHTML={{ __html: rich(post.title) }} />
      {post.body && post.layout !== "stat" && <p style={{ margin: `${26 * u}px 0 0`, fontSize: 30 * u, lineHeight: 1.4, color: soft, maxWidth: 820 * u }}>{post.body}</p>}
    </div>
  );

  // the brand's signature ground, per style
  const hues = Object.values(pal);
  const fieldHue = painted ? fg : pal[post.color ?? ""] ?? hues[0] ?? theme.accent;
  const cell = Math.round(40 * u);
  const signature = (kind: string, height = h * 0.34): React.ReactNode => {
    if (style === "field") return <Field kind={kind} color={fieldHue} left={0} top={h - Math.round(height / cell) * cell} width={w} height={height} cell={cell} />;
    if (style === "gradient" && grad) return <div style={{ position: "absolute", inset: 0, background: paint(dark && grad.full && !grad.full.includes("gradient(") ? grad.full : grad.overlay) }} />;
    if (style === "pixel") return <Pixels w={w} h={h} x0={w * 0.62} color={d.pixel ?? theme.accent} />;
    if (style === "plain") return <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14 * u, background: theme.accent }} />;
    return null;
  };

  /* ---------- layouts ---------- */

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
        {style === "gradient" && grad && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "30%", background: paint(grad.overlay) }} />}
        {sideways && logoTop}
        <div style={{ position: "absolute", left: pad, right: sideways ? w * 0.46 + pad : pad, bottom: pad + (style === "gradient" ? 70 * u : 0) }}>
          {post.label && <div style={{ ...label, marginBottom: 24 * u }}>{post.label}</div>}
          <h1 style={title} dangerouslySetInnerHTML={{ __html: rich(post.title) }} />
        </div>
        {mark}
      </div>
    );
  }

  if (post.layout === "photo") {
    return (
      <div style={{ ...root, color: post.dark ? "#fff" : theme.ink }}>
        {photo && <div style={{ position: "absolute", inset: 0, background: `center / cover url("${photo}")` }} />}
        {post.shade && <div style={{ position: "absolute", inset: 0, background: post.dark ? "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,0) 35%, rgba(0,0,0,.7))" : "linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 35%, rgba(255,255,255,.82))" }} />}
        {style === "gradient" && grad && <div style={{ position: "absolute", inset: 0, background: paint(grad.overlay) }} />}
        {logoTop}
        <div style={{ position: "absolute", left: pad, right: pad, bottom: pad + (style === "gradient" ? 70 * u : 0) }}>
          {post.label && <div style={{ ...label, color: post.dark ? "rgba(255,255,255,.7)" : "rgba(0,0,0,.55)", marginBottom: 24 * u }}>{post.label}</div>}
          <h1 style={title} dangerouslySetInnerHTML={{ __html: rich(post.title) }} />
        </div>
        {mark}
      </div>
    );
  }

  if (post.layout === "product") {
    const img = photo;
    return (
      <div style={root}>
        {style === "field" ? signature("horizon", h * (wide ? 0.5 : 0.42)) : signature("horizon")}
        {logoTop}
        {headline({ right: pad + (wide ? w * 0.45 : 0) })}
        {img && (
          <div style={{ position: "absolute", ...(wide ? { right: pad, top: pad, bottom: pad, width: w * 0.46 } : { left: pad, right: pad, top: h * 0.44, bottom: pad + 40 * u }), display: "grid", placeItems: "center" }}>
            <img src={img} alt="" style={isCutout(img) ? { width: "100%", height: "100%", objectFit: "contain", display: "block" } : { maxWidth: "100%", maxHeight: "100%", borderRadius: 16 * u, display: "block" }} />
          </div>
        )}
        {mark}
      </div>
    );
  }

  if (post.layout === "stat") {
    return (
      <div style={root}>
        {signature(style === "field" ? "ledger" : "horizon", h * 0.3)}
        {logoTop}
        <div style={{ position: "absolute", left: pad, right: pad, top: pad + (style !== "gradient" ? 120 * u : 0) }}>
          {post.label && <div style={{ ...label, marginBottom: 24 * u }}>{post.label}</div>}
          <div style={{ fontFamily: caps ? theme.label : theme.display, fontWeight: caps ? 500 : 600, fontSize: (wide ? 190 : 300) * u, lineHeight: 0.92, letterSpacing: "-0.05em", fontFeatureSettings: '"tnum" 1', color: painted ? fg : style === "field" ? fieldHue : undefined }}>{post.stat}</div>
          <h1 style={{ ...title, fontSize: (wide ? 44 : 60) * u, marginTop: 30 * u, maxWidth: 860 * u }} dangerouslySetInnerHTML={{ __html: rich(post.title) }} />
        </div>
        {mark}
      </div>
    );
  }

  // type
  const layers: React.ReactNode[] = [];
  if (style === "imagery" && pool.length) {
    layers.push(<div key="i" style={{ position: "absolute", inset: 0, background: `center / cover url("${photo}")` }} />);
    if (post.shade) layers.push(<div key="s" style={{ position: "absolute", inset: 0, background: dark ? "linear-gradient(180deg, rgba(10,10,10,.2), rgba(10,10,10,.75))" : "linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.85))" }} />);
  } else layers.push(<div key="sig">{signature("horizon")}</div>);
  return (
    <div style={root}>
      {layers}
      {logoTop}
      {headline()}
      {mark}
    </div>
  );
}
