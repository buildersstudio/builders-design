import { Empty, Head } from "@/components/Head";
import { VisionBoardView } from "@/components/VisionBoard";
import { getVision, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function Vision({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const board = getVision(venture);
  const p = prompt("vision", v.name, venture);
  return (
    <>
      <Head title="Vision" count={board?.initiatives.length} prompt={p} />
      {board?.initiatives.length ? <VisionBoardView slug={venture} initial={board} /> : <Empty what="initiatives" prompt={p} />}
    </>
  );
}
