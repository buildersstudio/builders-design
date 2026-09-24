"use client";

import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import type { Picture } from "@/lib/content";
import type { Brand, Theme } from "@/lib/types";
import { Artwork, FORMATS, LAYOUTS, sizeOf, type Post } from "./PostArt";
import { copy, toast, useFit } from "./ui";

export type SavedPost = Post & { id: string; angle?: string; captions?: string[] };

/**
 * The post editor: the visual on the left, the controls and three caption variants on the right.
 * It opens as a layer over the Social gallery, for an existing post or a new one.
 */
export function PostEditor({ slug, name, brand, theme, pictures, initial, onSave, onDelete, onClose }: {
  slug: string; name: string; brand: Brand; theme: Theme; pictures: Picture[];
  initial?: SavedPost; onSave: (p: SavedPost) => void; onDelete?: () => void; onClose: () => void;
}) {
  const photos = pictures.filter((p) => !/\.svg$/i.test(p.href) && p.group !== "icons");
  const [post, setPost] = useState<SavedPost>(initial ?? {
    id: `p${Date.now().toString(36)}`,
    format: "portrait",
    layout: "type",
    dark: theme.deck.style !== "pixel" && theme.deck.style !== "field",
    shade: true,
    stat: "",
    label: name,
    title: brand.tagline ?? `${name}.`,
    photo: photos.find((p) => p.group === "photos" || p.group === "backgrounds")?.href ?? photos[0]?.href,
    captions: ["", "", ""],
  });
  const set = <K extends keyof SavedPost>(k: K, v: SavedPost[K]) => setPost((p) => ({ ...p, [k]: v }));
  const caps = [...(post.captions ?? []), "", "", ""].slice(0, 3);
  const setCap = (i: number, v: string) => set("captions", caps.map((c, j) => (j === i ? v : c)));
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  const f = sizeOf(post.format);
  const palette = Object.keys(theme.deck.palette ?? {});
  const [box, scale] = useFit<HTMLDivElement>(f.w, f.h);
  const art = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!art.current) return;
    setBusy(true);
    try {
      const url = await toPng(art.current, { width: f.w, height: f.h, pixelRatio: 2, cacheBust: true, style: { transform: "none" } });
      Object.assign(document.createElement("a"), { href: url, download: `${slug}-${post.layout}-${f.w}x${f.h}.png` }).click();
      toast("PNG saved");
    } catch {
      toast("Could not render the PNG");
    }
    setBusy(false);
  };

  return (
    <div className="social-layer">
      <div className="social-bar">
        <button className="back" onClick={onClose}>Social</button>
        <span style={{ color: "var(--faint)" }}>/</span>
        <span>{initial ? post.angle || "Post" : "New post"}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
          {onDelete && <button className="icon-btn" onClick={onDelete}>Delete</button>}
          <button className="icon-btn" onClick={download} disabled={busy}>{busy ? "Rendering" : "PNG"}</button>
          <button className="icon-btn solid" onClick={() => onSave({ ...post, captions: caps })}>Save</button>
        </div>
      </div>
    <div className="social">
      <div className="social-stage" ref={box}>
        {scale > 0 && (
          <div style={{ width: f.w * scale, height: f.h * scale, position: "relative", boxShadow: "0 0 0 1px var(--line), 0 30px 80px -40px rgba(0,0,0,.3)", borderRadius: 6, overflow: "hidden" }}>
            <div ref={art} style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
              <Artwork post={post} theme={theme} brand={brand} />
            </div>
          </div>
        )}
      </div>

      <aside className="social-panel">
        <Field label="Format">
          <Seg options={FORMATS.map((x) => [x.key, x.label])} value={post.format} onChange={(v) => set("format", v as Post["format"])} />
        </Field>
        <Field label="Layout">
          <Seg options={LAYOUTS.map((x) => [x.key, x.label])} value={post.layout} onChange={(v) => set("layout", v as Post["layout"])} />
        </Field>
        {palette.length ? (
          <Field label="Colour">
            <Seg options={[["", "Cream"], ...palette.map((k) => [k, k[0].toUpperCase() + k.slice(1)] as [string, string])]} value={post.color ?? ""} onChange={(v) => set("color", v || undefined)} />
          </Field>
        ) : (
          <Field label="Ground">
            <Seg options={[["dark", "Dark"], ["light", "Light"]]} value={post.dark ? "dark" : "light"} onChange={(v) => set("dark", v === "dark")} />
          </Field>
        )}
        {(post.layout === "photo" || (post.layout === "type" && theme.deck.style === "imagery")) && (
          <Field label="Shade">
            <Seg options={[["on", "On"], ["off", "Off"]]} value={post.shade ? "on" : "off"} onChange={(v) => set("shade", v === "on")} />
          </Field>
        )}
        <Field label="Label">
          <input className="social-input" value={post.label} onChange={(e) => set("label", e.target.value)} />
        </Field>
        {post.layout === "stat" && (
          <Field label="Number">
            <input className="social-input" value={post.stat ?? ""} onChange={(e) => set("stat", e.target.value)} placeholder="125M+" />
          </Field>
        )}
        <Field label="Headline" hint="*words* for emphasis">
          <textarea className="social-input" rows={4} value={post.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        {post.layout !== "type" && post.layout !== "stat" && !!photos.length && (
          <Field label="Picture">
            <div className="social-pics">
              {photos.slice(0, 40).map((p) => (
                <button key={p.id} aria-pressed={post.photo === p.href} onClick={() => set("photo", p.href)} style={{ backgroundImage: `url("${p.href}")` }} title={p.name} />
              ))}
            </div>
          </Field>
        )}
        <Field label="Angle">
          <input className="social-input" value={post.angle ?? ""} onChange={(e) => set("angle", e.target.value)} placeholder="The announcement" />
        </Field>
        {caps.map((c, i) => (
          <Field key={i} label={`Caption ${i + 1}`} hint={c ? "" : "optional"}>
            <textarea className="social-input" rows={5} value={c} onChange={(e) => setCap(i, e.target.value)} />
            {c && <button type="button" className="social-copy" onClick={() => copy(c, "Caption copied")}>Copy caption {i + 1}</button>}
          </Field>
        ))}
      </aside>
    </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="social-field">
      <span>{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  );
}

function Seg({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="chips" style={{ margin: 0 }}>
      {options.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

