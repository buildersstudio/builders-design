"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { BadgeArt, badgeStyle } from "./Badge";

type Item = { slug: string; name: string; badge?: string; badgeBg?: string; locked?: boolean };

/**
 * The home screen: every venture as an app badge. Badges fly in from the edges like an
 * iPhone unlocking, and a click opens the venture the way iOS opens an app.
 */
export function Home({ ventures }: { ventures: Item[] }) {
  const router = useRouter();
  // Each badge starts pushed outwards from the centre of the grid (computed from its slot,
  // so the entrance is pure CSS and plays on first paint).
  const COLS = ventures.length > 12 ? 7 : 6, rows = Math.ceil(ventures.length / COLS);
  const from = (i: number): CSSProperties => {
    const inRow = Math.min(COLS, ventures.length - Math.floor(i / COLS) * COLS);
    const dx = (i % COLS - (inRow - 1) / 2) * 176, dy = (Math.floor(i / COLS) - (rows - 1) / 2) * 180;
    const dist = Math.hypot(dx, dy) || 1;
    return { ["--fx" as string]: `${(dx / dist) * 280 + dx}px`, ["--fy" as string]: `${(dy / dist) * 280 + dy}px`, ["--delay" as string]: `${60 + dist * 0.14}ms` };
  };
  const [opening, setOpening] = useState<{ item: Item; from: DOMRect; open: boolean } | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { setUnlocked(document.cookie.split("; ").includes("bd_unlocked=1")); }, []);

  useEffect(() => { ventures.forEach((v) => { if (!v.locked || unlocked) router.prefetch(`/${v.slug}/brand`); }); }, [router, ventures, unlocked]);

  const open = (item: Item, el: HTMLElement) => {
    if (item.locked && !unlocked) { router.push(`/unlock?next=${encodeURIComponent(`/${item.slug}/brand`)}`); return; }
    const from = el.getBoundingClientRect();
    setOpening({ item, from, open: false });
    requestAnimationFrame(() => requestAnimationFrame(() => setOpening({ item, from, open: true })));
    try { sessionStorage.setItem("bd-open", "1"); } catch {}
    setTimeout(() => router.push(`/${item.slug}/brand`), 330);
  };

  const zoom: CSSProperties | undefined = opening
    ? opening.open
      ? { left: 0, top: 0, width: "100vw", height: "100vh", borderRadius: 0 }
      : { left: opening.from.left, top: opening.from.top, width: opening.from.width, height: opening.from.height, borderRadius: opening.from.width * 0.235 }
    : undefined;

  return (
    <main className={`home${opening ? " leaving" : ""}`}>
      <header className="home-top">
        <img src="/brand/builders-logo.svg" alt="Builders" />
        <span>Design</span>
      </header>

      <div className="home-grid" style={{ ["--cols" as string]: COLS }}>
        {ventures.map((v, i) => (
          <button key={v.slug} className="home-app" style={from(i)} onClick={(e) => open(v, e.currentTarget.querySelector(".home-icon") as HTMLElement)} aria-label={v.name}>
            <span className="home-icon" style={badgeStyle(v.badgeBg)}><BadgeArt name={v.name} badge={v.badge} badgeBg={v.badgeBg} />{v.locked && !unlocked && <i className="lock-mark in"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" aria-hidden><path d="M2.5 4.5h5v4h-5z" /><path d="M3.5 4.5V3a1.5 1.5 0 0 1 3 0v1.5" /></svg></i>}</span>
            <span className="home-name">{v.name}</span>
          </button>
        ))}
      </div>

      {opening && (
        <div className={`home-zoom${opening.open ? " open" : ""}`} style={{ ...zoom, ...(opening.item.badgeBg && opening.item.badgeBg !== "cover" ? { background: opening.item.badgeBg } : {}) }}>
          <span className="home-zoom-icon" style={{ width: opening.from.width, height: opening.from.width }}><BadgeArt name={opening.item.name} badge={opening.item.badge} badgeBg={opening.item.badgeBg} /></span>
        </div>
      )}
    </main>
  );
}
