import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-g-orsucci-dev-builders-design/82c12f53-a593-4b66-8b94-7589800997cc/scratchpad/shots";
const id = process.argv[2] || "2026-09-24-workshop";
const tag = process.argv[3] || "v";
const url = `http://localhost:4330/ventures/drawgen/variants/${id}/index.html`;
const b = await chromium.launch();
const errs = [];
for (const [w, h, name] of [[1440, 900, "desk"], [390, 844, "mob"]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  p.on("console", m => { if (m.type() === "error") errs.push(`${name}: ${m.text()}`); });
  p.on("pageerror", e => errs.push(`${name} pageerror: ${e.message}`));
  p.on("requestfailed", r => errs.push(`${name} failed: ${r.url()}`));
  await p.goto(url, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${id}-${tag}-${name}-first.png` });
  // scroll through to trigger reveals
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  const sw = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  console.log(name, "scrollWidth", sw, "height", H);
  await p.screenshot({ path: `${OUT}/${id}-${tag}-${name}-full.png`, fullPage: true });
  await p.close();
}
console.log("errors:", errs.length ? errs.join("\n") : "none");
await b.close();
