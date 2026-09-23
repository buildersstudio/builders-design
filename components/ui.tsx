"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/* ---------- toast ---------- */

let push: ((m: string) => void) | null = null;
export const toast = (m: string) => push?.(m);

export function Toaster() {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    push = (m) => {
      setMsg(m);
      setOn(true);
      clearTimeout(t);
      t = setTimeout(() => setOn(false), 1600);
    };
    return () => { push = null; };
  }, []);
  return <div className={`toast${on ? " on" : ""}`} role="status">{msg}</div>;
}

export async function copy(text: string, label = "Copied") {
  await navigator.clipboard.writeText(text);
  toast(label);
}

/* ---------- copy-a-prompt button ---------- */

export function PromptButton({ text, label }: { text: string; label?: string }) {
  return (
    <button className="icon-btn" title="Copy a prompt for your model" onClick={() => copy(text, "Prompt copied")}>
      {label ?? <Plus />}
    </button>
  );
}

export const Plus = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.2" /></svg>
);

/* ---------- scale a fixed-size canvas to its container width ---------- */

export function useFit<T extends HTMLElement>(w: number, h?: number) {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      setScale(h ? Math.min(r.width / w, r.height / h) : r.width / w);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);
  return [ref, scale] as const;
}

/** Live, non-interactive preview of an HTML page at desktop width. */
export function PagePreview({ src, width = 1440 }: { src: string; width?: number }) {
  const [ref, scale] = useFit<HTMLDivElement>(width);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {scale > 0 && (
        <iframe src={src} loading="lazy" tabIndex={-1} aria-hidden scrolling="no"
          style={{ width, height: `${100 / scale}%`, transform: `scale(${scale})` }} />
      )}
    </div>
  );
}
