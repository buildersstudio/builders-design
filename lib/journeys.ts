/** Customer journey maps: ICPs, their journeys stage by stage, and the evidence behind every note. */

export type Tier = "E0" | "E1" | "E2" | "E3" | "E4" | "E5";

export type Note = { text: string; tier?: Tier; quotes?: string[]; /** "web" for notes from online research rather than calls */ source?: string };
export type Idea = { text: string; impact?: number; effort?: number; why?: string };
export type Quote = {
  id: string; text: string; who: string; tier?: Tier;
  kind?: "pain_point" | "product_request" | "workflow" | "objection" | "decision_criteria" | string;
  /** VSI conversation id and the moment in the call (ms) */
  conv?: string; ms?: number; date?: string;
};

export type Stage = { id: string; name: string; feel?: number; asis?: Note[]; pains?: Note[]; quotes?: Quote[]; ideas?: Idea[]; tobe?: Note[] };
export type Journey = { id: string; title: string; icp: string; question?: string; stages: Stage[] };
export type Icp = { id: string; name: string; segment?: string; who?: string; trigger?: string; jobs?: string[]; evidence?: Tier; notes?: string };

export type JourneyFile = {
  updated?: string;
  sources?: { vsi?: { venture?: string; conversations?: number; compiled?: string }; web?: { title: string; url: string; date?: string }[] };
  summary?: string;
  icps: Icp[];
  journeys: Journey[];
  decisions?: { title: string; why?: string; tier?: Tier }[];
};

export const VSI_APP = "https://vsi.builders.studio";
export const vsiLink = (q: Pick<Quote, "conv">) => (q.conv ? `${VSI_APP}/conversations/${q.conv}` : undefined);
export const clock = (ms?: number) => {
  if (ms == null) return "";
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + `:${String(r).padStart(2, "0")}`;
};
