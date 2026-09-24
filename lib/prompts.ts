// The one-line briefs the "+" buttons copy, to paste into Claude Code (or any
// coding agent) opened on this repo. The heavy lifting lives in AGENTS.md.

export const REPO = process.env.NEXT_PUBLIC_REPO_URL ?? "the builders-design repo";

export function prompt(section: string, name: string, slug: string) {
  const at = `public/ventures/${slug}`;
  const base = `Clone ${REPO} if you do not have it locally, and read its AGENTS.md first. When you are done, run npm run build, then commit and push to main so it appears on Builders Design for everyone.`;
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
      return `${base} Create a new presentation for ${name} in ${at}/decks/<id>/deck.json, starting from templates/deck.json and using only the layouts AGENTS.md lists for ${name}'s deck style, so it looks exactly like the existing ${name} decks (look at ${at}/decks/ for examples). Put no styling in the deck. Topic: <what the deck is for>.`;
    case "landing":
      return `${base} Build a landing page for ${name} in ${at}/landing/<id>/ using its brand book (${at}/brand). Goal: <what the page is for>.`;
    case "social-v2":
      return `${base} Following the "Social v2" section of AGENTS.md, plan a campaign of 10 ready-to-post LinkedIn posts for ${name} in ${at}/social/campaigns/<date>-<slug>/campaign.json, and mark the idea in ${at}/social/ideas.json. Campaign: <what happened, or the idea from the backlog>.`;
    case "social-idea":
      return `${base} Following the "Social v2" section of AGENTS.md, turn this idea from ${at}/social/ideas.json into a campaign of 10 ready-to-post LinkedIn posts for ${name}: `;
    case "social":
      return `${base} Create social assets for ${name} in ${at}/social/ using its brand book. Format and message: <e.g. 3 LinkedIn posts, 1080×1350, launch announcement>.`;
    default:
      return base;
  }
}
