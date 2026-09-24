"use client";

import { toPng } from "html-to-image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Campaign, CampaignPost, Idea } from "@/lib/content";
import type { Brand, Theme } from "@/lib/types";
import { Artwork, sizeOf, type Post } from "./PostArt";
import { copy, toast, useFit } from "./ui";

/** A campaign post, with defaults for anything the model left out. */
const toPost = (p: CampaignPost, fallbackLabel: string): Post => ({
  format: "portrait", layout: "type", dark: false, shade: true, label: fallbackLabel, title: "",
  ...(p as Partial<Post>),
});

/**
 * Social v2: a venture's content backlog and its campaigns. A model plans each campaign
 * (ten ready-to-post variants with captions) into social/campaigns/; this page shows them
 * finished, ready to copy, download or fine-tune in Social.
 */
export function SocialV2({ slug, brand, theme, campaigns, ideas, ideaPrompt, newPrompt }: {
  slug: string; brand: Brand; theme: Theme; campaigns: Campaign[]; ideas: Idea[]; ideaPrompt: string; newPrompt: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState<string | undefined>(campaigns[0]?.id);
  const c = campaigns.find((x) => x.id === active);
  const [exporting, setExporting] = useState<Post | null>(null);
  const art = useRef<HTMLDivElement>(null);

  const download = async (post: Post, name: string) => {
    setExporting(post);
    await new Promise((r) => setTimeout(r, 350));
    const { w, h } = sizeOf(post.format);
    try {
      const url = await toPng(art.current!, { width: w, height: h, pixelRatio: 2, cacheBust: true });
      Object.assign(document.createElement("a"), { href: url, download: `${slug}-${name}.png` }).click();
      toast("PNG saved");
    } catch { toast("Could not render the PNG"); }
    setExporting(null);
  };

  const edit = (post: Post) => {
    try { sessionStorage.setItem(`bd-post-${slug}`, JSON.stringify(post)); } catch {}
    router.push(`/${slug}/social`);
  };

  return (
    <div className="sv2">
      <aside className="sv2-side">
        <div className="sv2-h">Campaigns</div>
        {campaigns.map((x) => (
          <button key={x.id} className="sv2-item" aria-pressed={x.id === active} onClick={() => setActive(x.id)}>
            <span>{x.title}</span><small>{x.posts.length}</small>
          </button>
        ))}
        <button className="sv2-new" onClick={() => copy(newPrompt, "Prompt copied. Paste it into your model")}>+ New campaign</button>

        <div className="sv2-h" style={{ marginTop: 30 }}>Ideas</div>
        {ideas.length ? ideas.map((i) => (
          <div key={i.id} className="sv2-idea">
            <p>{i.idea}</p>
            {i.status === "campaign" && i.campaign ? (
              <button onClick={() => setActive(i.campaign)}>Open campaign</button>
            ) : (
              <button onClick={() => copy(ideaPrompt + i.idea, "Prompt copied. Paste it into your model")}>Make a campaign</button>
            )}
          </div>
        )) : <p className="sv2-empty">No ideas yet. Add them to social/ideas.json, or ask your model.</p>}
      </aside>

      <section className="sv2-main">
        {c ? (
          <>
            {c.brief && <p className="sv2-brief">{c.brief}</p>}
            <div className="sv2-grid">
              {c.posts.map((p, i) => {
                const post = toPost(p, "");
                return <PostCard key={i} n={i + 1} post={post} angle={p.angle} caption={p.caption} theme={theme} brand={brand}
                  onDownload={() => download(post, `${c.id}-${String(i + 1).padStart(2, "0")}`)} onEdit={() => edit(post)} />;
              })}
            </div>
          </>
        ) : (
          <div className="empty"><div><p>No campaigns yet.</p><button className="icon-btn" onClick={() => copy(newPrompt, "Prompt copied")}>Copy prompt for your model</button></div></div>
        )}
      </section>

      {exporting && (
        <div style={{ position: "fixed", left: -20000, top: 0 }} aria-hidden>
          <div ref={art}><Artwork post={exporting} theme={theme} brand={brand} /></div>
        </div>
      )}
    </div>
  );
}

function PostCard({ n, post, angle, caption, theme, brand, onDownload, onEdit }: {
  n: number; post: Post; angle?: string; caption?: string; theme: Theme; brand: Brand; onDownload: () => void; onEdit: () => void;
}) {
  const { w, h } = sizeOf(post.format);
  const [box, scale] = useFit<HTMLDivElement>(w);
  const [open, setOpen] = useState(false);
  return (
    <article className="sv2-card">
      <div ref={box} className="sv2-art" style={{ aspectRatio: `${w} / ${h}` }}>
        {scale > 0 && <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: w, height: h }}><Artwork post={post} theme={theme} brand={brand} /></div>}
      </div>
      <div className="sv2-meta">
        <span className="sv2-n">{String(n).padStart(2, "0")}</span>
        {angle && <span className="sv2-angle">{angle}</span>}
      </div>
      {caption && <p className={`sv2-cap${open ? " open" : ""}`} onClick={() => setOpen(!open)}>{caption}</p>}
      <div className="sv2-actions">
        {caption && <button className="icon-btn" onClick={() => copy(caption, "Caption copied")}>Copy caption</button>}
        <button className="icon-btn" onClick={onDownload}>PNG</button>
        <button className="icon-btn" onClick={onEdit}>Edit</button>
      </div>
    </article>
  );
}
