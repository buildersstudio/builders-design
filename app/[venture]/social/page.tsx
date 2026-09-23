import { Empty, Head } from "@/components/Head";
import { PagePreview } from "@/components/ui";
import { getSocial, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function Social({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  const items = getSocial(venture);
  const p = prompt("social", v.name, venture);
  return (
    <>
      <Head title="Social" count={items.length} prompt={p} />
      {items.length ? (
        <div className="grid">
          {items.map((a) => (
            <a key={a.id} className="card" href={a.href} target="_blank" rel="noreferrer">
              <div className="thumb square contain">{a.kind === "image" ? <img src={a.href} alt="" loading="lazy" /> : <PagePreview src={a.href} width={1080} />}</div>
              <div className="meta"><b>{a.title}<span className="arrow">↗</span></b></div>
            </a>
          ))}
        </div>
      ) : (
        <Empty what="social assets" prompt={p} />
      )}
    </>
  );
}
