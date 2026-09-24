import { BrandFonts } from "@/components/BrandFonts";
import { Head } from "@/components/Head";
import { SocialGallery } from "@/components/SocialGallery";
import type { SavedPost } from "@/components/Social";
import { getBrand, getGallery, getSocialPosts, getVenture, themeOf } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function SocialPage({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const brand = getBrand(venture);
  const posts = getSocialPosts(venture) as SavedPost[];
  return (
    <>
      <BrandFonts faces={brand.type} />
      <Head title="Social" count={posts.length} />
      <SocialGallery slug={venture} name={v.name} brand={brand} theme={themeOf(brand)} pictures={getGallery(venture)} initial={posts} prompt={prompt("social", v.name, venture)} />
    </>
  );
}
