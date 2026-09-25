import { Home } from "@/components/Home";
import { getVentures } from "@/lib/content";
import { isPrivate } from "@/lib/private";

export default function Page() {
  return <Home ventures={getVentures().map(({ slug, name, badge, badgeBg }) => ({ slug, name, badge, badgeBg, locked: isPrivate(slug) }))} />;
}
