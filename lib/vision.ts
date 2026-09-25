/** Product vision: the research behind a venture's direction, and a kanban of recommended initiatives. */

import type { Tier } from "./journeys";

export const COLUMNS = [
  { key: "recommended", label: "Recommended", hint: "Proposed from the evidence" },
  { key: "shortlist", label: "Shortlist", hint: "Worth a closer look" },
  { key: "validating", label: "Validating", hint: "Testing the riskiest assumption" },
  { key: "building", label: "Building", hint: "Committed" },
  { key: "parked", label: "Parked", hint: "Not now, and why" },
] as const;
export type Column = (typeof COLUMNS)[number]["key"];

/** One piece of evidence behind an initiative or a research finding. */
export type Evidence = {
  kind: "call" | "signal" | "competitor" | "trend" | "market" | "journey";
  text: string;
  tier?: Tier;
  /** calls: role and segment of the speaker, never a name */
  who?: string;
  /** calls: VSI conversation id and the moment in the call */
  conv?: string;
  ms?: number;
  /** web sources */
  url?: string;
  source?: string;
  date?: string;
};

/** Small purpose-made visualisations for an initiative. */
export type Viz =
  | { kind: "bars"; title: string; unit?: string; items: { label: string; value: number; note?: string }[] }
  | { kind: "compare"; title: string; columns: string[]; rows: { label: string; values: ("yes" | "no" | "partial" | string)[] }[] }
  | { kind: "flow"; title: string; before: { step: string; time?: string }[]; after: { step: string; time?: string }[] }
  | { kind: "matrix"; title: string; x: [string, string]; y: [string, string]; points: { label: string; x: number; y: number; us?: boolean }[] }
  | { kind: "quote"; title?: string; text: string; who: string; conv?: string; ms?: number };

export type NoteEntry = { text: string; at: string; by?: string };

export type Initiative = {
  id: string;
  title: string;
  /** one sentence: what we would build */
  summary: string;
  column: Column;
  /** "We believe that ... for ... will ... We will know when ..." */
  bet?: string;
  problem?: string;
  impact?: number;
  effort?: number;
  confidence?: Tier;
  horizon?: "now" | "next" | "later";
  /** what would prove it wrong, and the first move */
  risks?: string[];
  firstMove?: string;
  evidence?: Evidence[];
  viz?: Viz[];
  /** path to a vision prototype page (self-contained HTML), relative to the venture folder */
  prototype?: string;
  notes?: NoteEntry[];
};

export type Finding = { title: string; text: string; evidence?: Evidence[] };

/** The recommended direction: the call, and what it rests on. */
export type Strategy = {
  /** the direction in one or two sentences */
  direction: string;
  why?: string[];
  /** what not to do now, and why */
  notNow?: string[];
  /** the order of moves, with timing */
  sequence?: { step: string; when?: string }[];
  /** what would make us drop or change the direction */
  killCriteria?: string[];
  /** what we do not know yet and how to find out */
  evidenceGaps?: string[];
};

export type VisionBoard = {
  updated?: string;
  /** the product vision in one or two sentences */
  vision?: string;
  strategy?: Strategy;
  research: {
    patterns?: Finding[];
    problem?: Finding[];
    trends?: Finding[];
    status?: Finding[];
  };
  sources?: { vsi?: { venture?: string; conversations?: number; compiled?: string }; web?: { title: string; url: string; date?: string }[] };
  initiatives: Initiative[];
};
