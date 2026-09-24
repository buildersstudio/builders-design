"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Slide as S, Theme } from "@/lib/types";
import { isCutout } from "@/lib/types";
import { H, T, W } from "./Slide";
import { Wordmark } from "./PostBoot";

type Edit = (path: (string | number)[], value: string) => void;

/**
 * "boot" style (Day Zero). The pixel wallpapers carry the personality, so the deck stays quiet:
 * cover, section and closing sit on a wallpaper with one window; every other slide is cream,
 * with a thin title bar, Favorit for the words and LisaTerminal only for labels and numbers.
 */
const C = { black: "#000", cream: "#FAF7F2", grey: "#E4E4E4", muted: "#6E6E78", pink: "#C2507F" };
const X = 120;

export function BootSlide({ slide, theme, n, total, edit }: { slide: S; theme: Theme; logo?: string; n: number; total: number; edit?: Edit }) {
  const d = theme.deck;
  const keys = Object.keys(d.walls ?? {});
  const wallKey = (slide.gradient && d.walls?.[slide.gradient] ? slide.gradient : undefined) ?? (d.variant && d.walls?.[d.variant] ? d.variant : keys[n % Math.max(keys.length, 1)]);
  const wall = d.walls?.[wallKey]?.slide;
  const e = (k: string) => [k];
  const mono: CSSProperties = { fontFamily: theme.label, WebkitFontSmoothing: "none", fontWeight: 400, letterSpacing: 0 };
  const root: CSSProperties = {
    width: W, height: H, position: "relative", overflow: "hidden", background: C.cream, color: C.black, fontFamily: theme.text,
    ["--em-font" as string]: "inherit", ["--em-style" as string]: "normal", ["--em-weight" as string]: "inherit", ["--em-color" as string]: C.pink, ["--em-track" as string]: "inherit",
  };
  const page = String(n).padStart(2, "0");
  const title: CSSProperties = { fontFamily: theme.display, fontWeight: 500, fontSize: 92, lineHeight: 1, letterSpacing: "-0.035em", margin: 0 };
  const body: CSSProperties = { fontSize: 30, lineHeight: 1.4, color: "#3a3a44", maxWidth: 1100 };
  const eyebrow = "eyebrow" in slide ? slide.eyebrow : undefined;

  const Win = ({ bar, meta, children, style }: { bar?: string; meta?: string; children: ReactNode; style: CSSProperties }) => (
    <div style={{ position: "absolute", border: "4px solid #000", background: C.cream, boxShadow: "16px 16px 0 #000", ...style }}>
      <div style={{ position: "absolute", inset: 7, border: "2px solid #000", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "relative", zIndex: 2, height: 60, display: "flex", alignItems: "center", gap: 18, padding: "0 22px", background: C.black, color: C.cream, ...mono, fontSize: 34, whiteSpace: "nowrap" }}>
        <span style={{ width: 26, height: 26, border: `4px solid ${C.cream}`, flex: "none" }} />
        <span style={{ flex: 1 }}>{bar}</span>
        {meta && <span style={{ opacity: 0.7 }}>{meta}</span>}
      </div>
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );

  /* ---------- wallpaper slides ---------- */
  if (slide.layout === "cover" || slide.layout === "closing" || slide.layout === "section") {
    const bg: CSSProperties = { ...root, background: wall ? `center / cover url("${wall}")` : C.black, imageRendering: "pixelated" };
    const foot = (
      <div style={{ position: "absolute", left: X, right: X, bottom: 90, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Wordmark color={C.cream} width={560} shadow={10} />
        <span style={{ ...mono, fontSize: 34, color: C.cream, textShadow: "4px 4px 0 #000" }}>{slide.layout === "cover" ? "Builders, Rotterdam" : page}</span>
      </div>
    );
    if (slide.layout === "section")
      return (
        <div className="slide" style={bg}>
          <Win bar={eyebrow || page} style={{ left: X, top: 150, width: 1100 }}>
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...mono, fontSize: 150, lineHeight: 1, padding: "60px 56px 64px", margin: 0 }} />
          </Win>
          {foot}
        </div>
      );
    const closing = slide.layout === "closing";
    return (
      <div className="slide" style={bg}>
        <Win bar={closing ? "shutdown.exe" : "day-zero.exe"} meta={closing ? undefined : eyebrow} style={{ left: X, top: 140, width: 1240 }}>
          <div style={{ padding: "60px 60px 64px" }}>
            <T as="h1" v={slide.title} p={e("title")} edit={edit} style={{ ...title, fontSize: 104 }} />
            <T v={slide.subtitle} p={e("subtitle")} edit={edit} style={{ ...mono, fontSize: 38, lineHeight: 1.3, marginTop: 44, color: "#2a2a34" }} />
            {closing && !!slide.cta?.length && (
              <div style={{ display: "flex", gap: 20, marginTop: 44 }}>
                {slide.cta.map((c) => <span key={c} style={{ ...mono, fontSize: 34, padding: "12px 26px", background: C.black, color: C.cream, boxShadow: `inset 0 0 0 3px ${C.cream}`, border: "3px solid #000" }}>&gt; {c}</span>)}
              </div>
            )}
          </div>
        </Win>
        {foot}
      </div>
    );
  }

  /* ---------- quiet slides: cream, one title bar ---------- */
  const bar = (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 56, display: "flex", alignItems: "center", gap: 18, padding: `0 ${X}px`, background: C.black, color: C.cream, ...mono, fontSize: 30 }}>
      <span style={{ width: 22, height: 22, border: `4px solid ${C.cream}` }} />
      <T v={eyebrow} p={e("eyebrow")} edit={edit} style={{ flex: 1 }} />
      <span style={{ opacity: 0.7 }}>{page} / {String(total).padStart(2, "0")}</span>
    </div>
  );
  const head = (maxWidth = 1500) => (
    <div style={{ position: "absolute", left: X, right: X, top: 170, maxWidth }}>
      {"title" in slide && <T as="h2" v={slide.title} p={e("title")} edit={edit} style={title} />}
      {"body" in slide && <T v={slide.body} p={e("body")} edit={edit} style={{ ...body, marginTop: 36 }} />}
    </div>
  );
  const zone: CSSProperties = { position: "absolute", left: X, right: X, top: 560, bottom: 120 };
  const cols = (k: number) => `repeat(${Math.min(k, 4)}, 1fr)`;
  let inner: ReactNode = null;

  switch (slide.layout) {
    case "statement":
      inner = (
        <div style={{ position: "absolute", left: X, right: X, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1560 }}>
          <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...title, fontSize: 124, lineHeight: 0.98, letterSpacing: "-0.045em" }} />
          <T v={slide.body} p={e("body")} edit={edit} style={{ ...body, marginTop: 44 }} />
        </div>
      );
      break;
    case "points":
      inner = (
        <>
          {head()}
          <div style={{ ...zone, display: "grid", gridTemplateColumns: cols(slide.points.length), gap: 48 }}>
            {slide.points.map((pt, i) => (
              <div key={i} style={{ borderTop: "3px solid #000", paddingTop: 26 }}>
                <div style={{ ...mono, fontSize: 30, color: C.muted, marginBottom: 30 }}>{String(i + 1).padStart(2, "0")}</div>
                <T v={pt.title} p={["points", i, "title"]} edit={edit} style={{ fontFamily: theme.display, fontWeight: 500, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em" }} />
                <T v={pt.body} p={["points", i, "body"]} edit={edit} style={{ fontSize: 24, lineHeight: 1.45, color: "#3a3a44", marginTop: 14 }} />
              </div>
            ))}
          </div>
        </>
      );
      break;
    case "metrics":
      inner = (
        <>
          {head()}
          <div style={{ ...zone, display: "grid", gridTemplateColumns: cols(slide.metrics.length), gap: 48 }}>
            {slide.metrics.map((m, i) => (
              <div key={i} style={{ borderTop: "3px solid #000", paddingTop: 26 }}>
                <T v={m.value} p={["metrics", i, "value"]} edit={edit} style={{ ...mono, fontSize: 150, lineHeight: 1 }} />
                <T v={m.label} p={["metrics", i, "label"]} edit={edit} style={{ fontSize: 26, lineHeight: 1.4, color: "#3a3a44", marginTop: 18 }} />
              </div>
            ))}
          </div>
        </>
      );
      break;
    case "split":
    case "photo":
    case "showcase": {
      const img = slide.image;
      const cut = isCutout(img);
      inner = (
        <>
          <div style={{ position: "absolute", left: X, top: 170, width: 700 }}>
            <T as="h2" v={slide.title} p={e("title")} edit={edit} style={{ ...title, fontSize: 80 }} />
            <T v={slide.body} p={e("body")} edit={edit} style={{ ...body, fontSize: 27, marginTop: 34 }} />
          </div>
          {img && (
            <div style={{ position: "absolute", left: 940, right: X, top: 150, bottom: 130, display: "grid", placeItems: "center" }}>
              {cut ? (
                <img src={img} alt="" style={{ maxWidth: "100%", maxHeight: "100%", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", border: "4px solid #000", boxShadow: "16px 16px 0 #000", background: `center / cover url("${img}")` }} />
              )}
            </div>
          )}
        </>
      );
      break;
    }
    case "quote":
      inner = (
        <div style={{ position: "absolute", left: X, right: X, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1500 }}>
          <T as="blockquote" v={slide.quote} p={e("quote")} edit={edit} style={{ ...title, fontSize: 84, lineHeight: 1.08, margin: 0 }} />
          <T v={slide.author} p={e("author")} edit={edit} style={{ ...mono, fontSize: 32, marginTop: 44, color: C.muted }} />
        </div>
      );
      break;
    case "cards":
      inner = (
        <>
          {head()}
          <div style={{ ...zone, display: "grid", gridTemplateColumns: cols(slide.cards.length), gap: 40 }}>
            {slide.cards.map((c, i) => (
              <div key={i} style={{ border: "3px solid #000", boxShadow: "10px 10px 0 #000", background: "#fff", padding: 28 }}>
                <T v={c.title} p={["cards", i, "title"]} edit={edit} style={{ fontFamily: theme.display, fontWeight: 500, fontSize: 34, lineHeight: 1.1 }} />
                <T v={c.body} p={["cards", i, "body"]} edit={edit} style={{ fontSize: 22, lineHeight: 1.45, color: "#3a3a44", marginTop: 12 }} />
              </div>
            ))}
          </div>
        </>
      );
      break;
    default:
      inner = head();
  }

  return (
    <div className="slide" style={root}>
      {bar}
      {inner}
    </div>
  );
}
