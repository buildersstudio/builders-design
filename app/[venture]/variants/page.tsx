import { Empty, Head } from "@/components/Head";
import { PageGrid } from "@/components/PageGrid";
import { getPages, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function Variants({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const pages = getPages(venture, "variants");
  const p = prompt("variants", v.name, venture);
  return (
    <>
      <Head title="Brand variants" count={pages.length} prompt={p} />
      {pages.length ? <PageGrid pages={pages} /> : <Empty what="brand variants" prompt={p} />}
    </>
  );
}
