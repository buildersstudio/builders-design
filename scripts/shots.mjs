// Captures the above-the-fold header of every competitor site into
// public/ventures/<slug>/competitors/<host>.jpg
//
//   npm run shots             missing shots, all ventures
//   npm run shots -- cortena  one venture
//   npm run shots -- --force  recapture everything
//
// Needs Chromium once: npx playwright install chromium

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.join(process.cwd(), "public", "ventures");
const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

const ventures = fs.readdirSync(ROOT).filter((v) => fs.existsSync(path.join(ROOT, v, "competitors.json")) && (!only.length || only.includes(v)));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
  locale: "en-US",
});

// Hide the usual cookie walls so the header is what we see.
const HIDE = `
  body :is([id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [id*="onetrust" i],
  [class*="onetrust" i], #CybotCookiebotDialog, #usercentrics-root, [aria-label*="cookie" i],
  [class*="intercom"], #hubspot-messages-iframe-container, [id*="didomi" i]) { display: none !important; }
  html, body { overflow: hidden !important; }`;

const jobs = [];
for (const v of ventures) {
  const list = JSON.parse(fs.readFileSync(path.join(ROOT, v, "competitors.json"), "utf8"));
  fs.mkdirSync(path.join(ROOT, v, "competitors"), { recursive: true });
  for (const c of list) {
    const host = new URL(c.url).hostname.replace(/^www\./, "");
    const out = path.join(ROOT, v, "competitors", `${host}.jpg`);
    if (!force && fs.existsSync(out)) continue;
    jobs.push({ v, url: c.url, out, host });
  }
}

let done = 0;
async function shoot({ v, url, out, host }) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    // Dismiss consent banners the polite way first, then hide whatever is left.
    for (const label of [/reject all/i, /^deny$/i, /decline/i, /only necessary|necessary only|essential only/i]) {
      const b = page.getByRole("button", { name: label }).first();
      if (await b.isVisible().catch(() => false)) { await b.click({ timeout: 1500 }).catch(() => {}); break; }
    }
    await page.waitForTimeout(1500);
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    await page.screenshot({ path: out, type: "jpeg", quality: 78 });
    console.log(`✓ ${v} ${host}`);
  } catch (e) {
    console.log(`✗ ${v} ${host}  ${String(e.message).split("\n")[0]}`);
  } finally {
    done++;
    await page.close();
  }
}

const queue = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await shoot(queue.shift()); }));
await browser.close();
console.log(`${done} captured or attempted.`);
