"use client";

import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import type { Picture } from "@/lib/content";
import type { Brand, Theme } from "@/lib/types";
import { Artwork, FORMATS, LAYOUTS, sizeOf, type Post } from "./PostArt";
import { toast, useFit } from "./ui";

/**
 * The smallest useful social tool: one branded LinkedIn image, three formats, three layouts,
 * a headline, a label, a picture from the venture's gallery, and a PNG out.
 */
export function Social({ slug, name, brand, theme, pictures }: { slug: string; name: string; brand: Brand; theme: Theme; pictures: Picture[] }) {
  const photos = pictures.filter((p) => !/\.svg$/i.test(p.href) && p.group !== "icons");
  const [post, setPost] = useState<Post>({
    format: "portrait",
    layout: "type",
    dark: theme.deck.style !== "pixel" && theme.deck.style !== "field",
    shade: true,
    color: undefined,
    stat: "",
    label: name,
    title: brand.tagline ?? `${name}.`,
    photo: photos.find((p) => p.group === "photos" || p.group === "backgrounds")?.href ?? photos[0]?.href,
  });
  const set = <K extends keyof Post>(k: K, v: Post[K]) => setPost((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`bd-post-${slug}`);
      if (raw) { sessionStorage.removeItem(`bd-post-${slug}`); setPost((p) => ({ ...p, ...JSON.parse(raw) })); }
    } catch {}
  }, [slug]);
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
        <button className="icon-btn solid social-dl" onClick={download} disabled={busy}>{busy ? "Rendering" : `Download PNG · ${f.w}×${f.h}`}</button>
      </aside>
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

