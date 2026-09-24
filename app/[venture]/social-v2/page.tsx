import { BrandFonts } from "@/components/BrandFonts";
import { Head } from "@/components/Head";
import { SocialV2 } from "@/components/SocialV2";
import { getBrand, getCampaigns, getIdeas, getVenture, themeOf } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function SocialV2Page({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const brand = getBrand(venture);
  return (
    <>
      <BrandFonts faces={brand.type} />
      <Head title="Social v2" prompt={prompt("social-v2", v.name, venture)} />
      <SocialV2 slug={venture} brand={brand} theme={themeOf(brand)} campaigns={getCampaigns(venture)} ideas={getIdeas(venture)} ideaPrompt={prompt("social-idea", v.name, venture)} newPrompt={prompt("social-v2", v.name, venture)} />
    </>
  );
}
