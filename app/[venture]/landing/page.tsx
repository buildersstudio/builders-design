import { Empty, Head } from "@/components/Head";
import { PageGrid } from "@/components/PageGrid";
import { getPages, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function Landing({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const pages = getPages(venture, "landing");
  const p = prompt("landing", v.name, venture);
  return (
    <>
      <Head title="Landing pages" count={pages.length} prompt={p} />
      {pages.length ? <PageGrid pages={pages} /> : <Empty what="landing pages" prompt={p} />}
    </>
  );
}
