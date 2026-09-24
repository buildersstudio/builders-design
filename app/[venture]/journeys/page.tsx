import { Empty, Head } from "@/components/Head";
import { JourneyMap } from "@/components/JourneyMap";
import { getJourneys, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function Journeys({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const data = getJourneys(venture);
  const p = prompt("journeys", v.name, venture);
  return (
    <>
      <Head title="Journeys" count={data?.journeys.length} prompt={p} />
      {data?.journeys.length ? <JourneyMap data={data} name={v.name} /> : <Empty what="journeys" prompt={p} />}
    </>
  );
}
