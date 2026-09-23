import Link from "next/link";
import { BrandFonts } from "@/components/BrandFonts";
import { SlideBox } from "@/components/Deck";
import { Empty, Head } from "@/components/Head";
import { getBrand, getDecks, getVenture, themeOf } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function Presentations({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const brand = getBrand(venture);
  const theme = themeOf(brand);
  const decks = getDecks(venture);
  const p = prompt("presentations", v.name, venture);
  return (
    <>
      <BrandFonts faces={brand.type} />
      <Head title="Presentations" count={decks.length} prompt={p} />
      {decks.length ? (
        <div className="grid wide">
          {decks.map((d) => (
            <Link key={d.id} className="card" href={`/${venture}/presentations/${d.id}`}>
              <div className="thumb video"><SlideBox slide={d.slides[0]} theme={theme} logo={brand.logo} n={1} total={d.slides.length} /></div>
              <div className="meta"><b>{d.title}</b><span>{d.slides.length} slides</span></div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty what="presentations" prompt={p} />
      )}
    </>
  );
}
