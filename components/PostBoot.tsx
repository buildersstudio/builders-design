import type { CSSProperties, ReactNode } from "react";
import type { Brand, Theme } from "@/lib/types";
import { rich } from "./Slide";
import type { Post } from "./PostArt";
import { sizeOf } from "./PostArt";

/* ---------- "boot" style (Day Zero): pixel wallpapers, Lisa era windows, copy written as code ---------- */

const C = { black: "#000", cream: "#FAF7F2", grey: "#E4E4E4", studio: "#8193FF", studioDeep: "#4E5BD6", network: "#E986B4", networkDeep: "#C2507F", capitalDeep: "#A8743F", muted: "#6E6E78" };

// 5x7 bitmap letters for the wordmark
const GLYPHS: Record<string, string[]> = {
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"], A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"], Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  O: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"], " ": ["000", "000", "000", "000", "000", "000", "000"],
};

export function Wordmark({ color, width, shadow }: { color: string; width: number; shadow?: number }) {
  let x = 0;
  const rects: ReactNode[] = [];
  for (const ch of "DAY ZERO") {
    const g = GLYPHS[ch];
    g.forEach((row, y) => [...row].forEach((b, i) => { if (b === "1") rects.push(<rect key={`${x + i}-${y}`} x={x + i} y={y} width={1.02} height={1.02} />); }));
    x += g[0].length + 1;
  }
  const vw = x - 1;
  return (
    <svg viewBox={`0 0 ${vw} 7`} width={width} height={(width * 7) / vw} shapeRendering="crispEdges" style={{ display: "block", overflow: "visible", filter: shadow ? `drop-shadow(${shadow}px ${shadow}px 0 #000)` : undefined }}>
      <g fill={color}>{rects}</g>
    </svg>
  );
}

/** A few lines of code, lightly highlighted, one line per row with line numbers. */
function highlight(line: string, dark: boolean) {
  const out: ReactNode[] = [];
  const re = /(\/\/.*$)|("[^"]*"|'[^']*')|(\b\d+\b)|(\b(?:const|let|new|while|if|else|return|import|from|export|default|await|async|type|function|for|of|true|false|null)\b)|(\bok\b)|(\brunning\b|\bskipped\b)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const color = m[1] ? (dark ? "#8b8b9a" : "#7d7d88") : m[2] ? (dark ? C.network : C.networkDeep) : m[3] ? (dark ? "#D4A574" : C.capitalDeep) : m[4] ? (dark ? C.studio : C.studioDeep) : m[5] ? C.studio : m[6]?.startsWith("r") ? C.network : "#8b8b9a";
    out.push(<span key={k++} style={{ color }}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function BootArtwork({ post, theme }: { post: Post; theme: Theme; brand: Brand }) {
  const { w, h } = sizeOf(post.format);
  const wide = w / h > 1.4;
  const u = (w / 1080) * (wide ? 0.74 : 1);
  const pad = (wide ? 64 : 96) * (w / 1080);
  const walls = theme.deck.walls ?? {};
  const wallKey = post.color && walls[post.color] ? post.color : Object.keys(walls)[0];
  const wall = walls[wallKey]?.[post.format];
  const lisa = theme.label;
  const px = (n: number) => Math.round(n * u);

  const root: CSSProperties = {
    width: w, height: h, position: "relative", overflow: "hidden", background: wall ? `center / cover url("${wall}")` : C.black, imageRendering: "pixelated",
    fontFamily: theme.text, color: C.black, WebkitFontSmoothing: "antialiased",
    ["--em-font" as string]: "inherit", ["--em-style" as string]: "normal", ["--em-weight" as string]: "inherit", ["--em-color" as string]: C.networkDeep, ["--em-track" as string]: "inherit",
  };
  const mono: CSSProperties = { fontFamily: lisa, WebkitFontSmoothing: "none", fontWeight: 400, letterSpacing: 0 };

  const Win = ({ bar, tone = "black", meta, children, style }: { bar: string; tone?: "black" | "pink" | "blue" | "stripes"; meta?: string; children: ReactNode; style?: CSSProperties }) => {
    const b = px(4), barH = px(60);
    const bg = tone === "pink" ? C.network : tone === "blue" ? C.studio : tone === "stripes" ? `repeating-linear-gradient(0deg, #000 0 ${px(4)}px, ${C.cream} ${px(4)}px ${px(8)}px)` : C.black;
    const ink = tone === "black" ? C.cream : C.black;
    return (
      <div style={{ position: "absolute", border: `${b}px solid #000`, background: C.grey, boxShadow: `${px(14)}px ${px(14)}px 0 #000`, ...style }}>
        <div style={{ position: "absolute", inset: px(7), border: `${px(2)}px solid #000`, pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, height: barH, display: "flex", alignItems: "center", gap: px(18), padding: `0 ${px(22)}px`, background: bg, color: ink, ...mono, fontSize: px(38), whiteSpace: "nowrap" }}>
          <span style={{ width: px(28), height: px(28), border: `${b}px solid ${ink}`, background: tone === "stripes" ? C.cream : undefined, flex: "none" }} />
          <span style={tone === "stripes" ? { background: C.cream, padding: `0 ${px(14)}px`, margin: "0 auto" } : { flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{bar}</span>
          {meta && tone !== "stripes" && <span style={{ opacity: 0.7 }}>{meta}</span>}
        </div>
        <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
      </div>
    );
  };

  const edition = post.stat ? `Edition ${post.stat}` : "";
  const foot = (right?: string) => (
    <div style={{ position: "absolute", left: pad, right: pad, bottom: pad * (wide ? 0.8 : 1.1), display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <Wordmark color={C.cream} width={px(wide ? 560 : 480)} shadow={px(10)} />
      {right && <span style={{ ...mono, fontSize: px(40), color: C.cream, textShadow: `${px(4)}px ${px(4)}px 0 #000` }}>{right}</span>}
    </div>
  );

  const footH = px(wide ? 560 : 480) * 7 / 45 + pad * (wide ? 0.8 : 1.1);
  const Stage = ({ children }: { children: ReactNode }) => (
    <div style={{ position: "absolute", left: pad, right: pad, top: wide ? pad * 0.7 : pad, bottom: footH + px(wide ? 36 : 60), display: "flex", alignItems: "center" }}>{children}</div>
  );

  const Code = ({ text, dark, size = 40 }: { text: string; dark: boolean; size?: number }) => (
    <div style={{ ...mono, fontSize: px(size), lineHeight: `${px(size * 1.4)}px`, padding: `${px(34)}px 0 ${px(40)}px`, background: dark ? C.black : C.cream, color: dark ? C.cream : C.black, whiteSpace: "pre" }}>
      {text.split("\n").map((line, i, all) => (
        <div key={i} style={{ position: "relative", paddingLeft: px(size * 2.8), minHeight: px(size * 1.4) }}>
          <span style={{ position: "absolute", left: 0, width: px(size * 2.1), textAlign: "right", color: dark ? "#55556a" : "#9a9aa6" }}>{i + 1}</span>
          {highlight(line, dark)}
          {i === all.length - 1 && <span style={{ display: "inline-block", width: px(size * 0.55), height: px(size), background: dark ? C.cream : C.black, verticalAlign: -px(size * 0.15) }} />}
        </div>
      ))}
    </div>
  );

  /* ---------- window: the Luma cover ---------- */
  if (post.layout === "window") {
    const inner = wide ? w - pad * 2 - px(100) : w - px(240) - px(100);
    return (
      <div style={root}>
        <Win bar={post.label || "day-zero.exe"} meta={post.stat} style={wide ? { left: pad * 2, right: pad * 2, top: "50%", transform: "translateY(-50%)" } : { left: px(120), right: px(120), top: "50%", transform: "translateY(-54%)" }}>
          <div style={{ background: C.cream }}>
            <div style={{ padding: `${px(54)}px ${px(50)}px ${px(46)}px` }}><Wordmark color="#000" width={wide ? inner - pad * 2 : inner} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: px(30), ...mono, fontSize: px(40), padding: `0 ${px(50)}px ${px(44)}px` }}>
              <span>{post.title || edition}</span><span>{post.body}</span>
            </div>
          </div>
        </Win>
      </div>
    );
  }

  /* ---------- guest: the speaker as an arcade avatar ---------- */
  if (post.layout === "guest") {
    const pic = px(420);
    return (
      <div style={root}>
        <Stage>
        <Win bar={post.label || "guest.exe"} meta="Player 1" tone={post.dark ? "pink" : "black"} style={{ position: "relative", width: "100%" }}>
          <div style={{ background: C.cream, display: "grid", gridTemplateColumns: `${pic}px 1fr` }}>
            <div style={{ height: pic, background: post.dark ? C.network : C.studio, borderRight: `${px(4)}px solid #000`, overflow: "hidden", display: "grid", placeItems: "end center" }}>
              {post.photo ? <img src={post.photo} alt="" style={{ width: pic, height: pic, display: "block", imageRendering: "pixelated" }} /> : <Unknown size={pic} />}
            </div>
            <div style={{ padding: `${px(34)}px ${px(36)}px`, display: "flex", flexDirection: "column", justifyContent: "space-between", ...mono }}>
              <div>
                <div style={{ fontSize: px(34), color: C.muted }}>GUEST</div>
                <div style={{ fontSize: px(56), lineHeight: `${px(60)}px`, marginTop: px(10), whiteSpace: "pre-line" }}>{post.title || "loading..."}</div>
              </div>
              <div>
                <div style={{ fontSize: px(34), color: C.muted }}>THEME</div>
                <div style={{ fontSize: px(44), lineHeight: `${px(50)}px`, marginTop: px(6) }}>{post.body || "tba"}</div>
              </div>
              <div style={{ display: "flex", gap: px(6) }}>{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ width: px(34), height: px(22), background: i < 5 ? C.networkDeep : "#CFCFCF" }} />)}</div>
            </div>
          </div>
        </Win>
        </Stage>
        {foot(edition)}
      </div>
    );
  }

  /* ---------- code: the copy as a program (dark: the terminal) ---------- */
  if (post.layout === "code") {
    const lines = post.title.split("\n");
    // fit the longest line: LisaTerminal advances about 0.6em per character, plus the line-number gutter
    const longest = Math.max(...lines.map((l) => l.length), 10);
    const avail = (w - pad * 2 - px(30)) / u;
    const size = Math.min(40, avail / (longest * 0.6 + 2.8), lines.length > 9 ? 34 : 40);
    return (
      <div style={root}>
        <Stage>
          <Win bar={post.label || "day-zero.ts"} tone={post.dark ? "blue" : "pink"} style={{ position: "relative", width: "100%" }}>
            <Code text={post.title} dark={post.dark} size={size} />
          </Win>
        </Stage>
        {foot(post.body || edition)}
      </div>
    );
  }

  /* ---------- headline: a README window with one sentence ---------- */
  return (
    <div style={root}>
      <Stage>
      <Win bar={post.label || "README.md"} tone="stripes" style={{ position: "relative", width: "100%" }}>
        <div style={{ background: C.cream, padding: `${px(56)}px ${px(50)}px ${px(60)}px` }}>
          <div style={{ fontFamily: theme.display, fontWeight: 500, fontSize: px(wide ? 88 : 92), lineHeight: 0.98, letterSpacing: "-0.04em" }} dangerouslySetInnerHTML={{ __html: rich(post.title) }} />
          {post.body && (
            <div style={{ ...mono, fontSize: px(40), marginTop: px(40) }}>
              &gt; {post.body}<span style={{ display: "inline-block", width: px(22), height: px(40), background: "#000", verticalAlign: -px(6), marginLeft: px(6) }} />
            </div>
          )}
        </div>
      </Win>
      </Stage>
      {foot(edition)}
    </div>
  );
}

/** A mystery sprite for a guest not yet announced. */
function Unknown({ size }: { size: number }) {
  const q = ["01110", "10001", "00001", "00010", "00100", "00000", "00100"];
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" style={{ display: "block" }}>
      <g fill="#FAF7F2">{q.flatMap((row, y) => [...row].map((b, x) => (b === "1" ? <rect key={`${x}-${y}`} x={x + 3.5} y={y + 2.5} width={1.02} height={1.02} /> : null)))}</g>
    </svg>
  );
}
