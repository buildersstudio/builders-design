import type { Face } from "@/lib/types";

/** Loads a brand's typefaces: a Google Fonts stylesheet, or a CORS-open font file. */
export function BrandFonts({ faces }: { faces: Face[] }) {
  const css = faces
    .filter((f) => f.src)
    .map((f) => `@font-face{font-family:'${f.name}';src:url('${f.src}');font-weight:${f.weight ?? 400};font-display:swap}`)
    .join("");
  return (
    <>
      {[...new Set(faces.map((f) => f.css).filter(Boolean))].map((href) => <link key={href!} rel="stylesheet" href={href!} />)}
      {css && <style>{css}</style>}
    </>
  );
}
