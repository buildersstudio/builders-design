import type { Page } from "@/lib/content";
import { PagePreview } from "./ui";

export function PageGrid({ pages }: { pages: Page[] }) {
  return (
    <div className="grid wide">
      {pages.map((p) => (
        <a key={p.id} className="card" href={p.href} target="_blank" rel="noreferrer">
          <div className="thumb"><PagePreview src={p.href} /></div>
          <div className="meta"><b>{p.title}<span className="arrow">↗</span></b><span>{p.created ?? p.id}</span></div>
        </a>
      ))}
    </div>
  );
}
