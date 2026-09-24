"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Picture } from "@/lib/content";
import type { Brand, Theme } from "@/lib/types";
import { Artwork, sizeOf } from "./PostArt";
import { PostEditor, type SavedPost } from "./Social";
import { copy, toast, useFit } from "./ui";

/**
 * Social: a gallery of finished posts for the venture, each with three caption variants.
 * Click a post to edit it, "+" to create one, the cross to drop a layout that does not work.
 * Everything saves back to social/posts.json, the same file models write campaigns into.
 */
export function SocialGallery({ slug, name, brand, theme, pictures, initial, prompt }: {
  slug: string; name: string; brand: Brand; theme: Theme; pictures: Picture[]; initial: SavedPost[]; prompt: string;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<SavedPost[]>(initial);
  const [editing, setEditing] = useState<SavedPost | "new" | null>(null);

  const persist = async (next: SavedPost[], msg?: string) => {
    setPosts(next);
    const r = await fetch("/api/social", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ venture: slug, posts: next }) });
    const j = await r.json().catch(() => ({}));
    toast(r.ok ? msg ?? j.message ?? "Saved" : j.error ?? "Could not save");
    if (r.ok) router.refresh();
  };
  const save = (p: SavedPost) => {
    const exists = posts.some((x) => x.id === p.id);
    persist(exists ? posts.map((x) => (x.id === p.id ? p : x)) : [p, ...posts], exists ? "Post saved" : "Post added");
    setEditing(null);
  };
  const remove = (id: string) => persist(posts.filter((x) => x.id !== id), "Post removed");

  if (editing)
    return (
      <PostEditor slug={slug} name={name} brand={brand} theme={theme} pictures={pictures}
        initial={editing === "new" ? undefined : editing}
        onSave={save} onDelete={editing === "new" ? undefined : () => { remove(editing.id); setEditing(null); }} onClose={() => setEditing(null)} />
    );

  return (
    <>
      <div className="sg-tools">
        <button className="icon-btn" onClick={() => copy(prompt, "Prompt copied. Paste it into your model")}>Ask your model</button>
        <button className="icon-btn solid" onClick={() => setEditing("new")}>+ New post</button>
      </div>
      {posts.length ? (
        <div className="sg-grid">
          {posts.map((p, i) => (
            <PostCard key={p.id} n={i + 1} post={p} theme={theme} brand={brand} onOpen={() => setEditing(p)} onRemove={() => remove(p.id)} />
          ))}
        </div>
      ) : (
        <div className="empty"><div><p>No posts yet.</p><button className="icon-btn" onClick={() => setEditing("new")}>Create the first post</button></div></div>
      )}
    </>
  );
}

function PostCard({ n, post, theme, brand, onOpen, onRemove }: { n: number; post: SavedPost; theme: Theme; brand: Brand; onOpen: () => void; onRemove: () => void }) {
  const { w, h } = sizeOf(post.format);
  const [box, scale] = useFit<HTMLDivElement>(w);
  const caps = (post.captions ?? []).filter(Boolean);
  const [v, setV] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <article className="sg-card">
      <div ref={box} className="sg-art" style={{ aspectRatio: `${w} / ${h}` }} onClick={onOpen}>
        {scale > 0 && <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: w, height: h }}><Artwork post={post} theme={theme} brand={brand} /></div>}
        <button className="sg-x" title="Remove this post" onClick={(e) => { e.stopPropagation(); onRemove(); }}>×</button>
      </div>
      <div className="sg-meta">
        <span className="sg-n">{String(n).padStart(2, "0")}</span>
        <span className="sg-angle">{post.angle ?? "Post"}</span>
        {caps.length > 1 && (
          <span className="sg-tabs">
            {caps.map((_, i) => <button key={i} aria-pressed={i === v} onClick={() => setV(i)}>{i + 1}</button>)}
          </span>
        )}
      </div>
      {caps[v] && <p className={open ? "sg-cap open" : "sg-cap"} onClick={() => setOpen(!open)} title={open ? "Show less" : "Read the full caption"}>{caps[v]}</p>}
      {caps[v] && (
        <div className="sg-actions">
          <button className="sg-copy" onClick={() => setOpen(!open)}>{open ? "Show less" : "Read all"}</button>
          <button className="sg-copy" onClick={() => copy(caps[v], `Caption ${v + 1} copied`)}>Copy caption</button>
        </div>
      )}
    </article>
  );
}
