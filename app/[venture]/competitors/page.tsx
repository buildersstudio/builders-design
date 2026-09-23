import { Empty, Head } from "@/components/Head";
import { getCompetitors, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

const live = (url: string) => `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1440&viewport.height=900`;

export default async function Competitors({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const list = getCompetitors(venture);
  const p = prompt("competitors", v.name, venture);
  return (
    <>
      <Head title="Competitors" count={list.length} prompt={p} />
      {list.length ? (
        <div className="grid">
          {list.map((c) => (
            <a key={c.url} className="card" href={c.url} target="_blank" rel="noreferrer">
              <div className="thumb"><img src={c.shot ?? live(c.url)} alt="" loading="lazy" /></div>
              <div className="meta"><b>{c.name}<span className="arrow">↗</span></b><span>{c.host}</span></div>
            </a>
          ))}
        </div>
      ) : (
        <Empty what="competitors" prompt={p} />
      )}
    </>
  );
}
