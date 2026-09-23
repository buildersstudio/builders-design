export type Color = { name: string; hex: string; role?: "ink" | "paper" | "accent" | "support" };

export type Face = { name: string; role: "display" | "text"; weight?: number; css?: string | null; src?: string | null };

export type Brand = {
  tagline?: string;
  colors: Color[];
  type: Face[];
  logo?: string;
  mark?: string;
};

export type Slide =
  | { layout: "cover"; eyebrow?: string; title: string; subtitle?: string }
  | { layout: "section"; eyebrow?: string; title: string }
  | { layout: "statement"; eyebrow?: string; title: string; body?: string }
  | { layout: "points"; eyebrow?: string; title: string; points: { title: string; body?: string }[] }
  | { layout: "metrics"; eyebrow?: string; title: string; metrics: { value: string; label: string }[] }
  | { layout: "split"; eyebrow?: string; title: string; body?: string; image?: string }
  | { layout: "quote"; quote: string; author?: string }
  | { layout: "closing"; title: string; subtitle?: string };

export type Deck = { title: string; created?: string; slides: Slide[] };

/** The palette a slide or page is painted with, derived from a brand. */
export type Theme = {
  ink: string; paper: string; accent: string;
  /** accent when it reads on paper, else ink */ mark: string;
  /** text colour that reads on the accent */ onAccent: string;
  display: string; text: string;
};

export const luminance = (hex: string) => {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

export function themeOf(b: Brand): Theme {
  const by = (r: string) => b.colors.find((c) => c.role === r)?.hex;
  const face = (r: string) => b.type.find((t) => t.role === r)?.name;
  const fallback = "Favorit, 'Helvetica Neue', Arial, sans-serif";
  const ink = by("ink") ?? "#0A0A0A";
  const paper = by("paper") ?? "#FFFFFF";
  const accent = by("accent") ?? ink;
  return {
    ink, paper, accent,
    mark: Math.abs(luminance(accent) - luminance(paper)) > 0.25 ? accent : ink,
    onAccent: Math.abs(luminance(accent) - luminance(paper)) > 0.35 ? paper : ink,
    display: face("display") ? `'${face("display")}', ${fallback}` : fallback,
    text: face("text") ? `'${face("text")}', ${fallback}` : fallback,
  };
}
