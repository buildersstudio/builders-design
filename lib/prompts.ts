// The one-line briefs the "+" buttons copy, to paste into Claude Code (or any
// coding agent) opened on this repo. The heavy lifting lives in AGENTS.md.

export const REPO = process.env.NEXT_PUBLIC_REPO_URL ?? "the builders-design repo";

export function prompt(section: string, name: string, slug: string) {
  const at = `public/ventures/${slug}`;
  const base = `In ${REPO}, read AGENTS.md first.`;
  switch (section) {
    case "venture":
      return `${base} Add a new venture to Builders Design. Here is what it does: <describe the venture>. Create public/ventures/<slug>/venture.md, then follow the "New venture" checklist.`;
    case "competitors":
      return `${base} Research the current competitors of ${name} (${at}/venture.md) and update ${at}/competitors.json, then run npm run shots.`;
    case "variants":
      return `${base} Following BRANDING.md, create three new brand variants for ${name} as landing pages in ${at}/variants/.`;
    case "brand":
      return `${base} Make brand variant <id> the definitive brand of ${name}: write ${at}/brand/brand.json, logo.svg and mark.svg.`;
    case "gallery":
      return `${base} Add pictures for ${name} to ${at}/gallery/<group>/ (founders, photos, illustrations, backgrounds): <where the pictures come from>.`;
    case "presentations":
      return `${base} Create a new presentation for ${name} from templates/deck.json in ${at}/decks/<id>/deck.json. Topic: <what the deck is for>.`;
    case "landing":
      return `${base} Build a landing page for ${name} in ${at}/landing/<id>/ using its brand book (${at}/brand). Goal: <what the page is for>.`;
    case "social":
      return `${base} Create social assets for ${name} in ${at}/social/ using its brand book. Format and message: <e.g. 3 LinkedIn posts, 1080×1350, launch announcement>.`;
    default:
      return base;
  }
}
