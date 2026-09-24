/** A venture's app badge: its logo on its own colour, or its artwork filling the whole badge. */
export function BadgeArt({ name, badge, badgeBg }: { name: string; badge?: string; badgeBg?: string }) {
  if (!badge) return <b className="badge-mono">{name[0]}</b>;
  if (badgeBg === "cover") return <img className="badge-cover" src={badge} alt="" />;
  return <img className="badge-logo" src={badge} alt="" />;
}

export const badgeStyle = (badgeBg?: string) => (badgeBg && badgeBg !== "cover" ? { background: badgeBg } : undefined);
