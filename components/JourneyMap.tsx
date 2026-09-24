"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { clock, vsiLink, type Icp, type Idea, type JourneyFile, type Note, type Quote, type Stage } from "@/lib/journeys";

/**
 * A customer journey as a wall of post-its: one horizontal canvas that opens with the ICP,
 * runs through the stages lane by lane (as is, pains, what we heard, ideas, with the venture)
 * and ends with the product decisions the evidence points to.
 */

const LANES = [
  { key: "asis", label: "As is", hint: "What they do today" },
  { key: "pains", label: "Pains", hint: "Where it hurts" },
  { key: "quotes", label: "Heard in calls", hint: "From VSI conversations" },
  { key: "ideas", label: "Ideas", hint: "How we could solve it" },
  { key: "tobe", label: "With", hint: "The flow with the venture" },
] as const;
type LaneKey = (typeof LANES)[number]["key"];

// natural sticky-note paper, one per lane
const PAPER: Record<LaneKey, { bg: string; edge: string; ink: string }> = {
  asis: { bg: "#FDF3B4", edge: "#F3E48C", ink: "#3B3522" },
  pains: { bg: "#FFD6D1", edge: "#F7BDB6", ink: "#43282A" },
  quotes: { bg: "#FFFFFF", edge: "#ECEAE4", ink: "#2A2926" },
  ideas: { bg: "#D5F0DC", edge: "#B9E3C5", ink: "#20382A" },
  tobe: { bg: "#D8E7FF", edge: "#BFD5F8", ink: "#1F2D44" },
};

const COL = 300;
const GAP = 22;
/** board padding + lane labels + ICP column, before the first stage */
const LEAD = 28 + 150 + GAP + 330 + GAP;

type Pick = { lane: LaneKey; stage: Stage; item: Note | Idea | Quote } | { lane: "icp"; icp: Icp } | null;

/** a stable small tilt per note, so the wall looks placed by hand and stays put between renders */
const tilt = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((((h >>> 0) % 1000) / 1000) * 2.4 - 1.2).toFixed(2);
};

export function JourneyMap({ data, name }: { data: JourneyFile; name: string }) {
  const [jid, setJid] = useState(data.journeys[0]?.id);
  const journey = data.journeys.find((j) => j.id === jid) ?? data.journeys[0];
  const icp = data.icps.find((i) => i.id === journey.icp);
  const [pick, setPick] = useState<Pick>(null);
  const allQuotes = useMemo(() => new Map(data.journeys.flatMap((j) => j.stages.flatMap((s) => (s.quotes ?? []).map((q) => [q.id, q] as const)))), [data]);

  const board = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ left: 0, width: 1, total: 1 });
  const sync = useCallback(() => {
    const b = board.current;
    if (b) setView({ left: b.scrollLeft, width: b.clientWidth, total: b.scrollWidth });
  }, []);

  // drag to scroll, with a little momentum
  useEffect(() => {
    const b = board.current;
    if (!b) return;
    let down = false, x0 = 0, y0 = 0, l0 = 0, t0 = 0, v = 0, last = 0, lastX = 0, raf = 0, moved = false;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, a, .jm-note, .jm-icp, .jm-decision")) return;
      down = true; moved = false; x0 = e.clientX; y0 = e.clientY; l0 = b.scrollLeft; t0 = b.scrollTop; lastX = e.clientX; last = performance.now(); v = 0;
      cancelAnimationFrame(raf); b.classList.add("grabbing");
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      b.scrollLeft = l0 - dx; b.scrollTop = t0 - dy;
      const now = performance.now();
      v = (lastX - e.clientX) / Math.max(1, now - last) * 16; lastX = e.clientX; last = now;
    };
    const onUp = () => {
      if (!down) return;
      down = false; b.classList.remove("grabbing");
      const glide = () => { if (Math.abs(v) < 0.4) return; b.scrollLeft += v; v *= 0.93; raf = requestAnimationFrame(glide); };
      if (moved) raf = requestAnimationFrame(glide);
    };
    b.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    b.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync); ro.observe(b);
    sync();
    return () => { b.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); b.removeEventListener("scroll", sync); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [sync]);

  // arrow keys step one stage; Escape closes the detail
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "Escape") setPick(null);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); board.current?.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * (COL + GAP), behavior: "smooth" }); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => { board.current?.scrollTo({ left: 0, behavior: "smooth" }); setPick(null); }, [jid]);

  const n = journey.stages.length;
  const cols = `150px 330px repeat(${n}, ${COL}px) 380px`;
  const withLabel = `With ${name}`;

  return (
    <div className="jm">
      <div className="jm-top">
        <nav className="jm-tabs">
          {data.journeys.map((j) => {
            const who = data.icps.find((i) => i.id === j.icp);
            return (
              <button key={j.id} aria-pressed={j.id === journey.id} onClick={() => setJid(j.id)}>
                <b>{j.title}</b>
                {who && <span>{who.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="jm-board" ref={board} key={journey.id}>
        <div className="jm-grid" style={{ gridTemplateColumns: cols, gap: `0 ${GAP}px` }}>
          {/* header row */}
          <div className="jm-corner" />
          <div className="jm-head jm-head-icp"><span>Who</span></div>
          {journey.stages.map((s, i) => (
            <div key={s.id} className="jm-head">
              <span className="jm-no">{String(i + 1).padStart(2, "0")}</span>
              <b>{s.name}</b>
            </div>
          ))}
          <div className="jm-head jm-head-icp"><span>Decide</span></div>

          {/* the feel of each stage, as one curve across the stage columns */}
          <div className="jm-curve" style={{ gridColumn: `3 / span ${n}` }}>
            <Curve stages={journey.stages} />
          </div>

          {LANES.map((lane, li) => (
            <Fragment key={lane.key}>
              <div className="jm-lane-label" style={{ gridRow: li + 3 }}>
                <b>{lane.key === "tobe" ? withLabel : lane.label}</b>
                <span>{lane.hint}</span>
              </div>
              {journey.stages.map((s, si) => {
                const items = (s[lane.key] ?? []) as (Note | Idea | Quote)[];
                return (
                  <div key={s.id} className="jm-cell" style={{ gridRow: li + 3, gridColumn: si + 3 }}>
                    {items.map((it, k) => (
                      <PostIt key={k} lane={lane.key} item={it} seed={`${s.id}-${lane.key}-${k}`} delay={(si * 5 + li) * 22 + k * 30}
                        active={!!pick && pick.lane === lane.key && "item" in pick && pick.item === it}
                        onClick={() => setPick({ lane: lane.key, stage: s, item: it })} />
                    ))}
                  </div>
                );
              })}
            </Fragment>
          ))}

          {/* ICP card and decisions span every lane */}
          <div className="jm-side" style={{ gridColumn: 2, gridRow: `3 / span ${LANES.length}` }}>
            {icp && <IcpCard icp={icp} question={journey.question} onClick={() => setPick({ lane: "icp", icp })} />}
          </div>
          <div className="jm-side" style={{ gridColumn: n + 3, gridRow: `3 / span ${LANES.length}` }}>
            {data.summary && <p className="jm-summary">{data.summary}</p>}
            {(data.decisions ?? []).map((d, i) => (
              <div key={i} className="jm-decision">
                <div className="jm-decision-top"><span>{String(i + 1).padStart(2, "0")}</span>{d.tier && <TierPip tier={d.tier} />}</div>
                <b>{d.title}</b>
                {d.why && <p>{d.why}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="jm-foot">
        <Scrubber view={view} stages={journey.stages} onJump={(x) => board.current?.scrollTo({ left: x, behavior: "smooth" })} />
        <Sources data={data} />
      </div>

      {pick && <Detail pick={pick} quotes={allQuotes} onClose={() => setPick(null)} withLabel={withLabel} />}
    </div>
  );
}

function PostIt({ lane, item, seed, delay, active, onClick }: { lane: LaneKey; item: Note | Idea | Quote; seed: string; delay: number; active: boolean; onClick: () => void }) {
  const p = PAPER[lane];
  const style = { "--bg": p.bg, "--edge": p.edge, "--ink": p.ink, "--tilt": `${tilt(seed)}deg`, animationDelay: `${delay}ms` } as CSSProperties;
  if (lane === "quotes") {
    const q = item as Quote;
    return (
      <button className={`jm-note jm-quote${active ? " on" : ""}`} style={style} onClick={onClick}>
        <span className="jm-mark">“</span>
        <span className="jm-text">{q.text}</span>
        <span className="jm-who">{q.who}</span>
        <span className="jm-meta">{q.tier && <TierPip tier={q.tier} />}{q.ms != null && <span>{clock(q.ms)}</span>}{q.conv && <span>VSI ↗</span>}</span>
      </button>
    );
  }
  const idea = lane === "ideas" ? (item as Idea) : undefined;
  const note = item as Note & { source?: string };
  return (
    <button className={`jm-note${active ? " on" : ""}`} style={style} onClick={onClick}>
      <span className="jm-text">{item.text}</span>
      {(note.tier || idea?.impact || note.quotes?.length || note.source) && (
        <span className="jm-meta">
          {note.tier && <TierPip tier={note.tier} />}
          {note.source === "web" && <span className="jm-web">web</span>}
          {!!note.quotes?.length && <span>{note.quotes.length} {note.quotes.length === 1 ? "quote" : "quotes"}</span>}
          {idea?.impact != null && <Dots label="Impact" n={idea.impact} />}
          {idea?.effort != null && <Dots label="Effort" n={idea.effort} />}
        </span>
      )}
    </button>
  );
}

function TierPip({ tier }: { tier: string }) {
  const n = Number(tier.replace(/\D/g, "")) || 0;
  return (
    <span className="jm-tier" title={`Evidence ${tier}`}>
      {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}
      <em>{tier}</em>
    </span>
  );
}

function Dots({ label, n }: { label: string; n: number }) {
  return <span className="jm-dots" title={`${label} ${n} of 3`}>{label[0]}{[1, 2, 3].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}</span>;
}

function IcpCard({ icp, question, onClick }: { icp: Icp; question?: string; onClick: () => void }) {
  return (
    <button className="jm-icp" onClick={onClick}>
      <span className="jm-icp-k">ICP{icp.evidence && <TierPip tier={icp.evidence} />}</span>
      <b>{icp.name}</b>
      {icp.segment && <span className="jm-icp-seg">{icp.segment}</span>}
      {icp.who && <p>{icp.who}</p>}
      {icp.trigger && <p><span className="jm-icp-k2">Trigger</span>{icp.trigger}</p>}
      {!!icp.jobs?.length && (
        <ul>{icp.jobs.map((j, i) => <li key={i}>{j}</li>)}</ul>
      )}
      {question && <p className="jm-q"><span className="jm-icp-k2">The question</span>{question}</p>}
    </button>
  );
}

/** the emotional line across the stages: up is fine, down is painful */
function Curve({ stages }: { stages: Stage[] }) {
  const h = 44, pad = 8;
  const pts = stages.map((s, i) => [i * (COL + GAP) + COL / 2, pad + ((2 - (s.feel ?? 0)) / 4) * (h - pad * 2)] as const);
  const w = (stages.length - 1) * (COL + GAP) + COL;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  const hue = (f = 0) => (f <= -1 ? "#E0685A" : f >= 1 ? "#4FA46E" : "#D9A93E");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <line x1={0} x2={w} y1={h / 2} y2={h / 2} stroke="#EFEDE8" strokeDasharray="2 5" />
      <path d={d} fill="none" stroke="#CFCBC2" strokeWidth={1.5} />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill={hue(stages[i].feel)} stroke="#fff" strokeWidth={2} />)}
    </svg>
  );
}

function Scrubber({ view, stages, onJump }: { view: { left: number; width: number; total: number }; stages: Stage[]; onJump: (x: number) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const frac = view.total > view.width ? view.width / view.total : 1;
  const pos = view.total > view.width ? view.left / (view.total - view.width) : 0;
  const jump = (clientX: number) => {
    const t = track.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width - frac / 2));
    onJump(f * view.total);
  };
  if (frac >= 1) return <div className="jm-scrub" />;
  return (
    <div className="jm-scrub">
      <div className="jm-scrub-track" ref={track} onPointerDown={(e) => { jump(e.clientX); const mv = (ev: PointerEvent) => jump(ev.clientX); const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }; window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); }}>
        {stages.map((s, i) => <i key={s.id} style={{ left: `${((LEAD + i * (COL + GAP) + COL / 2) / view.total) * 100}%`, background: s.feel != null && s.feel <= -1 ? "#E0685A" : s.feel != null && s.feel >= 1 ? "#4FA46E" : "#D9A93E" }} />)}
        <div className="jm-scrub-thumb" style={{ width: `${frac * 100}%`, left: `${pos * (1 - frac) * 100}%` }} />
      </div>
    </div>
  );
}

function Sources({ data }: { data: JourneyFile }) {
  const v = data.sources?.vsi, web = data.sources?.web ?? [];
  const [open, setOpen] = useState(false);
  return (
    <div className="jm-src">
      {v && <span>VSI · {v.conversations ?? "?"} conversations · compiled {v.compiled?.slice(0, 10)}</span>}
      {!!web.length && <button onClick={() => setOpen(!open)}>{web.length} web sources</button>}
      {data.updated && <span>Updated {data.updated}</span>}
      {open && (
        <div className="jm-src-pop" onMouseLeave={() => setOpen(false)}>
          {web.map((w) => <a key={w.url} href={w.url} target="_blank" rel="noreferrer">{w.title}<span>{new URL(w.url).host}</span></a>)}
        </div>
      )}
    </div>
  );
}

function Detail({ pick, quotes, onClose, withLabel }: { pick: NonNullable<Pick>; quotes: Map<string, Quote>; onClose: () => void; withLabel: string }) {
  let body: ReactNode;
  if (pick.lane === "icp") {
    const i = pick.icp;
    body = (
      <>
        <span className="jm-d-k">ICP {i.evidence && <TierPip tier={i.evidence} />}</span>
        <h3>{i.name}</h3>
        {i.segment && <p className="jm-d-sub">{i.segment}</p>}
        {i.who && <p>{i.who}</p>}
        {i.trigger && <><h4>Trigger</h4><p>{i.trigger}</p></>}
        {!!i.jobs?.length && <><h4>Jobs</h4><ul>{i.jobs.map((j, k) => <li key={k}>{j}</li>)}</ul></>}
        {i.notes && <><h4>Notes</h4><p>{i.notes}</p></>}
      </>
    );
  } else {
    const { lane, stage, item } = pick;
    const label = lane === "tobe" ? withLabel : LANES.find((l) => l.key === lane)!.label;
    const linked = lane === "quotes" ? [item as Quote] : ((item as Note).quotes ?? []).map((id) => quotes.get(id)).filter(Boolean) as Quote[];
    const idea = lane === "ideas" ? (item as Idea) : undefined;
    body = (
      <>
        <span className="jm-d-k">{label} · {stage.name}</span>
        <h3>{lane === "quotes" ? `“${item.text}”` : item.text}</h3>
        {"tier" in item && item.tier && <p className="jm-d-sub"><TierPip tier={item.tier} /> evidence</p>}
        {idea && (
          <div className="jm-d-idea">
            {idea.impact != null && <span>Impact <Dots label="Impact" n={idea.impact} /></span>}
            {idea.effort != null && <span>Effort <Dots label="Effort" n={idea.effort} /></span>}
            {idea.why && <p>{idea.why}</p>}
          </div>
        )}
        {!!linked.length && (
          <>
            <h4>{lane === "quotes" ? "Source" : "Heard in calls"}</h4>
            {linked.map((q) => (
              <div key={q.id} className="jm-d-quote">
                {lane !== "quotes" && <p>“{q.text}”</p>}
                <span>{q.who}{q.date ? ` · ${q.date}` : ""}{q.kind ? ` · ${q.kind.replace(/_/g, " ")}` : ""}</span>
                {vsiLink(q) && <a href={vsiLink(q)} target="_blank" rel="noreferrer">Open the call in VSI{q.ms != null ? ` at ${clock(q.ms)}` : ""} ↗</a>}
              </div>
            ))}
          </>
        )}
      </>
    );
  }
  return (
    <aside className="jm-detail">
      <button className="jm-d-x" onClick={onClose} aria-label="Close">×</button>
      {body}
    </aside>
  );
}

