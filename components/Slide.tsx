"use client";

import { Fragment, type CSSProperties, type ElementType } from "react";
import type { Slide as S, Theme } from "@/lib/types";

export const W = 1920;
export const H = 1080;

type Edit = (path: (string | number)[], value: string) => void;

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Copy may mark a phrase as *emphasis*; it renders in the brand's serif italic when the deck style defines one. */
const rich = (t = "") =>
  esc(t).replace(/\n/g, "<br>").replace(/\*([^*]+)\*/g, '<em style="font-family:var(--em-font,var(--serif,inherit));font-style:var(--em-style,italic);font-weight:var(--em-weight,400);color:var(--em-color,inherit);letter-spacing:var(--em-track,-0.01em)">$1</em>');

/** A text node that becomes contentEditable when the deck is in edit mode. */
function T({ as: Tag = "div", v, p, edit, style }: { as?: ElementType; v?: string; p: (string | number)[]; edit?: Edit; style?: CSSProperties }) {
  if (!v && !edit) return null;
  if (!edit) return <Tag style={style} dangerouslySetInnerHTML={{ __html: rich(v) }} />;
  return (
    <Tag
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      dangerouslySetInnerHTML={{ __html: rich(v) }}
      onFocus={(e: React.FocusEvent<HTMLElement>) => { e.currentTarget.innerText = v ?? ""; }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.innerText.trim();
        e.currentTarget.innerHTML = rich(next);
        if (next !== (v ?? "")) edit(p, next);
      }}
    />
  );
}

export function Slide(props: { slide: S; theme: Theme; logo?: string; n: number; total: number; edit?: Edit }) {
  const style = props.theme.deck.style;
  if (style === "imagery") return <ImagerySlide {...props} />;
  if (style === "gradient") return <GradientSlide {...props} />;
  return <PlainSlide {...props} />;
}

function PlainSlide({ slide, theme, logo, n, total, edit }: { slide: S; theme: Theme; logo?: string; n: number; total: number; edit?: Edit }) {
  const dark = slide.layout === "section" || slide.layout === "quote";
  const bg = slide.layout === "section" ? theme.accent : slide.layout === "quote" ? theme.ink : theme.paper;
  const fg = slide.layout === "section" ? theme.onAccent : dark ? theme.paper : theme.ink;

  const root: CSSProperties = {
    width: W, height: H, background: bg, color: fg, fontFamily: theme.text, padding: "96px 120px",
    display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
  };
  const display: CSSProperties = { fontFamily: theme.display, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 0.98, margin: 0 };
  const eyebrow: CSSProperties = { fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.55, marginBottom: 40 };
  const body: CSSProperties = { fontSize: 34, lineHeight: 1.35, opacity: 0.72, maxWidth: 1100, marginTop: 40 };
  const e = (k: string) => [k];

  const chrome = (
    <>
      <div style={{ height: 40, display: "flex", alignItems: "center" }}>
        {logo && <img src={logo} alt="" style={{ height: 30, filter: dark && fg === theme.paper ? "brightness(0) invert(1)" : undefined, opacity: 0.9 }} />}
      </div>
      <div style={{ position: "absolute", right: 120, bottom: 80, fontSize: 20, opacity: 0.4, fontFeatureSettings: '"tnum" 1' }}>
        {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
    </>
  );

  let inner: React.ReactNode = null;
  switch (slide.layout) {
    case "cover":
      inner = (
        <div style={{ marginTop: "auto", marginBottom: 40 }}>
          <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
          <T as="h1" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 168, maxWidth: 1500 }} />
          <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...body, marginTop: 48 }} />
        </div>
      );
      break;
    case "section":
      inner = (
        <div style={{ marginTop: "auto", marginBottom: 40 }}>
          <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
          <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 200 }} />
        </div>
      );
      break;
    case "statement":
      inner = (
        <div style={{ marginTop: "auto", marginBottom: "auto" }}>
          <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
          <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 112, maxWidth: 1560 }} />
          <T v={slide.body} p={e("body")} edit={edit} style={body} />
        </div>
      );
      break;
    case "points":
      inner = (
        <>
          <div style={{ marginTop: 90 }}>
            <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 88, maxWidth: 1400 }} />
          </div>
          <div style={{ marginTop: "auto", marginBottom: 60, display: "grid", gridTemplateColumns: `repeat(${Math.min(slide.points.length, 4)}, 1fr)`, gap: 64 }}>
            {slide.points.map((pt, i) => (
              <div key={i} style={{ borderTop: `2px solid ${theme.mark}`, paddingTop: 28 }}>
                <div style={{ fontSize: 20, opacity: 0.45, marginBottom: 20 }}>{String(i + 1).padStart(2, "0")}</div>
                <T v={pt.title} p={["points", i, "title"]} edit={edit} style={{ fontFamily: theme.display, fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }} />
                <T v={pt.body} p={["points", i, "body"]} edit={edit} style={{ fontSize: 26, lineHeight: 1.4, opacity: 0.65, marginTop: 16 }} />
              </div>
            ))}
          </div>
        </>
      );
      break;
    case "metrics":
      inner = (
        <>
          <div style={{ marginTop: 90 }}>
            <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 88, maxWidth: 1400 }} />
          </div>
          <div style={{ marginTop: "auto", marginBottom: 60, display: "grid", gridTemplateColumns: `repeat(${Math.min(slide.metrics.length, 4)}, 1fr)`, gap: 64 }}>
            {slide.metrics.map((m, i) => (
              <div key={i}>
                <T v={m.value} p={["metrics", i, "value"]} edit={edit} style={{ ...display, fontSize: 180, color: theme.mark, fontFeatureSettings: '"tnum" 1' }} />
                <T v={m.label} p={["metrics", i, "label"]} edit={edit} style={{ fontSize: 28, opacity: 0.65, marginTop: 20, maxWidth: 420 }} />
              </div>
            ))}
          </div>
        </>
      );
      break;
    case "split":
      inner = (
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: "96px 96px 96px 120px", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 40 }}>{logo && <img src={logo} alt="" style={{ height: 30, opacity: 0.9 }} />}</div>
            <div style={{ marginTop: "auto", marginBottom: 40 }}>
              <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
              <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 96 }} />
              <T v={slide.body} p={e("body")} edit={edit} style={{ ...body, fontSize: 30 }} />
            </div>
          </div>
          <div style={{ background: slide.image ? `center / cover url(${slide.image})` : theme.accent }} />
        </div>
      );
      break;
    case "quote":
      inner = (
        <div style={{ marginTop: "auto", marginBottom: "auto" }}>
          <T as="blockquote" v={`“${slide.quote.replace(/^“|”$/g, "")}”`} p={e("quote")} edit={edit} style={{ ...display, fontSize: 96, maxWidth: 1600, lineHeight: 1.05 }} />
          <T v={slide.author} p={e("author")} edit={edit} style={{ fontSize: 28, opacity: 0.6, marginTop: 56 }} />
        </div>
      );
      break;
    case "closing":
      inner = (
        <div style={{ margin: "auto 0", textAlign: "left" }}>
          <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 168 }} />
          <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...body, marginTop: 48 }} />
        </div>
      );
      break;
  }

  return (
    <div className="slide" style={root}>
      {slide.layout !== "split" && chrome}
      {slide.layout === "split" && <div style={{ position: "absolute", right: 120, bottom: 80, fontSize: 20, opacity: 0.4, color: theme.onAccent, zIndex: 1 }}>{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>}
      {inner}
    </div>
  );
}

/* ---------- imagery style: every slide on a full-bleed picture ---------- */

function ImagerySlide({ slide, theme, logo, n, total, edit }: { slide: S; theme: Theme; logo?: string; n: number; total: number; edit?: Edit }) {
  const d = theme.deck;
  const pool = d.backgrounds ?? [];
  const closing = slide.layout === "closing";
  const img = slide.background || (closing ? d.closing?.image : undefined) || (pool.length ? pool[(n - 1) % pool.length] : undefined);
  const w = d.displayWeight ?? 300;
  const e = (k: string) => [k];

  const scrim: Record<string, string> = {
    cover: "linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,0) 35%, rgba(10,10,10,.72) 100%)",
    section: "linear-gradient(180deg, rgba(10,10,10,.2), rgba(10,10,10,.55))",
    statement: "linear-gradient(90deg, rgba(10,10,10,.82) 0%, rgba(10,10,10,.55) 55%, rgba(10,10,10,.2) 100%)",
    points: "linear-gradient(180deg, rgba(10,10,10,.55) 0%, rgba(10,10,10,.8) 100%)",
    metrics: "linear-gradient(180deg, rgba(10,10,10,.55) 0%, rgba(10,10,10,.82) 100%)",
    quote: "linear-gradient(90deg, rgba(10,10,10,.78) 0%, rgba(10,10,10,.35) 100%)",
    closing: "linear-gradient(90deg, rgba(6,8,60,.5) 0%, rgba(6,8,60,.12) 60%)",
    split: "none",
  };

  const root: CSSProperties = {
    width: W, height: H, position: "relative", overflow: "hidden", color: "#fff", background: "#0a0a0a",
    fontFamily: theme.text, ["--serif" as string]: d.serif ?? "Georgia, 'Times New Roman', serif",
  };
  const display: CSSProperties = { fontFamily: theme.display, fontWeight: w, letterSpacing: "-0.045em", lineHeight: 1.02, margin: 0 };
  const eyebrow: CSSProperties = { fontSize: 20, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6, marginBottom: 36 };
  const body: CSSProperties = { fontSize: 34, lineHeight: 1.38, color: "rgba(255,255,255,.72)", maxWidth: 1080, marginTop: 40 };
  const pad: CSSProperties = { position: "absolute", inset: 0, padding: "84px 110px", display: "flex", flexDirection: "column" };

  const art = (
    <>
      {img && <div style={{ position: "absolute", inset: slide.layout === "split" ? "0 0 0 50%" : 0, background: `center / cover no-repeat url("${img}")`, filter: closing ? "saturate(1.45) contrast(1.12) brightness(.92)" : undefined }} />}
      <div style={{ position: "absolute", inset: 0, background: scrim[slide.layout] }} />
    </>
  );
  const top = (
    <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {logo ? <img src={logo} alt="" style={{ height: 34, filter: "brightness(0) invert(1)" }} /> : <span />}
    </div>
  );
  const num = (
    <div style={{ position: "absolute", right: 110, bottom: 72, fontSize: 20, opacity: 0.5, fontFeatureSettings: '"tnum" 1' }}>
      {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
  );
  const cols = (k: number) => `repeat(${Math.min(k, 4)}, 1fr)`;

  let inner: React.ReactNode = null;
  switch (slide.layout) {
    case "cover":
      inner = (
        <div style={{ marginTop: "auto", marginBottom: 20 }}>
          <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
          <T as="h1" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 156, maxWidth: 1500 }} />
          <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...body, marginTop: 44 }} />
        </div>
      );
      break;
    case "section":
      inner = (
        <div style={{ marginTop: "auto", marginBottom: 20 }}>
          <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
          <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 196 }} />
        </div>
      );
      break;
    case "statement":
      inner = (
        <div style={{ margin: "auto 0" }}>
          <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
          <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 104, maxWidth: 1340 }} />
          <T v={slide.body} p={e("body")} edit={edit} style={body} />
        </div>
      );
      break;
    case "points":
    case "metrics": {
      const items = slide.layout === "points" ? slide.points : slide.metrics;
      inner = (
        <>
          <div style={{ marginTop: 80 }}>
            <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 92, maxWidth: 1400 }} />
          </div>
          <div style={{ marginTop: "auto", marginBottom: 56, display: "grid", gridTemplateColumns: cols(items.length), gap: 56 }}>
            {slide.layout === "points"
              ? slide.points.map((pt, i) => (
                  <div key={i} style={{ borderTop: "1px solid rgba(255,255,255,.35)", paddingTop: 28 }}>
                    <div style={{ fontSize: 18, letterSpacing: "0.16em", opacity: 0.5, marginBottom: 22, fontFeatureSettings: '"tnum" 1' }}>{String(i + 1).padStart(2, "0")}</div>
                    <T v={pt.title} p={["points", i, "title"]} edit={edit} style={{ fontFamily: theme.display, fontSize: 40, fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1.1 }} />
                    <T v={pt.body} p={["points", i, "body"]} edit={edit} style={{ fontSize: 25, lineHeight: 1.42, color: "rgba(255,255,255,.66)", marginTop: 14 }} />
                  </div>
                ))
              : slide.metrics.map((m, i) => (
                  <div key={i} style={{ borderTop: "1px solid rgba(255,255,255,.35)", paddingTop: 28 }}>
                    <T v={m.value} p={["metrics", i, "value"]} edit={edit} style={{ ...display, fontSize: 168, fontFeatureSettings: '"tnum" 1' }} />
                    <T v={m.label} p={["metrics", i, "label"]} edit={edit} style={{ fontSize: 26, color: "rgba(255,255,255,.66)", marginTop: 18, maxWidth: 420 }} />
                  </div>
                ))}
          </div>
        </>
      );
      break;
    }
    case "split":
      inner = (
        <div style={{ position: "absolute", inset: "0 50% 0 0", padding: "84px 96px 84px 110px", display: "flex", flexDirection: "column" }}>
          {top}
          <div style={{ marginTop: "auto", marginBottom: 20 }}>
            <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={eyebrow} />
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 92 }} />
            <T v={slide.body} p={e("body")} edit={edit} style={{ ...body, fontSize: 30 }} />
          </div>
        </div>
      );
      break;
    case "quote":
      inner = (
        <div style={{ margin: "auto 0" }}>
          <T as="blockquote" v={`“${slide.quote.replace(/^“|”$/g, "")}”`} p={e("quote")} edit={edit} style={{ ...display, fontSize: 88, maxWidth: 1500, lineHeight: 1.08 }} />
          <T v={slide.author} p={e("author")} edit={edit} style={{ fontSize: 26, opacity: 0.6, marginTop: 52 }} />
        </div>
      );
      break;
    case "closing":
      inner = (
        <>
          {(d.closing?.labels ?? []).map((l) => (
            <div key={l.text} style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`, fontSize: 24 }}>
              {l.text}
              <div style={{ position: "absolute", left: l.angle < 0 ? 20 : 0, top: l.angle < 0 ? -8 : 40, width: 150, height: 1.5, background: "#fff", transform: `rotate(${l.angle}deg)`, transformOrigin: "0 0" }} />
            </div>
          ))}
          <div style={{ marginTop: "auto", marginBottom: 20, maxWidth: 1000 }}>
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 58, letterSpacing: "-0.03em", lineHeight: 1.18, fontWeight: 400 }} />
            <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...body, fontSize: 28, marginTop: 28 }} />
            {(slide.cta?.length || slide.contact) && (
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 44, fontSize: 24 }}>
                {slide.cta?.map((c, i) => (
                  <span key={c} style={{ padding: "16px 26px", borderRadius: 10, fontWeight: 500, background: i === 0 ? "#0a0a0a" : "#E6E6F2", color: i === 0 ? "#fff" : "#0a0a0a" }}>{c}</span>
                ))}
                {slide.contact && <span style={{ marginLeft: 14, color: "rgba(255,255,255,.72)" }}>{slide.contact}</span>}
              </div>
            )}
          </div>
        </>
      );
      break;
  }

  return (
    <div className="slide" style={root}>
      {art}
      <div style={pad}>
        {slide.layout !== "split" && top}
        {slide.layout !== "split" && inner}
      </div>
      {slide.layout === "split" && inner}
      {num}
    </div>
  );
}

/* ---------- gradient style (Builders): one fixed grid, Favorit Expanded titles, the brand wave, B mark ---------- */

const GRID = { x: 110, label: 104, title: 150, content: 520, bottom: 190 };

function GradientSlide({ slide, theme, n, total, edit }: { slide: S; theme: Theme; logo?: string; n: number; total: number; edit?: Edit }) {
  const d = theme.deck;
  const key = slide.gradient ?? d.variant ?? "builders";
  const g = d.gradients?.[key] ?? d.gradients?.builders;
  const light = slide.mode === "light" && slide.layout !== "cover";
  const fg = light ? "#0A0A0A" : "#FFFFFF";
  const soft = light ? "rgba(10,10,10,.46)" : "rgba(255,255,255,.5)";
  const rule = light ? "rgba(10,10,10,.16)" : "rgba(255,255,255,.2)";
  const e = (k: string) => [k];

  const photoBg = slide.photo ?? (slide.layout === "photo" ? slide.image : undefined);
  const full = !light && !photoBg && ["cover", "section", "closing", "cards"].includes(slide.layout);
  const img = slide.background && !["glow", "full", "overlay"].includes(slide.background)
    ? slide.background
    : slide.background === "glow" ? g?.glow : full ? g?.full : g?.overlay;

  const root: CSSProperties = {
    width: W, height: H, position: "relative", overflow: "hidden", color: fg, fontFamily: theme.text,
    background: light ? d.light ?? "#FFFFFF" : d.dark ?? "#000",
    ["--em-font" as string]: "inherit", ["--em-style" as string]: "normal", ["--em-weight" as string]: "inherit",
    ["--em-color" as string]: soft, ["--em-track" as string]: "inherit",
  };
  const title: CSSProperties = { fontFamily: theme.label, fontWeight: 500, textTransform: "uppercase", letterSpacing: "-0.005em", lineHeight: 1.04, margin: 0, fontSize: 76, maxWidth: 1480 };
  const label: CSSProperties = { fontFamily: theme.label, fontSize: 17, letterSpacing: "0.18em", textTransform: "uppercase", color: soft };
  const body: CSSProperties = { fontSize: 40, lineHeight: 1.32, maxWidth: 1180, letterSpacing: "-0.005em" };
  const at = (top: number, extra: CSSProperties = {}): CSSProperties => ({ position: "absolute", left: GRID.x, right: GRID.x, top, ...extra });
  const zone: CSSProperties = { position: "absolute", left: GRID.x, right: GRID.x, top: GRID.content, bottom: GRID.bottom };
  const cols = (k: number) => `repeat(${Math.min(k, 4)}, 1fr)`;

  const eyebrow = "eyebrow" in slide && <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={{ ...at(GRID.label), ...label }} />;
  const heading = (v: string | undefined, extra: CSSProperties = {}) => <T as="h2" v={v} p={e("title")} edit={edit} style={{ ...at(GRID.title), ...title, ...extra }} />;

  let inner: React.ReactNode = null;
  switch (slide.layout) {
    case "cover":
      inner = (
        <>
          {eyebrow}
          <T as="h1" v={slide.title} p={e("title")} edit={edit} style={{ ...at(GRID.title), ...title, fontSize: 132, lineHeight: 1.0 }} />
          <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...zone, top: GRID.content + 90, ...body, fontSize: 34, color: soft, maxWidth: 1000 }} />
        </>
      );
      break;
    case "section":
      inner = <>{eyebrow}{heading(slide.title, { fontSize: 190, lineHeight: 0.98 })}</>;
      break;
    case "statement":
      inner = (
        <>
          {eyebrow}
          {heading(slide.title)}
          <T v={slide.body} p={e("body")} edit={edit} style={{ ...zone, ...body }} />
        </>
      );
      break;
    case "points":
    case "metrics":
      inner = (
        <>
          {eyebrow}
          {heading(slide.title)}
          <div style={{ ...zone, display: "grid", gridTemplateColumns: cols(slide.layout === "points" ? slide.points.length : slide.metrics.length), gap: 60, alignContent: "start" }}>
            {slide.layout === "points"
              ? slide.points.map((pt, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${rule}`, paddingTop: 30 }}>
                    <div style={{ ...label, marginBottom: 26 }}>{String(i + 1).padStart(2, "0")}</div>
                    <T v={pt.title} p={["points", i, "title"]} edit={edit} style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.01em" }} />
                    <T v={pt.body} p={["points", i, "body"]} edit={edit} style={{ fontSize: 25, lineHeight: 1.42, color: soft, marginTop: 14 }} />
                  </div>
                ))
              : slide.metrics.map((m, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${rule}`, paddingTop: 30 }}>
                    <T v={m.value} p={["metrics", i, "value"]} edit={edit} style={{ fontFamily: theme.label, fontSize: 84, fontWeight: 500, lineHeight: 1, whiteSpace: "nowrap" }} />
                    <T v={m.label} p={["metrics", i, "label"]} edit={edit} style={{ fontSize: 25, color: soft, marginTop: 22, maxWidth: 440 }} />
                  </div>
                ))}
          </div>
        </>
      );
      break;
    case "equation": {
      const D = 230, over = 26;
      inner = (
        <>
          {eyebrow}
          {heading(slide.title)}
          <div style={{ ...zone, display: "flex", alignItems: "flex-start" }}>
            {slide.terms.map((t, i) => {
              const hi = slide.highlight === i;
              return (
                <Fragment key={i}>
                  {i > 0 && <span style={{ position: "relative", zIndex: 10, width: 0, left: -over / 2 - 8, top: D / 2 - 20, fontSize: 30, color: hi || slide.highlight === i - 1 ? (light ? "#fff" : "#000") : fg }}>+</span>}
                  <div style={{ position: "relative", marginLeft: i ? -over : 0, zIndex: hi ? 2 : 1 }}>
                    <div style={{ width: D, height: D, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 28, backdropFilter: "blur(20px)",
                      background: hi ? fg : light ? "rgba(10,10,10,.06)" : "rgba(255,255,255,.08)", color: hi ? (light ? "#fff" : "#000") : fg }}>
                      <T v={t.label} p={["terms", i, "label"]} edit={edit} />
                    </div>
                    {t.caption && <T v={t.caption} p={["terms", i, "caption"]} edit={edit} style={{ position: "absolute", top: D + 28, left: 0, right: 0, fontSize: 19, lineHeight: 1.4, color: soft, textAlign: "center", padding: "0 24px" }} />}
                  </div>
                </Fragment>
              );
            })}
            <span style={{ fontSize: 32, margin: `${D / 2 - 22}px 32px 0` }}>=</span>
            <div style={{ width: D, height: D, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 28, background: light ? "rgba(10,10,10,.06)" : "rgba(255,255,255,.08)", backdropFilter: "blur(20px)" }}>
              <T v={slide.result} p={e("result")} edit={edit} />
            </div>
          </div>
        </>
      );
      break;
    }
    case "split":
      inner = (
        <>
          {eyebrow}
          {heading(slide.title, { right: 960, maxWidth: 850, fontSize: 64 })}
          <T v={slide.body} p={e("body")} edit={edit} style={{ ...zone, right: 960, ...body, fontSize: 32, color: soft }} />
          <div style={{ position: "absolute", top: GRID.label, bottom: GRID.bottom - 60, right: GRID.x, width: 760, background: slide.image ? `center / cover url("${slide.image}")` : "rgba(127,127,127,.12)" }} />
        </>
      );
      break;
    case "quote":
      inner = (
        <>
          <T v={slide.author} p={e("author")} edit={edit} style={{ ...at(GRID.label), ...label }} />
          <T as="blockquote" v={slide.quote} p={e("quote")} edit={edit} style={{ ...at(GRID.title), ...body, fontSize: 64, lineHeight: 1.18, maxWidth: 1450, margin: 0 }} />
        </>
      );
      break;
    case "photo":
      inner = (
        <>
          {eyebrow}
          {heading(slide.title, { maxWidth: 1100 })}
          <T v={slide.body} p={e("body")} edit={edit} style={{ ...zone, ...body, fontSize: 34, maxWidth: 900, color: "rgba(255,255,255,.78)" }} />
        </>
      );
      break;
    case "cards":
      inner = (
        <>
          {eyebrow}
          {heading(slide.title)}
          <div style={{ position: "absolute", left: GRID.x, right: GRID.x, top: 400, bottom: GRID.bottom, display: "grid", gridTemplateColumns: cols(slide.cards.length), gap: 24 }}>
            {slide.cards.map((c, i) => (
              <div key={i} style={{ background: "#fff", color: "#0A0A0A", borderRadius: 28, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px -30px rgba(0,0,0,.45)" }}>
                {c.image && <div style={{ flex: 1, minHeight: 0, background: `center / cover url("${c.image}")` }} />}
                <div style={{ padding: "30px 34px 34px" }}>
                  <T v={c.title} p={["cards", i, "title"]} edit={edit} style={{ fontFamily: theme.label, fontSize: 24, letterSpacing: "0.04em", textTransform: "uppercase" }} />
                  <T v={c.body} p={["cards", i, "body"]} edit={edit} style={{ fontSize: 24, lineHeight: 1.4, color: "rgba(10,10,10,.55)", marginTop: 10 }} />
                </div>
              </div>
            ))}
          </div>
        </>
      );
      break;
    case "mosaic": {
      const im = slide.images.slice(0, 4);
      const cell = (u?: string, extra: CSSProperties = {}) => <div style={{ background: u ? `center / cover url("${u}")` : "rgba(127,127,127,.12)", borderRadius: 22, ...extra }} />;
      inner = (
        <>
          {eyebrow}
          {heading(slide.title, { right: 1010, maxWidth: 800, fontSize: 64 })}
          <T v={slide.body} p={e("body")} edit={edit} style={{ ...zone, right: 1010, ...body, fontSize: 32, color: soft }} />
          <div style={{ position: "absolute", top: GRID.label, bottom: GRID.bottom - 60, right: GRID.x, width: 860, display: "grid", gridTemplateColumns: "1.25fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gap: 16 }}>
            {cell(im[0], { gridRow: "1 / 3" })}
            {cell(im[1])}
            {cell(im[2], { gridRow: "2 / 4" })}
            {cell(im[3])}
          </div>
        </>
      );
      break;
    }
    case "closing":
      inner = (
        <>
          <div style={{ ...at(GRID.label), ...label }}>builders.studio</div>
          {heading(slide.title, { fontSize: 104, lineHeight: 1.02 })}
          <div style={{ ...zone, top: GRID.content + 120, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 80 }}>
            <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...body, fontSize: 32, color: soft, maxWidth: 900 }} />
            {!!slide.cta?.length && (
              <div style={{ display: "flex", gap: 14, flex: "none" }}>
                {slide.cta.map((c, i) => (
                  <span key={c} style={{ display: "inline-flex", alignItems: "center", height: 74, padding: "0 38px", borderRadius: 99, fontFamily: theme.label, fontSize: 16, letterSpacing: "0.18em", textTransform: "uppercase",
                    background: i === 0 ? "#fff" : "transparent", color: i === 0 ? "#000" : "#fff", boxShadow: i === 0 ? "none" : "inset 0 0 0 1.5px rgba(255,255,255,.4)" }}>{c}</span>
                ))}
              </div>
            )}
          </div>
        </>
      );
      break;
  }

  return (
    <div className="slide" style={root}>
      {photoBg && <div style={{ position: "absolute", inset: 0, background: `center / cover no-repeat url("${photoBg}")` }} />}
      {photoBg && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.25) 45%, rgba(0,0,0,.55) 100%)" }} />}
      {img && <div style={{ position: "absolute", inset: 0, background: `center / cover no-repeat url("${img}")` }} />}
      {inner}
      <div style={{ position: "absolute", left: GRID.x, bottom: 78, ...label, fontFeatureSettings: '"tnum" 1' }}>{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
      <img src="/ventures/builders/gallery/illustrations/builders-b-mark-white.png" alt="" style={{ position: "absolute", right: GRID.x - 6, bottom: 70, height: 50, filter: light ? "brightness(0)" : undefined }} />
    </div>
  );
}
