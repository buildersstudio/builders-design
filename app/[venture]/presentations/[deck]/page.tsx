import { notFound } from "next/navigation";
import { BrandFonts } from "@/components/BrandFonts";
import { DeckEditor } from "@/components/Deck";
import { getBrand, getDeck, getDecks, getVentures, themeOf } from "@/lib/content";

export function generateStaticParams() {
  return getVentures().flatMap((v) => getDecks(v.slug).map((d) => ({ venture: v.slug, deck: d.id })));
}

export default async function DeckPage({ params }: { params: Promise<{ venture: string; deck: string }> }) {
  const { venture, deck: id } = await params;
  const deck = getDeck(venture, id);
  if (!deck) notFound();
  const brand = getBrand(venture);
  return (
    <>
      <BrandFonts faces={brand.type} />
      <DeckEditor initial={deck} theme={themeOf(brand, deck)} logo={brand.logo} venture={venture} id={id} />
    </>
  );
}
