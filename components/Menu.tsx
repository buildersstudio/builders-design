"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SectionIcon } from "./SectionIcon";

type Props = { slug: string; name: string; url?: string; logo?: string; sections: { key: string; label: string; count: number }[] };

export function Menu({ slug, name, url, logo, sections }: Props) {
  const active = usePathname().split("/")[2];
  return (
    <aside className="menu">
      <div className="menu-head">
        {logo ? <img className="menu-logo" src={logo} alt={name} /> : <div className="menu-name">{name}</div>}
        {url && (
          <a className="menu-web" href={url} target="_blank" rel="noreferrer" aria-label={`Open ${new URL(url).hostname.replace(/^www\./, "")}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></svg>
            <span className="dock-tip">{new URL(url).hostname.replace(/^www\./, "")}</span>
          </a>
        )}
      </div>
      <nav className="menu-list">
        {sections.map((s) => (
          <Link key={s.key} href={`/${slug}/${s.key}`} className="menu-link" aria-current={active === s.key ? "page" : undefined}>
            <span className="menu-label"><SectionIcon name={s.key} />{s.label}</span>
            {s.count > 0 && s.key !== "brand" && <small>{s.count}</small>}
          </Link>
        ))}
      </nav>
      <div className="menu-foot"><img src="/brand/builders-logo.svg" alt="Builders" /><span>Design</span></div>
    </aside>
  );
}
