import { Gallery } from "@/components/Gallery";
import { Empty, Head } from "@/components/Head";
import { getGallery, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function GalleryPage({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const pics = getGallery(venture);
  const p = prompt("gallery", v.name, venture);
  return (
    <>
      <Head title="Gallery" count={pics.length} prompt={p} />
      {pics.length ? <Gallery pictures={pics} /> : <Empty what="pictures" prompt={p} />}
    </>
  );
}
