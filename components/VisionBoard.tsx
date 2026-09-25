"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clock, vsiLink } from "@/lib/journeys";
import { COLUMNS, type Column, type Evidence, type Finding, type Initiative, type VisionBoard, type Viz } from "@/lib/vision";
import { toast } from "./ui";

/**
 * The product vision of a venture: the research behind it (winning patterns, the problem, trends,
 * status from VSI) and a kanban of recommended initiatives, each backed by evidence. Cards move
 * between columns by dragging; a card opens into its bet, evidence, visualisations, prototype and notes.
 */

const KIND: Record<Evidence["kind"], { label: string; color: string }> = {
  call: { label: "Calls", color: "#E0685A" },
  signal: { label: "Signals", color: "#D9A93E" },
  journey: { label: "Journeys", color: "#C27BD9" },
  competitor: { label: "Competitors", color: "#4E7BE0" },
  trend: { label: "Trends", color: "#3FA37A" },
  market: { label: "Market", color: "#6BA9C9" },
};

const RESEARCH: { key: keyof VisionBoard["research"]; label: string }[] = [
  { key: "patterns", label: "Winning patterns" },
  { key: "problem", label: "The problem" },
  { key: "trends", label: "Trends" },
  { key: "status", label: "Status from VSI" },
];

type Drag = { id: string; x: number; y: number; dx: number; dy: number; w: number; h: number; col: Column; index: number; moved: boolean };

export function VisionBoardView({ slug, initial }: { slug: string; initial: VisionBoard }) {
  const [board, setBoard] = useState<VisionBoard>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [research, setResearch] = useState<keyof VisionBoard["research"] | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [wide, setWide] = useState(false);
  const cols = useRef<Partial<Record<Column, HTMLDivElement | null>>>({});
  const saving = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const persist = (next: VisionBoard, msg?: string) => {
    setBoard(next);
    clearTimeout(saving.current);
    saving.current = setTimeout(async () => {
      const r = await fetch("/api/vision", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ venture: slug, board: next }) });
      const j = await r.json().catch(() => ({}));
      toast(r.ok ? msg ?? "Saved" : j.error ?? "Could not save");
    }, 250);
  };

  const byCol = useMemo(() => {
    const m = Object.fromEntries(COLUMNS.map((c) => [c.key, [] as Initiative[]])) as Record<Column, Initiative[]>;
    for (const i of board.initiatives) (m[i.column] ?? m.recommended).push(i);
    return m;
  }, [board]);

  const move = (id: string, col: Column, index: number) => {
    const card = board.initiatives.find((i) => i.id === id);
    if (!card) return;
    const rest = board.initiatives.filter((i) => i.id !== id);
    const inCol = rest.filter((i) => i.column === col);
    const anchor = inCol[index];
    const moved = { ...card, column: col };
    const at = anchor ? rest.indexOf(anchor) : inCol.length ? rest.indexOf(inCol[inCol.length - 1]) + 1 : rest.length;
    rest.splice(at, 0, moved);
    const label = COLUMNS.find((c) => c.key === col)!.label;
    persist({ ...board, initiatives: rest }, card.column === col ? "Order saved" : `Moved to ${label}`);
  };

  // pointer drag: a lifted ghost follows the cursor, a placeholder shows where it will land
  const onDown = (e: React.PointerEvent, i: Initiative) => {
    if (e.button !== 0) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    let d: Drag = { id: i.id, x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height, col: i.column, index: byCol[i.column].indexOf(i), moved: false };
    const target = (x: number, y: number): Pick<Drag, "col" | "index"> => {
      let col = d.col;
      for (const c of COLUMNS) {
        const el = cols.current[c.key];
        if (!el) continue;
        const b = el.getBoundingClientRect();
        if (x >= b.left && x <= b.right) col = c.key;
      }
      const el = cols.current[col];
      const cards = el ? [...el.querySelectorAll<HTMLElement>("[data-card]")].filter((c) => c.dataset.card !== i.id) : [];
      let index = cards.length;
      for (let k = 0; k < cards.length; k++) {
        const b = cards[k].getBoundingClientRect();
        if (y < b.top + b.height / 2) { index = k; break; }
      }
      return { col, index };
    };
    const mv = (ev: PointerEvent) => {
      const far = Math.abs(ev.clientX - start.x) + Math.abs(ev.clientY - start.y) > 5;
      if (!d.moved && !far) return;
      d = { ...d, x: ev.clientX, y: ev.clientY, moved: true, ...target(ev.clientX, ev.clientY) };
      setDrag(d);
    };
    const up = () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      setDrag(null);
      if (d.moved) move(i.id, d.col, d.index);
      else setOpen(i.id);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(null); setResearch(null); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const card = board.initiatives.find((i) => i.id === open);
  const dragged = drag && board.initiatives.find((i) => i.id === drag.id);
  const update = (patch: Partial<Initiative>, msg?: string) => card && persist({ ...board, initiatives: board.initiatives.map((i) => (i.id === card.id ? { ...i, ...patch } : i)) }, msg);

  return (
    <div className={`vb${drag ? " dragging" : ""}`}>
      {board.vision && (
        <div className="vb-vision">
          <span>Vision</span>
          <p className={wide ? "open" : ""} onClick={() => setWide(!wide)} title={wide ? "Show less" : "Read the full vision"}>{board.vision}</p>
        </div>
      )}

      <div className="vb-research">
        {RESEARCH.map((r) => {
          const items = board.research[r.key] ?? [];
          return (
            <button key={r.key} className="vb-rtile" onClick={() => setResearch(r.key)} disabled={!items.length}>
              <span className="vb-rk">{r.label}<em>{items.length}</em></span>
              {items.slice(0, 2).map((f, k) => <b key={k}>{f.title}</b>)}
            </button>
          );
        })}
        <Sources board={board} />
      </div>

      <div className="vb-board">
        {COLUMNS.map((c) => {
          const list = byCol[c.key];
          const shown = list.filter((i) => !drag?.moved || i.id !== drag.id);
          return (
            <div key={c.key} className={`vb-col${drag?.moved && drag.col === c.key ? " over" : ""}`}>
              <div className="vb-col-head"><b>{c.label}</b><span>{list.length}</span><em>{c.hint}</em></div>
              <div className="vb-list" ref={(el) => { cols.current[c.key] = el; }}>
                {shown.map((i, k) => (
                  <Placeholdered key={i.id} show={!!drag?.moved && drag.col === c.key && drag.index === k} h={drag?.h}>
                    <Card i={i} onPointerDown={(e) => onDown(e, i)} />
                  </Placeholdered>
                ))}
                {drag?.moved && drag.col === c.key && drag.index >= shown.length && <div className="vb-ph" style={{ height: drag.h }} />}
                {!shown.length && !(drag?.moved && drag.col === c.key) && <div className="vb-empty">Drop an initiative here</div>}
              </div>
            </div>
          );
        })}
      </div>

      {drag?.moved && dragged && (
        <div className="vb-ghost" style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w }}>
          <Card i={dragged} />
        </div>
      )}

      {card && <Detail slug={slug} i={card} onClose={() => setOpen(null)} onUpdate={update} />}
      {research && <ResearchPanel title={RESEARCH.find((r) => r.key === research)!.label} items={board.research[research] ?? []} onClose={() => setResearch(null)} />}
    </div>
  );
}

function Placeholdered({ show, h, children }: { show: boolean; h?: number; children: ReactNode }) {
  return <>{show && <div className="vb-ph" style={{ height: h }} />}{children}</>;
}

function Card({ i, onPointerDown }: { i: Initiative; onPointerDown?: (e: React.PointerEvent) => void }) {
  const counts = (i.evidence ?? []).reduce<Record<string, number>>((m, e) => ((m[e.kind] = (m[e.kind] ?? 0) + 1), m), {});
  const bars = i.viz?.find((v) => v.kind === "bars") as Extract<Viz, { kind: "bars" }> | undefined;
  return (
    <div className="vb-card" data-card={i.id} onPointerDown={onPointerDown}>
      <div className="vb-card-top">
        {i.horizon && <span className={`vb-hz ${i.horizon}`}>{i.horizon}</span>}
        {i.prototype && <span className="vb-proto">Prototype</span>}
        {i.confidence && <Tier t={i.confidence} />}
      </div>
      <b className="vb-title">{i.title}</b>
      <p className="vb-sum">{i.summary}</p>
      {bars && <Spark items={bars.items} />}
      <div className="vb-card-foot">
        <span className="vb-ev">
          {Object.entries(counts).map(([k, n]) => <i key={k} title={`${n} ${KIND[k as Evidence["kind"]]?.label ?? k}`} style={{ background: KIND[k as Evidence["kind"]]?.color }}>{n}</i>)}
        </span>
        <span className="vb-ie">
          {i.impact != null && <Dots label="Impact" n={i.impact} />}
          {i.effort != null && <Dots label="Effort" n={i.effort} />}
          {!!i.notes?.length && <span className="vb-notes-n">{i.notes.length} {i.notes.length === 1 ? "note" : "notes"}</span>}
        </span>
      </div>
    </div>
  );
}

function Spark({ items }: { items: { value: number }[] }) {
  const max = Math.max(...items.map((x) => x.value), 1);
  return <div className="vb-spark">{items.slice(0, 12).map((x, k) => <i key={k} style={{ height: `${Math.max(8, (x.value / max) * 100)}%` }} />)}</div>;
}

function Tier({ t }: { t: string }) {
  const n = Number(t.replace(/\D/g, "")) || 0;
  return <span className="vb-tier" title={`Confidence ${t}`}>{[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className={k <= n ? "on" : ""} />)}<em>{t}</em></span>;
}

function Dots({ label, n }: { label: string; n: number }) {
  return <span className="vb-dots" title={`${label} ${n} of 3`}>{label[0]}{[1, 2, 3].map((k) => <i key={k} className={k <= n ? "on" : ""} />)}</span>;
}

function Sources({ board }: { board: VisionBoard }) {
  const v = board.sources?.vsi, web = board.sources?.web ?? [];
  const [open, setOpen] = useState(false);
  return (
    <div className="vb-src">
      {v && <span>VSI · {v.conversations ?? "?"} conversations · {v.compiled?.slice(0, 10)}</span>}
      {!!web.length && <button onClick={() => setOpen(!open)}>{web.length} web sources</button>}
      {board.updated && <span>Updated {board.updated}</span>}
      {open && (
        <div className="vb-src-pop" onMouseLeave={() => setOpen(false)}>
          {web.map((w) => <a key={w.url} href={w.url} target="_blank" rel="noreferrer">{w.title}<span>{safeHost(w.url)}</span></a>)}
        </div>
      )}
    </div>
  );
}

const safeHost = (u: string) => { try { return new URL(u).host; } catch { return u; } };

function EvidenceList({ items }: { items: Evidence[] }) {
  const groups = Object.keys(KIND).map((k) => [k, items.filter((e) => e.kind === k)] as const).filter(([, l]) => l.length);
  return (
    <div className="vb-evl">
      {groups.map(([k, list]) => (
        <div key={k} className="vb-evg">
          <span className="vb-evk"><i style={{ background: KIND[k as Evidence["kind"]].color }} />{KIND[k as Evidence["kind"]].label}</span>
          {list.map((e, n) => {
            const link = e.conv ? vsiLink(e) : e.url;
            return (
              <div key={n} className="vb-evi">
                <p>{e.kind === "call" ? `“${e.text}”` : e.text}</p>
                <span>
                  {e.tier && <Tier t={e.tier} />}
                  {e.who && <em>{e.who}</em>}
                  {e.source && !e.who && <em>{e.source}</em>}
                  {e.date && <em>{e.date}</em>}
                  {link && <a href={link} target="_blank" rel="noreferrer">{e.conv ? `Open in VSI${e.ms != null ? ` at ${clock(e.ms)}` : ""}` : safeHost(link)} ↗</a>}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Detail({ slug, i, onClose, onUpdate }: { slug: string; i: Initiative; onClose: () => void; onUpdate: (p: Partial<Initiative>, msg?: string) => void }) {
  const [note, setNote] = useState("");
  const [full, setFull] = useState(false);
  const add = () => {
    const text = note.trim();
    if (!text) return;
    onUpdate({ notes: [...(i.notes ?? []), { text, at: new Date().toISOString().slice(0, 16).replace("T", " ") }] }, "Note added");
    setNote("");
  };
  const proto = i.prototype ? `/ventures/${slug}/${i.prototype}` : undefined;
  return (
    <aside className="vb-detail">
      <div className="vb-d-bar">
        <select value={i.column} onChange={(e) => onUpdate({ column: e.target.value as Column }, `Moved to ${COLUMNS.find((c) => c.key === e.target.value)!.label}`)}>
          {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button className="vb-d-x" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="vb-d-meta">
        {i.horizon && <span className={`vb-hz ${i.horizon}`}>{i.horizon}</span>}
        {i.confidence && <span>Confidence <Tier t={i.confidence} /></span>}
        {i.impact != null && <span>Impact <Dots label="Impact" n={i.impact} /></span>}
        {i.effort != null && <span>Effort <Dots label="Effort" n={i.effort} /></span>}
      </div>
      <h2>{i.title}</h2>
      <p className="vb-d-sum">{i.summary}</p>
      {i.bet && <Section title="The bet"><p>{i.bet}</p></Section>}
      {i.problem && <Section title="The problem"><p>{i.problem}</p></Section>}
      {!!i.viz?.length && <Section title="What the data shows">{i.viz.map((v, k) => <VizView key={k} v={v} />)}</Section>}
      {proto && (
        <Section title="Vision prototype">
          <div className={`vb-proto-frame${full ? " full" : ""}`}>
            <iframe src={proto} title={`${i.title} prototype`} />
          </div>
          <div className="vb-proto-links">
            <button onClick={() => setFull(!full)}>{full ? "Smaller" : "Larger"}</button>
            <a href={proto} target="_blank" rel="noreferrer">Open full screen ↗</a>
          </div>
        </Section>
      )}
      {!!i.evidence?.length && <Section title="Evidence"><EvidenceList items={i.evidence} /></Section>}
      {!!i.risks?.length && <Section title="What would prove it wrong"><ul>{i.risks.map((r, k) => <li key={k}>{r}</li>)}</ul></Section>}
      {i.firstMove && <Section title="First move"><p>{i.firstMove}</p></Section>}
      <Section title="Notes">
        {(i.notes ?? []).map((n, k) => (
          <div key={k} className="vb-note">
            <p>{n.text}</p>
            <span>{n.by ? `${n.by} · ` : ""}{n.at}<button onClick={() => onUpdate({ notes: (i.notes ?? []).filter((_, j) => j !== k) }, "Note removed")}>Remove</button></span>
          </div>
        ))}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note from the discussion" rows={3}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(); }} />
        <button className="vb-add" onClick={add} disabled={!note.trim()}>Add note</button>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="vb-sec"><h4>{title}</h4>{children}</section>;
}

function ResearchPanel({ title, items, onClose }: { title: string; items: Finding[]; onClose: () => void }) {
  return (
    <aside className="vb-detail">
      <div className="vb-d-bar"><span className="vb-rk">{title}</span><button className="vb-d-x" onClick={onClose} aria-label="Close">×</button></div>
      {items.map((f, k) => (
        <section key={k} className="vb-sec vb-finding">
          <h3>{f.title}</h3>
          <p>{f.text}</p>
          {!!f.evidence?.length && <EvidenceList items={f.evidence} />}
        </section>
      ))}
    </aside>
  );
}

/* ---------- visualisations ---------- */

function VizView({ v }: { v: Viz }) {
  if (v.kind === "bars") {
    const max = Math.max(...v.items.map((x) => x.value), 1);
    return (
      <figure className="vz">
        <figcaption>{v.title}</figcaption>
        {v.items.map((x, k) => (
          <div key={k} className="vz-bar">
            <span className="vz-l">{x.label}</span>
            <span className="vz-track"><i style={{ width: `${(x.value / max) * 100}%` }} /></span>
            <span className="vz-v">{x.value}{v.unit ? ` ${v.unit}` : ""}</span>
            {x.note && <span className="vz-note">{x.note}</span>}
          </div>
        ))}
      </figure>
    );
  }
  if (v.kind === "compare") {
    const glyph = (s: string) => (s === "yes" ? <i className="vz-y">●</i> : s === "no" ? <i className="vz-n">○</i> : s === "partial" ? <i className="vz-p">◐</i> : <span className="vz-t">{s}</span>);
    return (
      <figure className="vz">
        <figcaption>{v.title}</figcaption>
        <table className="vz-table">
          <thead><tr><th />{v.columns.map((c, k) => <th key={k} className={k === 0 ? "us" : ""}>{c}</th>)}</tr></thead>
          <tbody>{v.rows.map((r, k) => <tr key={k}><td>{r.label}</td>{r.values.map((x, j) => <td key={j} className={j === 0 ? "us" : ""}>{glyph(x)}</td>)}</tr>)}</tbody>
        </table>
      </figure>
    );
  }
  if (v.kind === "flow") {
    const row = (label: string, steps: { step: string; time?: string }[], tone: string) => (
      <div className={`vz-flow ${tone}`}>
        <span className="vz-fl">{label}</span>
        <div className="vz-steps">
          {steps.map((s, k) => (
            <span key={k} className="vz-step"><b>{s.step}</b>{s.time && <em>{s.time}</em>}</span>
          ))}
        </div>
      </div>
    );
    return <figure className="vz"><figcaption>{v.title}</figcaption>{row("Today", v.before, "before")}{row("With it", v.after, "after")}</figure>;
  }
  if (v.kind === "matrix") {
    return (
      <figure className="vz">
        <figcaption>{v.title}</figcaption>
        <div className="vz-matrix">
          <span className="vz-ax vz-ax-y1">{v.y[1]}</span><span className="vz-ax vz-ax-y0">{v.y[0]}</span>
          <span className="vz-ax vz-ax-x0">{v.x[0]}</span><span className="vz-ax vz-ax-x1">{v.x[1]}</span>
          <div className="vz-plane">
            {v.points.map((p, k) => (
              <span key={k} className={`vz-pt${p.us ? " us" : ""}`} style={{ left: `${p.x * 100}%`, bottom: `${p.y * 100}%` }}><i /><em>{p.label}</em></span>
            ))}
          </div>
        </div>
      </figure>
    );
  }
  const link = v.conv ? vsiLink(v) : undefined;
  return (
    <figure className="vz vz-quote">
      {v.title && <figcaption>{v.title}</figcaption>}
      <blockquote>“{v.text}”</blockquote>
      <span>{v.who}{link && <> · <a href={link} target="_blank" rel="noreferrer">Open in VSI{v.ms != null ? ` at ${clock(v.ms)}` : ""} ↗</a></>}</span>
    </figure>
  );
}
