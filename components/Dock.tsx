"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { copy } from "./ui";
import { BadgeArt, badgeStyle } from "./Badge";

type Item = { slug: string; name: string; badge?: string; badgeBg?: string };

/** macOS-style vertical dock of venture badges. */
export function Dock({ ventures, addPrompt }: { ventures: Item[]; addPrompt: string }) {
  const path = usePathname();
  const current = path.split("/")[1];
  const section = path.split("/")[2] ?? "brand";
  const rail = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ name: string; y: number; x: number } | null>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  // the rail scrolls when there are more ventures than fit; fades show there is more
  const edge = () => {
    const r = rail.current;
    if (r) setEdges({ top: r.scrollTop > 2, bottom: r.scrollTop + r.clientHeight < r.scrollHeight - 2 });
  };
  useEffect(() => {
    const r = rail.current;
    if (!r) return;
    r.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: "center" });
    edge();
    const ro = new ResizeObserver(edge);
    ro.observe(r);
    return () => ro.disconnect();
  }, [current]);
  const show = (e: React.MouseEvent<HTMLElement>, name: string) => {
    const b = e.currentTarget.getBoundingClientRect();
    setTip({ name, y: b.top + b.height / 2, x: b.right + 14 });
  };

  // Arriving from the home screen: the app "opens" (the shell scales up into place).
  useEffect(() => {
    try {
      if (sessionStorage.getItem("bd-open")) {
        sessionStorage.removeItem("bd-open");
        const shell = document.querySelector(".shell");
        shell?.classList.add("app-enter");
        setTimeout(() => shell?.classList.remove("app-enter"), 700);
      }
    } catch {}
  }, []);

  return (
    <nav className="dock" aria-label="Ventures">
      <Link href="/" title="Builders Design"><img className="dock-home" src="/brand/spark-black.svg" alt="Builders Design" /></Link>
      <div className={`dock-rail${edges.top ? " fade-top" : ""}${edges.bottom ? " fade-bottom" : ""}`} ref={rail} onScroll={() => { edge(); setTip(null); }}>
        {ventures.map((v) => (
          <Link key={v.slug} href={`/${v.slug}/${section}`} className="dock-item" aria-current={v.slug === current} style={badgeStyle(v.badgeBg)}
            aria-label={v.name} onMouseEnter={(e) => show(e, v.name)} onMouseLeave={() => setTip(null)} onFocus={(e) => show(e as unknown as React.MouseEvent<HTMLElement>, v.name)} onBlur={() => setTip(null)}>
            <BadgeArt name={v.name} badge={v.badge} badgeBg={v.badgeBg} />
          </Link>
        ))}
        <button className="dock-add" title="Add a venture: copies a prompt" onClick={() => copy(addPrompt, "Prompt copied. Paste it into your model")}>+</button>
      </div>
      {tip && <span className="dock-tip dock-tip-float" style={{ top: tip.y, left: tip.x }}>{tip.name}</span>}
      <div style={{ height: 22 }} />
    </nav>
  );
}
