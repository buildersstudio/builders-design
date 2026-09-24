// Renders the Day Zero Boot Sequence covers and posts to PNG at full size (1080 wide).
// Needs the dev server: npm run dev, then node scripts/day-zero-export.mjs
import { chromium } from "playwright";
import fs from "node:fs";
const dir = "public/ventures/day-zero/variants/2026-09-26-boot-sequence";
fs.mkdirSync(`${dir}/assets/export`, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1400 } });
await p.goto(`http://localhost:4330/${dir.replace("public/", "")}/index.html?source`, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
const n = await p.locator(".tile").count();
for (let i = 0; i < n; i++) {
  const name = await p.locator(".tile").nth(i).locator(".cap a").getAttribute("href");
  await p.evaluate((i) => {
    document.querySelector("#stage")?.remove();
    const art = document.querySelectorAll(".tile .art")[i].cloneNode(true);
    art.style.transform = "none";
    const stage = Object.assign(document.createElement("div"), { id: "stage" });
    stage.style.cssText = "position:fixed;left:0;top:0;z-index:9999";
    stage.appendChild(art); document.body.appendChild(stage);
  }, i);
  await p.waitForTimeout(150);
  await p.locator("#stage .art").screenshot({ path: `${dir}/${name}` });
  console.log(name);
}
await b.close();
