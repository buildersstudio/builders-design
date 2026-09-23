import { redirect } from "next/navigation";
import { getVentures } from "@/lib/content";

export default function Home() {
  const [first] = getVentures();
  redirect(first ? `/${first.slug}/brand` : "/_empty");
}
