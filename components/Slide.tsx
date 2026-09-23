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

/* ---------- gradient style (Builders): black ground, the brand wave, Favorit ---------- */

function GradientSlide({ slide, theme, logo, n, total, edit }: { slide: S; theme: Theme; logo?: string; n: number; total: number; edit?: Edit }) {
  const d = theme.deck;
  const g = d.gradients?.[d.variant ?? "builders"] ?? Object.values(d.gradients ?? {})[0];
  const light = slide.mode === "light" && slide.layout !== "cover";
  const fg = light ? theme.ink : "#FFFFFF";
  const soft = light ? "rgba(26,26,46,.5)" : "rgba(255,255,255,.46)";
  const e = (k: string) => [k];

  // which picture: the full composition for covers, statements and closings; the overlay elsewhere; "glow" on request
  const kind = slide.background === "glow" ? "glow" : ["cover", "statement", "section", "quote", "closing"].includes(slide.layout) ? "full" : "overlay";
  const img = slide.background && !["glow", "full", "overlay"].includes(slide.background) ? slide.background : g?.[kind as "full"] ?? g?.overlay;

  const root: CSSProperties = {
    width: W, height: H, position: "relative", overflow: "hidden", color: fg, fontFamily: theme.text,
    background: light ? d.light ?? "#FAF7F2" : d.dark ?? "#000",
    ["--em-font" as string]: "inherit", ["--em-style" as string]: "normal", ["--em-weight" as string]: "inherit",
    ["--em-color" as string]: soft, ["--em-track" as string]: "inherit",
  };
  const display: CSSProperties = { fontFamily: theme.display, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.12, margin: 0 };
  const label: CSSProperties = { fontFamily: theme.label, fontSize: 18, letterSpacing: "0.16em", textTransform: "uppercase", color: soft, marginBottom: 30 };
  const body: CSSProperties = { fontSize: 30, lineHeight: 1.45, color: soft, maxWidth: 1000, marginTop: 36 };
  const cols = (k: number) => `repeat(${Math.min(k, 4)}, 1fr)`;

  const art = img && (
    <div style={{ position: "absolute", inset: 0, background: `center / cover no-repeat url("${img}")`, opacity: light ? 0.9 : 1 }} />
  );
  const head = (
    <div style={{ position: "absolute", top: 58, left: 64, display: "flex", alignItems: "center", gap: 22 }}>
      {logo && <img src={logo} alt="" style={{ height: 26, filter: light ? undefined : "brightness(0) invert(1)" }} />}
      {d.tagline && <span style={{ fontSize: 18, color: soft }}>{d.tagline}</span>}
    </div>
  );
  const person = (p?: { name: string; role?: string; photo?: string }) =>
    p && (
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        {p.photo && <div style={{ width: 150, height: 150, background: `center / cover url("${p.photo}")` }} />}
        <div>
          <div style={{ fontFamily: theme.label, fontSize: 40, letterSpacing: "0.01em", textTransform: "uppercase", lineHeight: 1 }}>{p.name}</div>
          {p.role && <div style={{ fontSize: 20, color: soft, marginTop: 14 }}>{p.role}</div>}
        </div>
      </div>
    );
  const bMark = <img src="/ventures/builders/gallery/illustrations/builders-b-mark-white.png" alt="" style={{ position: "absolute", right: 72, bottom: 72, height: 72 }} />;
  const centred: CSSProperties = { position: "absolute", inset: "0 200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: 140 };
  const pad: CSSProperties = { position: "absolute", inset: 0, padding: "160px 110px 150px", display: "flex", flexDirection: "column" };

  let inner: React.ReactNode = null;
  switch (slide.layout) {
    case "cover":
      return (
        <div className="slide" style={root}>
          {art}
          <div style={{ position: "absolute", left: 96, top: 96, right: 300 }}>
            <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={label} />
            <T as="h1" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 150, lineHeight: 1.0, letterSpacing: "-0.025em" }} />
            <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...body, marginTop: 40 }} />
          </div>
          <div style={{ position: "absolute", left: 96, bottom: 96 }}>{person(slide.presenter)}</div>
          {bMark}
        </div>
      );
    case "section":
      inner = (
        <div style={centred}>
          <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={label} />
          <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 200, letterSpacing: "-0.03em", lineHeight: 1 }} />
        </div>
      );
      break;
    case "statement":
      inner = (
        <div style={centred}>
          <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={label} />
          <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 78, maxWidth: 1400 }} />
          <T v={slide.body} p={e("body")} edit={edit} style={{ ...body, maxWidth: 1100 }} />
        </div>
      );
      break;
    case "equation": {
      const D = 250, over = 30;
      inner = (
        <div style={{ ...centred, inset: "0 80px" }}>
          {slide.title && <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 64, marginBottom: 90 }} />}
          <div style={{ display: "flex", alignItems: "center" }}>
            {slide.terms.map((t, i) => {
              const hi = slide.highlight === i;
              return (
                <Fragment key={i}>
                {i > 0 && <span style={{ position: "relative", zIndex: 10, width: 0, left: -over / 2 - 8, fontSize: 30, color: slide.highlight === i || slide.highlight === i - 1 ? "#000" : "#fff" }}>+</span>}
                <div style={{ display: "flex", alignItems: "center", marginLeft: i ? -over : 0, position: "relative", zIndex: hi ? 2 : 1 }}>
                  <div style={{ width: hi ? D + 30 : D, height: hi ? D + 30 : D, borderRadius: "50%", display: "grid", placeItems: "center",
                    background: hi ? "#fff" : "rgba(255,255,255,.07)", color: hi ? "#000" : "#fff", backdropFilter: "blur(20px)",
                    boxShadow: hi ? "0 0 80px rgba(255,255,255,.25)" : "inset 0 0 0 1px rgba(255,255,255,.05)", fontSize: hi ? 34 : 30 }}>
                    <T v={t.label} p={["terms", i, "label"]} edit={edit} />
                  </div>
                  {t.caption && <T v={t.caption} p={["terms", i, "caption"]} edit={edit} style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 34, fontSize: 18, lineHeight: 1.4, color: soft, textAlign: "center", padding: "0 30px" }} />}
                </div>
                </Fragment>
              );
            })}
            <span style={{ fontSize: 34, margin: "0 34px" }}>=</span>
            <div style={{ width: D, height: D, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,.07)", backdropFilter: "blur(20px)", fontSize: 30 }}>
              <T v={slide.result} p={e("result")} edit={edit} />
            </div>
          </div>
        </div>
      );
      break;
    }
    case "points":
    case "metrics":
      inner = (
        <>
          <div>
            <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={label} />
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 76, maxWidth: 1400 }} />
          </div>
          <div style={{ marginTop: "auto", marginBottom: 150, display: "grid", gridTemplateColumns: cols(slide.layout === "points" ? slide.points.length : slide.metrics.length), gap: 56 }}>
            {slide.layout === "points"
              ? slide.points.map((pt, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${light ? "rgba(26,26,46,.2)" : "rgba(255,255,255,.22)"}`, paddingTop: 28 }}>
                    <div style={{ fontFamily: theme.label, fontSize: 16, letterSpacing: "0.16em", color: soft, marginBottom: 22 }}>{String(i + 1).padStart(2, "0")}</div>
                    <T v={pt.title} p={["points", i, "title"]} edit={edit} style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.15 }} />
                    <T v={pt.body} p={["points", i, "body"]} edit={edit} style={{ fontSize: 23, lineHeight: 1.45, color: soft, marginTop: 14 }} />
                  </div>
                ))
              : slide.metrics.map((m, i) => (
                  <div key={i}>
                    <T v={m.value} p={["metrics", i, "value"]} edit={edit} style={{ ...display, fontSize: 150, lineHeight: 1, fontFeatureSettings: '"tnum" 1' }} />
                    <T v={m.label} p={["metrics", i, "label"]} edit={edit} style={{ fontSize: 24, color: soft, marginTop: 18, maxWidth: 420 }} />
                  </div>
                ))}
          </div>
        </>
      );
      break;
    case "split":
      inner = (
        <div style={{ margin: "auto 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 90, alignItems: "center", paddingBottom: 40 }}>
          <div>
            <T v={slide.eyebrow} p={e("eyebrow")} edit={edit} style={label} />
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...display, fontSize: 76 }} />
            <T v={slide.body} p={e("body")} edit={edit} style={body} />
          </div>
          <div style={{ height: 600, background: slide.image ? `center / cover url("${slide.image}")` : "rgba(255,255,255,.07)" }} />
        </div>
      );
      break;
    case "quote":
      inner = (
        <>
          <div style={{ marginTop: 10 }}>
            <T as="blockquote" v={slide.quote} p={e("quote")} edit={edit} style={{ ...display, fontSize: 84, maxWidth: 1300, lineHeight: 1.15, margin: 0 }} />
            {!slide.presenter && <T v={slide.author} p={e("author")} edit={edit} style={{ ...label, marginTop: 48, marginBottom: 0 }} />}
          </div>
          <div style={{ marginTop: "auto" }}>{person(slide.presenter)}</div>
          {slide.presenter && bMark}
        </>
      );
      break;
    case "closing": {
      const tiles = d.closing?.tiles ?? [];
      return (
        <div className="slide" style={root}>
          {art}
          <div style={{ position: "absolute", inset: "64px 64px 64px", display: "grid", gridTemplateColumns: tiles.length ? "1fr 540px" : "1fr", gridTemplateRows: "1fr auto", gap: 18 }}>
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 28, background: `linear-gradient(90deg, rgba(0,0,0,.8), rgba(0,0,0,.3)), center / cover url("${d.closing?.image ?? ""}") #111`, padding: "0 70px 70px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...label, color: "rgba(255,255,255,.72)", marginBottom: 22 }} />
              <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ fontFamily: theme.label, fontSize: 84, lineHeight: 1.0, textTransform: "uppercase", margin: 0, maxWidth: 1000 }} />
              {!!slide.cta?.length && (
                <div style={{ display: "flex", gap: 16, marginTop: 50 }}>
                  {slide.cta.map((c, i) => (
                    <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 14, height: 76, padding: "0 40px", borderRadius: 99, fontFamily: theme.label, fontSize: 17, letterSpacing: "0.2em", textTransform: "uppercase",
                      background: i === 0 ? "#fff" : "transparent", color: i === 0 ? "#000" : "#fff", boxShadow: i === 0 ? "none" : "inset 0 0 0 1.5px rgba(255,255,255,.35)" }}>{c} →</span>
                  ))}
                  {slide.contact && <span style={{ alignSelf: "center", marginLeft: 18, fontSize: 24, color: "rgba(255,255,255,.72)" }}>{slide.contact}</span>}
                </div>
              )}
            </div>
            {!!tiles.length && (
              <div style={{ display: "grid", gridTemplateRows: `repeat(${tiles.length}, 1fr)`, gap: 18 }}>
                {tiles.map((t) => (
                  <div key={t.title} style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "0 30px 26px", display: "flex", flexDirection: "column", justifyContent: "flex-end",
                    background: `linear-gradient(0deg, rgba(0,0,0,.82), rgba(0,0,0,.15)), center / cover url("${t.image}")` }}>
                    <svg width="34" height="34" viewBox="0 0 50 51" style={{ position: "absolute", top: 22, right: 24 }}><path d="M46.55 23.65C35.51 23.65 26.52 14.64 26.52 3.47V0H23.48v3.47c0 11.12-8.95 20.18-20.03 20.18H0v3.06h3.45c11.04 0 20.03 9.01 20.03 20.18v3.47h3.04v-3.47c0-11.12 8.95-20.18 20.03-20.18H50v-3.06h-3.45Z" fill="#fff" /></svg>
                    <div style={{ fontFamily: theme.label, fontSize: 21, letterSpacing: "0.14em", textTransform: "uppercase" }}>{t.title}</div>
                    {t.body && <div style={{ fontSize: 23, opacity: 0.75, marginTop: 10 }}>{t.body}</div>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 8px 0" }}>
              {logo && <img src={logo} alt="" style={{ height: 34, filter: "brightness(0) invert(1)" }} />}
              {slide.contact && !slide.cta?.length && <span style={{ fontSize: 22, color: soft }}>{slide.contact}</span>}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="slide" style={root}>
      {art}
      {head}
      <div style={pad}>{inner}</div>
      <div style={{ position: "absolute", right: 64, top: 60, fontSize: 16, color: soft, fontFeatureSettings: '"tnum" 1', letterSpacing: "0.1em" }}>{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
    </div>
  );
}
