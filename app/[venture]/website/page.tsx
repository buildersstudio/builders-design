import { Empty, Head } from "@/components/Head";
import { WebsiteBuilder } from "@/components/WebsiteBuilder";
import { getSite, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function Website({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const data = getSite(venture);
  const p = prompt("website", v.name, venture);
  return (
    <>
      <Head title="Website" count={data ? data.maps[data.site.current]?.pages.length : undefined} prompt={p} />
      {data ? <WebsiteBuilder slug={venture} site={data.site} maps={data.maps} /> : <Empty what="website" prompt={p} />}
    </>
  );
}
