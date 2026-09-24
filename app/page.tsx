import { Home } from "@/components/Home";
import { getVentures } from "@/lib/content";

export default function Page() {
  return <Home ventures={getVentures().map(({ slug, name, badge, badgeBg }) => ({ slug, name, badge, badgeBg }))} />;
}
