import { BrandBook } from "@/components/BrandBook";
import { Head } from "@/components/Head";
import { getBrand, getVenture } from "@/lib/content";
import { prompt } from "@/lib/prompts";

export default async function BrandPage({ params }: { params: Promise<{ venture: string }> }) {
  const { venture } = await params;
  const v = getVenture(venture)!;
  return (
    <>
      <Head title="Brand book" prompt={prompt("brand", v.name, venture)} />
      <BrandBook brand={getBrand(venture)} slug={venture} name={v.name} />
    </>
  );
}
