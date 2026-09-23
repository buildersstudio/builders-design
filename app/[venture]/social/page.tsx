import { BrandFonts } from "@/components/BrandFonts";
import { Head } from "@/components/Head";
import { Social } from "@/components/Social";
import { getBrand, getGallery, getVenture, themeOf } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function SocialPage({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const brand = getBrand(venture);
  return (
    <>
      <BrandFonts faces={brand.type} />
      <Head title="Social" prompt={prompt("social", v.name, venture)} />
      <Social slug={venture} name={v.name} brand={brand} theme={themeOf(brand)} pictures={getGallery(venture)} />
    </>
  );
}
