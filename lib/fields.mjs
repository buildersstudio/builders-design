// Krans "fields": quantised squares whose opacity carries a magnitude, in one hue.
// Same maths as krans.ai (components/marks/field.ts, GradientMosaic, AnimatedMosaic),
// so gallery illustrations and slide backgrounds read as the site's own patterns.

const COMPOSITIONS = {
  bloom: [[0.5, 0.5, 0.26]],
  twin: [[0.27, 0.42, 0.17], [0.72, 0.6, 0.17]],
  ridge: [[0.2, 0.5, 0.34], [0.5, 0.5, 0.34], [0.8, 0.5, 0.34]],
  edge: [[0.04, 0.5, 0.42]],
  diagonal: [[0.12, 0.88, 0.3], [0.38, 0.62, 0.3], [0.64, 0.36, 0.3], [0.9, 0.1, 0.3]],
  scatter: [[0.16, 0.26, 0.1], [0.44, 0.7, 0.1], [0.72, 0.3, 0.1], [0.88, 0.74, 0.1], [0.3, 0.5, 0.08], [0.6, 0.52, 0.08]],
  ring: [[0.5, 0.16, 0.13], [0.84, 0.5, 0.13], [0.5, 0.84, 0.13], [0.16, 0.5, 0.13]],
};

const falloff = (x, y, src) => Math.min(1, src.reduce((v, [sx, sy, s]) => v + Math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / (2 * s * s)), 0));

/** Shape fields: the same squares, but the pattern reads as a thing. */
const SHAPES = {
  horizon: (x, y) => {
    const crest = 0.5 + 0.1 * Math.sin(x * Math.PI * 2.1 + 0.6) + 0.05 * Math.sin(x * Math.PI * 5.3);
    return y < crest ? 0 : Math.min(1, 0.18 + (y - crest) * 2.2);
  },
  funnel: (x, y) => {
    const throat = 0.62;
    if (x < throat) {
      const f = x / throat, half = 0.46 * Math.pow(1 - f, 1.15) + 0.05, d = Math.abs(y - 0.5);
      if (d < half) return 0.22 + f * 0.55 + (1 - d / half) * 0.2;
      return d < half + 0.1 ? 0.07 : 0;
    }
    return Math.abs(y - 0.5) < 0.09 ? 1 : 0;
  },
  halo: (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, d = Math.sqrt(dx * dx + dy * dy * 3.2);
    return Math.min(1, Math.pow(Math.max(0, 1 - d / 0.52), 1.7) + Math.exp(-Math.pow((d - 0.4) / 0.05, 2)) * 0.55);
  },
  ledger: (x, y) => {
    const h = [0.72, 0.34, 0.9, 0.5, 0.62, 0.28, 0.81, 0.44, 0.68, 0.36, 0.94, 0.55, 0.4][Math.floor(x * 13)] ?? 0.5;
    const up = 1 - y;
    return up > h ? 0.05 : 0.28 + (1 - up / h) * 0.6;
  },
  decay: (x, y) => {
    if (Math.abs(y - 0.5) > 0.3) return 0.04;
    const keep = Math.pow(1 - x, 1.6), dither = Math.sin(x * 97.3 + y * 61.7) * 0.5 + 0.5;
    return dither < keep ? 0.35 + keep * 0.6 : 0.05;
  },
  thread: (x, y) => {
    let v = 0;
    for (let i = 0; i < 3; i++) {
      const cy = 0.24 + i * 0.26 + 0.07 * Math.sin(x * Math.PI * 2 * 1.3 + i * 2.1);
      v = Math.max(v, Math.exp(-Math.pow((y - cy) / 0.075, 2)));
    }
    return v * (0.35 + x * 0.6);
  },
  gaps: (x, y) => {
    const col = Math.floor(x * 13), row = Math.floor(y * 5), holes = ["3,1", "8,3", "10,1", "5,3"];
    if (holes.includes(`${col},${row}`)) return 0;
    return holes.some((h) => { const [c, r] = h.split(",").map(Number); return Math.abs(c - col) <= 1 && Math.abs(r - row) <= 1; }) ? 0.92 : 0.22;
  },
};

export const FIELD_KINDS = [...Object.keys(COMPOSITIONS), ...Object.keys(SHAPES)];

export function magnitude(kind, x, y) {
  if (COMPOSITIONS[kind]) return falloff(x, y, COMPOSITIONS[kind]);
  return (SHAPES[kind] ?? SHAPES.thread)(x, y);
}

/**
 * An SVG string: `cols` x `rows` rounded squares filling width x height, opacity = magnitude.
 * `floor` is the opacity of empty cells (0 hides them, which suits coloured grounds).
 */
export function fieldSVG({ kind = "bloom", color = "#f95738", cols = 26, rows = 15, width = 1300, height = 750, gap = 0.18, radius = 0.18, floor = 0.04, background, fluid = false }) {
  const cw = width / cols, ch = height / rows, s = Math.min(cw, ch) * (1 - gap), r = s * radius;
  const out = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const v = magnitude(kind, (i + 0.5) / cols, (j + 0.5) / rows);
      const o = v <= 0 ? floor : Math.min(1, 0.05 + Math.pow(v, 1.3) * 0.92);
      if (o < 0.015) continue;
      const x = i * cw + (cw - s) / 2, y = j * ch + (ch - s) / 2;
      out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="${r.toFixed(1)}" fill-opacity="${o.toFixed(3)}"/>`);
    }
  const bg = background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : "";
  const size = fluid ? `width="100%" height="100%" preserveAspectRatio="xMidYMid meet"` : `width="${width}" height="${height}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ${size}>${bg}<g fill="${color}">${out.join("")}</g></svg>`;
}
