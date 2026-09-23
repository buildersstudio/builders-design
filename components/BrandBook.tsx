"use client";

import type { CSSProperties } from "react";
import type { Brand } from "@/lib/types";
import { themeOf } from "@/lib/types";
import { BrandFonts } from "./BrandFonts";
import { copy, toast } from "./ui";

/** Rasterise an SVG (optionally recoloured) to a 2048px-wide PNG and download it. */
async function savePNG(src: string, name: string, fill?: string) {
  let svg = await (await fetch(src)).text();
  if (fill) svg = svg.replace(/fill="(?!none)[^"]*"/g, `fill="${fill}"`);
  const vb = svg.match(/viewBox="([^"]+)"/)?.[1]?.split(/[\s,]+/).map(Number);
  const [w, h] = vb ? [vb[2], vb[3]] : [1, 1];
  const W = 2048, H = Math.round((W * h) / w);
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg.replace(/<svg\b[^>]*>/, (tag) => tag.replace(/\s(width|height)="[^"]*"/g, "").replace("<svg", `<svg width="${W}" height="${H}"${fill ? ` style="fill:${fill}"` : ""}`))], { type: "image/svg+xml" }));
  await img.decode();
  const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
  c.getContext("2d")!.drawImage(img, 0, 0, W, H);
  c.toBlob((b) => {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(b!), download: `${name}.png` });
    a.click();
    toast(`${name}.png saved`);
  }, "image/png");
}

async function saveSVG(src: string, name: string) {
  const a = Object.assign(document.createElement("a"), { href: src, download: `${name}.svg` });
  a.click();
  toast(`${name}.svg saved`);
}

const lum = (hex: string) => {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
const on = (hex: string) => (lum(hex) > 0.6 ? "#0A0A0A" : "#FFFFFF");

/**
 * A single-screen, grid-built brand book. Every tile does one thing on click:
 * logos save as PNG, colours and typefaces copy to the clipboard.
 */
export function BrandBook({ brand, slug, name }: { brand: Brand; slug: string; name: string }) {
  const t = themeOf(brand);
  const accent = brand.colors.find((c) => c.role === "accent") ?? { name: "Ink", hex: t.ink };
  const swatches = brand.colors;
  const display = brand.type.find((f) => f.role === "display") ?? brand.type[0];
  const text = brand.type.find((f) => f.role === "text") ?? brand.type[1];

  // 12 × 6 grid. Top half: logo and mark. Bottom: colours, type, line.
  const area = (c: string, r: string): CSSProperties => ({ gridColumn: c, gridRow: r });
  const sw = swatches.slice(0, 6);
  const swCols = sw.length <= 3 ? 2 : sw.length <= 4 ? 1.5 : 1;

  return (
    <div className="book">
      <BrandFonts faces={brand.type} />

      <div className="tile logo" style={{ ...area("1 / 8", "1 / 4"), background: t.paper, boxShadow: "inset 0 0 0 1px var(--line)" }}
        onClick={() => brand.logo && savePNG(brand.logo, `${slug}-logo`, t.ink)} title="Click to save PNG">
        {brand.logo ? <img src={brand.logo} alt={`${name} logo`} /> : <span style={{ fontFamily: t.display, fontSize: 64, color: t.ink }}>{name}</span>}
        <span className="cap" style={{ color: t.ink }}>Logo</span>
        {brand.logo && (
          <span className="act" style={{ color: t.ink }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => savePNG(brand.logo!, `${slug}-logo`, t.ink)}>PNG</button>
            <button onClick={() => savePNG(brand.logo!, `${slug}-logo-white`, "#FFFFFF")}>PNG white</button>
            <button onClick={() => saveSVG(brand.logo!, `${slug}-logo`)}>SVG</button>
          </span>
        )}
      </div>

      <div className="tile mark" style={{ ...area("8 / 13", "1 / 4"), background: accent.hex }}
        onClick={() => (brand.mark ?? brand.logo) && savePNG((brand.mark ?? brand.logo)!, `${slug}-mark`, on(accent.hex))} title="Click to save PNG">
        {(brand.mark ?? brand.logo) && <img src={brand.mark ?? brand.logo} alt="" style={{ filter: on(accent.hex) === "#FFFFFF" ? "brightness(0) invert(1)" : "brightness(0)" }} />}
        <span className="cap" style={{ color: on(accent.hex) }}>{brand.mark ? "Mark" : "Logo on accent"}</span>
        {brand.mark && (
          <span className="act" style={{ color: on(accent.hex) }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => savePNG(brand.mark!, `${slug}-mark`, t.ink)}>PNG</button>
            <button onClick={() => savePNG(brand.mark!, `${slug}-mark-white`, "#FFFFFF")}>PNG white</button>
            <button onClick={() => saveSVG(brand.mark!, `${slug}-mark`)}>SVG</button>
          </span>
        )}
      </div>

      {sw.map((c, i) => {
        const start = 1 + Math.round(i * swCols);
        const end = 1 + Math.round((i + 1) * swCols);
        return (
          <div key={c.hex + i} className="tile swatch" style={{ ...area(`${start} / ${end}`, "4 / 7"), background: c.hex, color: on(c.hex), boxShadow: lum(c.hex) > 0.95 ? "inset 0 0 0 1px var(--line)" : undefined }}
            onClick={() => copy(c.hex.toUpperCase(), `${c.hex.toUpperCase()} copied`)} title="Click to copy">
            <span className="hex">{c.hex}</span>
            <span className="nm">{c.name}</span>
          </div>
        );
      })}

      <div className="tile face" style={{ ...area(`${1 + Math.round(sw.length * swCols)} / 10`, "4 / 7"), background: "var(--wash)", color: t.ink }}
        onClick={() => display && copy(display.name, `${display.name} copied`)} title="Click to copy">
        <span className="aa" style={{ fontFamily: t.display, fontWeight: display?.weight ?? 500 }}>Aa</span>
        <span style={{ fontSize: 12 }}>
          {display?.name ?? "Favorit"}
          {text && text.name !== display?.name && <span style={{ opacity: 0.5 }}> · {text.name}</span>}
        </span>
      </div>

      <div className="tile line" style={{ ...area("10 / 13", "4 / 7"), background: t.ink, color: t.paper }}
        onClick={() => brand.tagline && copy(brand.tagline, "Tagline copied")} title="Click to copy">
        <p style={{ fontFamily: t.display, fontWeight: display?.weight ?? 500 }}>{brand.tagline ?? name}</p>
      </div>
    </div>
  );
}
