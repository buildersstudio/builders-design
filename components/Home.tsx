"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

type Item = { slug: string; name: string; badge?: string };

/**
 * The home screen: every venture as an app badge. Badges fly in from the edges like an
 * iPhone unlocking, and a click opens the venture the way iOS opens an app.
 */
export function Home({ ventures }: { ventures: Item[] }) {
  const router = useRouter();
  // Each badge starts pushed outwards from the centre of the grid (computed from its slot,
  // so the entrance is pure CSS and plays on first paint).
  const COLS = 6, rows = Math.ceil(ventures.length / COLS);
  const from = (i: number): CSSProperties => {
    const inRow = Math.min(COLS, ventures.length - Math.floor(i / COLS) * COLS);
    const dx = (i % COLS - (inRow - 1) / 2) * 176, dy = (Math.floor(i / COLS) - (rows - 1) / 2) * 180;
    const dist = Math.hypot(dx, dy) || 1;
    return { ["--fx" as string]: `${(dx / dist) * 280 + dx}px`, ["--fy" as string]: `${(dy / dist) * 280 + dy}px`, ["--delay" as string]: `${60 + dist * 0.14}ms` };
  };
  const [opening, setOpening] = useState<{ item: Item; from: DOMRect; open: boolean } | null>(null);

  useEffect(() => { ventures.forEach((v) => router.prefetch(`/${v.slug}/brand`)); }, [router, ventures]);

  const open = (item: Item, el: HTMLElement) => {
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

      <div className="home-grid">
        {ventures.map((v, i) => (
          <button key={v.slug} className="home-app" style={from(i)} onClick={(e) => open(v, e.currentTarget.querySelector(".home-icon") as HTMLElement)} aria-label={v.name}>
            <span className="home-icon">{v.badge ? <img src={v.badge} alt="" /> : <b>{v.name[0]}</b>}</span>
            <span className="home-name">{v.name}</span>
          </button>
        ))}
      </div>

      {opening && (
        <div className={`home-zoom${opening.open ? " open" : ""}`} style={zoom}>
          <span className="home-zoom-icon" style={{ width: opening.from.width * 0.76, height: opening.from.width * 0.76 }}>{opening.item.badge ? <img src={opening.item.badge} alt="" /> : <b>{opening.item.name[0]}</b>}</span>
        </div>
      )}
    </main>
  );
}
