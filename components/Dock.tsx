"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy } from "./ui";

type Item = { slug: string; name: string; badge?: string };

/** macOS-style vertical dock of venture badges. */
export function Dock({ ventures, addPrompt }: { ventures: Item[]; addPrompt: string }) {
  const path = usePathname();
  const current = path.split("/")[1];
  const section = path.split("/")[2] ?? "brand";

  return (
    <nav className="dock" aria-label="Ventures">
      <Link href="/" title="Builders Design"><img className="dock-home" src="/brand/spark-black.svg" alt="Builders Design" /></Link>
      <div className="dock-rail">
        {ventures.map((v) => (
          <Link key={v.slug} href={`/${v.slug}/${section}`} className="dock-item" aria-current={v.slug === current}>
            {v.badge ? <img src={v.badge} alt={v.name} /> : <span className="mono">{v.name[0]}</span>}
            <span className="dock-tip">{v.name}</span>
          </Link>
        ))}
        <button className="dock-add" title="Add a venture: copies a prompt" onClick={() => copy(addPrompt, "Prompt copied. Paste it into your model")}>+</button>
      </div>
      <div style={{ height: 22 }} />
    </nav>
  );
}
