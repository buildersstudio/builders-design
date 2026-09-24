// Day Zero "Boot Sequence" pixels: the Builders gradients re-rendered as ordered-dither
// pixel art in the Builders palette, plus arcade-style guest avatars from cut-out portraits.
// node scripts/day-zero-pixels.mjs <out-dir>
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const G = "public/ventures/builders/gallery/backgrounds";
const out = process.argv[2] ?? "public/ventures/day-zero/variants/2026-09-26-boot-sequence/assets";
const gallery = "public/ventures/day-zero/gallery";
for (const d of [out, `${gallery}/backgrounds`, `${gallery}/avatars`]) fs.mkdirSync(d, { recursive: true });

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// Builders palette (ink, deep, studio, network, capital, cream) with the tints between them
export const PALETTE = ["#000000", "#0B0B1A", "#1A1A2E", "#2C2F66", "#4E5BD6", "#8193FF", "#B7BFFF", "#A98BD8", "#C9679A", "#E986B4", "#F3B8D2", "#D4A574", "#EBCFAE", "#FAF7F2"].map(hex);

const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
];
const nearest = (r, g, b, pal) => {
  let best = 0, d = Infinity;
  for (let i = 0; i < pal.length; i++) {
    const [pr, pg, pb] = pal[i], e = (r - pr) ** 2 * 0.3 + (g - pg) ** 2 * 0.59 + (b - pb) ** 2 * 0.11;
    if (e < d) { d = e; best = i; }
  }
  return pal[best];
};

/** Resize to cols x rows, dither to the palette, upscale by `cell` with hard edges. */
async function pixelate(input, { cols, rows, cell, spread = 44, pal = PALETTE, alpha = false, outline = false, fit = "cover", position = "centre", modulate }) {
  let img = sharp(input);
  if (modulate) img = img.modulate(modulate);
  const { data, info } = await img.resize(cols, rows, { fit, position, kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(cols * rows * 4);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4, t = (BAYER[y % 8][x % 8] / 64 - 0.5) * spread;
      const a = data[i + 3];
      const [r, g, b] = nearest(data[i] + t, data[i + 1] + t, data[i + 2] + t, pal);
      px.set([r, g, b, alpha ? (a > 200 ? 255 : 0) : 255], i);
    }
  if (outline) {
    // a one-cell ink outline around the silhouette, like a game sprite
    const solid = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && px[(y * cols + x) * 4 + 3] === 255;
    const edge = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push((y * cols + x) * 4);
    for (const i of edge) px.set([26, 26, 46, 255], i);
  }
  return sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).resize(cols * cell, rows * cell, { kernel: "nearest" });
}

// Wallpapers: the colour band of each gradient, lifted so the whole frame is colour
const walls = [
  ["builders", "gradient-builders-full.jpg"], ["studio", "gradient-studio-full.jpg"],
  ["network", "gradient-network-full.jpg"], ["capital", "gradient-capital-full.jpg"],
];
for (const [name, file] of walls) {
  const src = path.join(G, file);
  // crop the lower, colourful 58% of the 1920x1080 source
  const band = await sharp(src).extract({ left: 0, top: 450, width: 1920, height: 630 }).toBuffer();
  await (await pixelate(band, { cols: 320, rows: 180, cell: 6 })).png({ palette: true }).toFile(`${out}/wall-${name}.png`);
  await (await pixelate(band, { cols: 180, rows: 180, cell: 6 })).png({ palette: true }).toFile(`${out}/wall-${name}-square.png`);
  await (await pixelate(band, { cols: 180, rows: 225, cell: 6 })).png({ palette: true }).toFile(`${out}/wall-${name}-portrait.png`);
  // the gallery set, one per social format (square 1080, portrait 1080x1350, landscape 1200x627)
  await (await pixelate(band, { cols: 180, rows: 180, cell: 6 })).png({ palette: true }).toFile(`${gallery}/backgrounds/pixel-wall-${name}-square.png`);
  await (await pixelate(band, { cols: 180, rows: 225, cell: 6 })).png({ palette: true }).toFile(`${gallery}/backgrounds/pixel-wall-${name}-portrait.png`);
  await (await pixelate(band, { cols: 200, rows: 105, cell: 6 })).png({ palette: true }).toFile(`${gallery}/backgrounds/pixel-wall-${name}-landscape.png`);
}
// The full frame with its dark sky, for the page hero
await (await pixelate(path.join(G, "gradient-builders-full.jpg"), { cols: 320, rows: 180, cell: 6 })).png({ palette: true }).toFile(`${out}/wall-builders-night.png`);

// Arcade avatars: cut-out portraits (PNG with alpha) -> 64x64 sprites, 8 tone palette + Builders accents
const SKIN = ["#1A1A2E", "#3A2A2E", "#5A3E36", "#7E5646", "#A6735E", "#C99479", "#E2B399", "#F2D2BC", "#FAF7F2", "#DEDBD6", "#8C8C96", "#D4A574", "#8E3A1C", "#B24A22", "#DE6A34"].map(hex);
for (const f of process.env.AVATARS?.split(",").filter(Boolean) ?? []) {
  const name = path.basename(f).replace(/\.[a-z]+$/i, "");
  // head and shoulders: trim the transparent margin, keep the top 95% so the face fills the sprite
  // erode the alpha by a few pixels: the soft edge of a cut-out still carries the old background colour
  const src = sharp(f).ensureAlpha();
  const { width: W, height: H } = await src.metadata();
  const rgb = await sharp(f).removeAlpha().raw().toBuffer();
  const mask = await sharp(f).extractChannel(3).blur(4).threshold(235).raw().toBuffer();
  const cut = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).joinChannel(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  const { data, info } = await sharp(cut).trim().toBuffer({ resolveWithObject: true });
  const side = Math.min(info.width, Math.round(info.height * 0.95));
  const crop = await sharp(data).extract({ left: Math.round((info.width - side) / 2), top: 0, width: side, height: side }).extend({ top: 24, left: 24, right: 24, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const sprite = (await pixelate(crop, { cols: 72, rows: 72, cell: 12, pal: SKIN, spread: 10, alpha: true, fit: "cover", position: "top", modulate: { saturation: 1.15 } })).png({ palette: true });
  await sprite.toFile(`${out}/avatar-${process.env.AVATAR_OUT ?? name}.png`);
  if (process.env.AVATAR_NAME) await sprite.toFile(`${gallery}/avatars/avatar-${process.env.AVATAR_NAME}.png`);
}
console.log("done", out);
