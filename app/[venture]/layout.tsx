import { notFound } from "next/navigation";
import { Dock } from "@/components/Dock";
import { Menu } from "@/components/Menu";
import { SECTIONS, counts, getBrand, getVenture, getVentures } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export function generateStaticParams() {
  return getVentures().map((v) => ({ venture: v.slug }));
}

export default async function VentureLayout({ children, params }: { children: React.ReactNode; params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture);
  if (!v) notFound();
  const n = counts(venture);
  return (
    <div className="shell">
      <Dock ventures={getVentures().map(({ slug, name, badge }) => ({ slug, name, badge }))} addPrompt={prompt("venture", "", "")} />
      <Menu slug={v.slug} name={v.name} url={v.url} logo={getBrand(venture).logo} sections={SECTIONS.map((s) => ({ ...s, count: n[s.key] }))} />
      <main className="work">{children}</main>
    </div>
  );
}
