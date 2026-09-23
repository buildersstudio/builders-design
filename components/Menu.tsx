"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { slug: string; name: string; url?: string; sections: { key: string; label: string; count: number }[] };

export function Menu({ slug, name, url, sections }: Props) {
  const active = usePathname().split("/")[2];
  return (
    <aside className="menu">
      <div className="menu-head">
        <div className="menu-name">{name}</div>
        {url && <a className="menu-url" href={url} target="_blank" rel="noreferrer">{new URL(url).hostname.replace(/^www\./, "")}</a>}
      </div>
      <nav className="menu-list">
        {sections.map((s) => (
          <Link key={s.key} href={`/${slug}/${s.key}`} className="menu-link" aria-current={active === s.key ? "page" : undefined}>
            {s.label}
            {s.count > 0 && s.key !== "brand" && <small>{s.count}</small>}
          </Link>
        ))}
      </nav>
      <div className="menu-foot"><img src="/brand/builders-logo.svg" alt="Builders" /><span>Design</span></div>
    </aside>
  );
}
