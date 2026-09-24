"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Picture } from "@/lib/content";
import { copy, toast } from "./ui";

const ORDER = ["founders", "team", "photos", "product", "illustrations", "backgrounds", "icons", "other"];
const rank = (g: string) => (ORDER.indexOf(g) + 1 || 50);

/** Every picture a venture owns: copy its public URL for a prompt, download the file, or remove it. */
export function Gallery({ pictures: initial }: { pictures: Picture[] }) {
  const router = useRouter();
  const [pictures, setPictures] = useState(initial);
  const remove = async (p: Picture) => {
    if (!confirm(`Remove ${p.name} from the gallery?`)) return;
    const r = await fetch("/api/gallery", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ href: p.href }) });
    const j = await r.json().catch(() => ({}));
    toast(r.ok ? j.message ?? "Removed" : j.error ?? "Could not remove");
    if (r.ok) { setPictures((xs) => xs.filter((x) => x.id !== p.id)); router.refresh(); }
  };
  const groups = [...new Set(pictures.map((p) => p.group))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const [group, setGroup] = useState<string | null>(null);
  const shown = (group ? pictures.filter((p) => p.group === group) : pictures).slice().sort((a, b) => rank(a.group) - rank(b.group));

  return (
    <>
      {groups.length > 1 && (
        <nav className="chips">
          <button aria-pressed={!group} onClick={() => setGroup(null)}>All</button>
          {groups.map((g) => (
            <button key={g} aria-pressed={group === g} onClick={() => setGroup(g)}>{g[0].toUpperCase() + g.slice(1)}</button>
          ))}
        </nav>
      )}
      <div className="masonry">
        {shown.map((p) => (
          <figure key={p.id} className="pic">
            <img src={p.href} alt={p.name} loading="lazy" />
            <figcaption>
              <button title="Copy link" aria-label="Copy link" onClick={() => copy(location.origin + p.href, "Link copied")}><LinkIcon /></button>
              <a title="Download" aria-label="Download" href={p.href} download={p.href.split("/").pop()}><DownloadIcon /></a>
              <button title="Remove" aria-label="Remove" onClick={() => remove(p)}><RemoveIcon /></button>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" />
  </svg>
);

const RemoveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12" /><path d="M18 6 6 18" />
  </svg>
);
