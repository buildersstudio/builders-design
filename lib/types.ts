export type Color = { name: string; hex: string; role?: "ink" | "paper" | "accent" | "support" };

export type Face = {
  name: string; role: "display" | "text" | "accent"; weight?: number; css?: string | null; src?: string | null;
  /** "commercial" fonts are never offered as a download; the tile links to `url` (the foundry) instead. */
  license?: "open" | "commercial"; url?: string;
};

/** Optional per-brand deck direction, applied to every deck of that venture. */
export type DeckStyle = {
  /** "imagery": every slide sits on a full-bleed picture with a dark scrim. */
  style?: "plain" | "imagery" | "gradient" | "pixel" | "field";
  /** "field": named brand colours slides can be painted in (slide "color"), and the hues fields cycle through */
  palette?: Record<string, string>;
  /** "pixel": colour of the pixel grid, and partner logos shown bottom right on every slide */
  pixel?: string;
  partners?: string[];
  /** "gradient": colourways of the brand gradient, each as a full slide image, a transparent overlay and a side glow. */
  gradients?: Record<string, { full: string; overlay: string; glow?: string }>;
  /** the colourway this deck uses (a key of gradients); set per deck in deck.json */
  variant?: string;
  /** small line next to the logo in the slide header */
  tagline?: string;
  /** gradient style: "caps" titles in the label face (Builders) or "normal" titles in the display face */
  titles?: "caps" | "normal";
  /** gradient style: the mark bottom right of every slide (defaults to the brand logo) */
  mark?: string;
  /** gradient style: ground for slides without a mode */
  defaultMode?: "light" | "dark";
  /** gradient style: draw the cover as a curved arc of the colourway's `full` background instead of a full-bleed picture */
  arc?: boolean;
  /** gradient style: the site line on the closing slide (e.g. "builders.studio") */
  site?: string;
  dark?: string;
  light?: string;
  backgrounds?: string[];
  /** Font for *emphasis* inside slide copy (rendered italic). */
  serif?: string;
  displayWeight?: number;
  /** Closing slide art and the callout labels drawn over it (x/y in %, angle in deg). */
  closing?: {
    image: string;
    labels?: { text: string; x: number; y: number; angle: number }[];
    tiles?: { title: string; body?: string; image: string }[];
  };
};

export type Brand = {
  tagline?: string;
  deck?: DeckStyle;
  colors: Color[];
  type: Face[];
  logo?: string;
  mark?: string;
};

/** background: a picture for this slide. mode: light or dark ground ("gradient" style; the cover is always dark). */
export type Person = { name: string; role?: string; photo?: string };

type Bg = { background?: string; mode?: "light" | "dark"; /** gradient colourway for this slide (gradient-style brands) */ gradient?: string; /** a photo behind the gradient (gradient style) */ photo?: string;
  /** "field" style: paint the slide in a named brand colour, and choose its pattern */ color?: string; field?: { kind?: string; color?: string } | false };

export type Slide = Bg & (
  | { layout: "cover"; eyebrow?: string; title: string; subtitle?: string; presenter?: Person }
  | { layout: "section"; eyebrow?: string; title: string }
  | { layout: "statement"; eyebrow?: string; title: string; body?: string }
  | { layout: "points"; eyebrow?: string; title: string; points: { title: string; body?: string }[] }
  | { layout: "metrics"; eyebrow?: string; title: string; metrics: { value: string; label: string }[] }
  | { layout: "split"; eyebrow?: string; title: string; body?: string; image?: string; /** "contain" shows the whole picture (product shots) */ fit?: "cover" | "contain" }
  | { layout: "quote"; quote: string; author?: string; presenter?: Person }
  | { layout: "photo"; eyebrow?: string; title: string; body?: string; image: string }
  | { layout: "showcase"; eyebrow?: string; title: string; body?: string; image: string }
  | { layout: "cards"; eyebrow?: string; title: string; cards: { title: string; body?: string; image?: string }[] }
  | { layout: "mosaic"; eyebrow?: string; title: string; body?: string; images: string[] }
  | { layout: "equation"; eyebrow?: string; title?: string; terms: { label: string; caption?: string }[]; result: string; highlight?: number }
  | { layout: "closing"; title: string; subtitle?: string; cta?: string[]; contact?: string });

export type Deck = { title: string; created?: string; slides: Slide[]; /** colourway key for gradient-style brands */ gradient?: string };

/** The palette a slide or page is painted with, derived from a brand. */
export type Theme = {
  ink: string; paper: string; accent: string;
  /** accent when it reads on paper, else ink */ mark: string;
  /** text colour that reads on the accent */ onAccent: string;
  display: string; text: string;
  /** label / name face (role "accent"), falls back to display */
  label: string;
  deck: DeckStyle;
};

export const luminance = (hex: string) => {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

export function themeOf(b: Brand, d?: { gradient?: string }): Theme {
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
    label: face("accent") ? `'${face("accent")}', ${fallback}` : face("display") ? `'${face("display")}', ${fallback}` : fallback,
    deck: { ...(b.deck ?? {}), variant: d?.gradient ?? b.deck?.variant },
  };
}

/**
 * Product snapshots live in a venture's gallery/product/ as transparent cut-outs (PNG/WebP/SVG).
 * They carry their own frame, corners and shadow, so the platform shows them whole and as they are:
 * never cropped, never given an extra radius or shadow. Photos and screenshots are framed instead.
 */
export const isCutout = (u?: string) => !!u && /\/gallery\/product\//.test(u) && /\.(png|webp|svg)$/i.test(u);
