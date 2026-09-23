import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandFonts } from "@/components/BrandFonts";
import { Player } from "@/components/Deck";
import { getBrand, getDeck, getDecks, getVenture, getVentures, themeOf } from "@/lib/content";

type P = { params: Promise<{ venture: string; deck: string }> };

export function generateStaticParams() {
  return getVentures().flatMap((v) => getDecks(v.slug).map((d) => ({ venture: v.slug, deck: d.id })));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { venture, deck } = await params;
  const d = getDeck(venture, deck);
  return { title: d ? `${d.title} · ${getVenture(venture)?.name}` : "Presentation", robots: { index: false } };
}

/** Standalone, chrome-free presentation that anyone with the link can open. */
export default async function Share({ params }: P) {
  const { venture, deck: id } = await params;
  const deck = getDeck(venture, id);
  if (!deck) notFound();
  const brand = getBrand(venture);
  return (
    <>
      <BrandFonts faces={brand.type} />
      <Player deck={deck} theme={themeOf(brand)} logo={brand.logo} />
    </>
  );
}
