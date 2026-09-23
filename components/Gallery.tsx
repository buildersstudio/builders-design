"use client";

import { useState } from "react";
import type { Picture } from "@/lib/content";
import { copy } from "./ui";

const ORDER = ["founders", "team", "photos", "product", "illustrations", "backgrounds", "icons", "other"];
const rank = (g: string) => (ORDER.indexOf(g) + 1 || 50);

/** Every picture a venture owns: copy its public URL for a prompt, or download the file. */
export function Gallery({ pictures }: { pictures: Picture[] }) {
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
              <span>{p.name}</span>
              <button onClick={() => copy(location.origin + p.href, "Link copied")}>Copy link</button>
              <a href={p.href} download={p.href.split("/").pop()}>Download</a>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
