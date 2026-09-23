// Renders Krans field patterns into its gallery: `node scripts/krans-fields.mjs`
import fs from "node:fs";
import path from "node:path";
import { fieldSVG } from "../lib/fields.mjs";

const G = path.join(process.cwd(), "public/ventures/krans/gallery");
const C = { orange: "#F95738", blue: "#30BCED", purple: "#5E239D" };
const write = (dir, name, svg) => { fs.mkdirSync(path.join(G, dir), { recursive: true }); fs.writeFileSync(path.join(G, dir, name), svg); };

// illustrations: one hue per field, transparent, 26 x 15 like the site
const ILL = [
  ["bloom", "orange"], ["twin", "blue"], ["ring", "purple"], ["twin", "orange"], ["scatter", "blue"], ["edge", "purple"], ["horizon", "blue"],
  ["funnel", "orange"], ["halo", "purple"], ["ledger", "blue"], ["decay", "orange"], ["thread", "purple"], ["gaps", "blue"],
];
for (const [kind, c] of ILL) write("illustrations", `pattern-${kind}-${c}.svg`, fieldSVG({ kind, color: C[c] }));

// slide-sized backgrounds on cream
for (const [kind, c] of [["horizon", "blue"], ["horizon", "orange"], ["edge", "purple"], ["bloom", "orange"]])
  write("backgrounds", `field-${kind}-${c}-on-cream.svg`, fieldSVG({ kind, color: C[c], cols: 48, rows: 27, width: 1920, height: 1080, background: "#EFE9DB" }));
console.log("ok");
