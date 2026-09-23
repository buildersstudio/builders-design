"use client";

import type { CSSProperties, ElementType } from "react";
import type { Slide as S, Theme } from "@/lib/types";

export const W = 1920;
export const H = 1080;

type Edit = (path: (string | number)[], value: string) => void;

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Copy may mark a phrase as *emphasis*; it renders in the brand's serif italic when the deck style defines one. */
const rich = (t = "") =>
  esc(t).replace(/\*([^*]+)\*/g, '<em style="font-family:var(--serif,inherit);font-style:italic;font-weight:400;letter-spacing:-0.01em">$1</em>');

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
  return props.theme.deck.style === "imagery" ? <ImagerySlide {...props} /> : <PlainSlide {...props} />;
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
