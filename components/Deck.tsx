"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Deck, Slide as S, Theme } from "@/lib/types";
import { H, Slide, W } from "./Slide";
import { copy, toast, useFit } from "./ui";

/* ---------- a slide scaled into whatever box it is given ---------- */

export function SlideBox({ slide, theme, logo, n, total, edit, fit = "width" }: {
  slide: S; theme: Theme; logo?: string; n: number; total: number; edit?: (p: (string | number)[], v: string) => void; fit?: "width" | "contain";
}) {
  const [ref, scale] = useFit<HTMLDivElement>(W, fit === "contain" ? H : undefined);
  const inner = (
    <div className="slide-frame" style={{ width: W * scale, height: H * scale }}>
      <div className="slide" style={{ position: "absolute", transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <Slide slide={slide} theme={theme} logo={logo} n={n} total={total} edit={edit} />
      </div>
    </div>
  );
  if (fit === "contain")
    return <div ref={ref} style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>{scale > 0 && inner}</div>;
  return <div ref={ref} style={{ width: "100%", aspectRatio: "16 / 9" }}>{scale > 0 && inner}</div>;
}

/* ---------- full-screen player (share page and "Present") ---------- */

export function Player({ deck, theme, logo, start = 0, onClose }: { deck: Deck; theme: Theme; logo?: string; start?: number; onClose?: () => void }) {
  const [i, setI] = useState(start);
  const [ui, setUi] = useState(false);
  const n = deck.slides.length;
  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(n - 1, x + d))), [n]);
  const full = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(e.key)) { e.preventDefault(); go(1); }
      if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(-1); }
      if (e.key === "Home") setI(0);
      if (e.key === "End") setI(n - 1);
      if (e.key === "f") full();
      if (e.key === "Escape" && onClose && !document.fullscreenElement) onClose();
    };
    const exit = () => { if (!document.fullscreenElement && onClose) onClose(); };
    window.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", exit);
    return () => { window.removeEventListener("keydown", key); document.removeEventListener("fullscreenchange", exit); };
  }, [go, n, onClose]);

  useEffect(() => {
    if (!ui) return;
    const t = setTimeout(() => setUi(false), 1800);
    return () => clearTimeout(t);
  }, [ui, i]);

  useEffect(() => {
    if (onClose) return;
    const s = Number(new URLSearchParams(location.search).get("s"));
    if (s > 0) setI(Math.min(n, s) - 1);
  }, [n, onClose]);

  useEffect(() => {
    const u = new URL(location.href);
    u.searchParams.set("s", String(i + 1));
    if (!onClose) history.replaceState(null, "", u);
  }, [i, onClose]);

  return (
    <div className={`present${ui ? " cursor" : ""}`} style={{ zIndex: 50 }} onMouseMove={() => setUi(true)}
      onClick={(e) => go(e.clientX > window.innerWidth / 3 ? 1 : -1)}>
      <div style={{ width: "100vw", height: "100vh" }}>
        <SlideBox slide={deck.slides[i]} theme={theme} logo={logo} n={i + 1} total={n} fit="contain" />
      </div>
      <div className="present-bar" style={{ width: `${((i + 1) / n) * 100}%` }} />
      <div className="present-ui" onClick={(e) => e.stopPropagation()}>
        <span>{i + 1} / {n}</span>
        <button onClick={full}>Full screen</button>
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
    </div>
  );
}

/* ---------- editor: thumbnails rail + stage ---------- */

function setIn(obj: unknown, path: (string | number)[], value: string): unknown {
  if (!path.length) return value;
  const [k, ...rest] = path;
  const copyOf = Array.isArray(obj) ? [...obj] : { ...(obj as Record<string, unknown>) };
  (copyOf as Record<string | number, unknown>)[k] = setIn((obj as Record<string | number, unknown>)?.[k], rest, value);
  return copyOf;
}

export function DeckEditor({ initial, theme, logo, venture, id }: { initial: Deck; theme: Theme; logo?: string; venture: string; id: string }) {
  const [deck, setDeck] = useState(initial);
  const [i, setI] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const n = deck.slides.length;

  const edit = (idx: number) => (p: (string | number)[], v: string) => {
    setDeck((d) => ({ ...d, slides: d.slides.map((s, j) => (j === idx ? (setIn(s, p, v) as S) : s)) }));
    setDirty(true);
  };
  const remove = (idx: number) => {
    if (n <= 1) return;
    setDeck((d) => ({ ...d, slides: d.slides.filter((_, j) => j !== idx) }));
    setI((x) => Math.min(x > idx ? x - 1 : x, n - 2));
    setDirty(true);
  };
  const save = async () => {
    setSaving(true);
    const r = await fetch("/api/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ venture, deck: id, content: deck }) });
    setSaving(false);
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setDirty(false); toast(j.message ?? "Saved"); } else toast(j.error ?? "Could not save");
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).isContentEditable || playing) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setI((x) => Math.min(n - 1, x + 1)); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); if (dirty) save(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  useEffect(() => {
    document.querySelector(`[data-rail="${i}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [i]);

  const share = `${typeof location !== "undefined" ? location.origin : ""}/p/${venture}/${id}`;

  return (
    <>
      <div className="stage-bar">
        <div className="l">
          <Link className="back" href={`/${venture}/presentations`}>Presentations</Link>
          <span style={{ color: "var(--faint)" }}>/</span>
          <span>{deck.title}</span>
        </div>
        <div className="r">
          {dirty && <button className="icon-btn solid" onClick={save} disabled={saving}>{saving ? "Saving" : "Save"}</button>}
          <button className="icon-btn" onClick={() => copy(share, "Link copied")}>Share link</button>
          <button className="icon-btn" onClick={() => { document.documentElement.requestFullscreen?.().catch(() => {}); setPlaying(true); }}>Present</button>
        </div>
      </div>
      <div className="editor">
        <div className="rail">
          {deck.slides.map((s, j) => (
            <div key={j} className="rail-item" data-rail={j} aria-current={j === i}>
              <i>{j + 1}</i>
              <div style={{ flex: 1, position: "relative" }} onClick={() => setI(j)}>
                <SlideBox slide={s} theme={theme} logo={logo} n={j + 1} total={n} />
                {n > 1 && <button className="rail-del" title="Remove slide" onClick={(e) => { e.stopPropagation(); remove(j); }}>×</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="stage">
          <div className="stage-slide">
            <SlideBox key={i} slide={deck.slides[i]} theme={theme} logo={logo} n={i + 1} total={n} edit={edit(i)} fit="contain" />
          </div>
        </div>
      </div>
      {playing && <Player deck={deck} theme={theme} logo={logo} start={i} onClose={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); setPlaying(false); }} />}
    </>
  );
}
