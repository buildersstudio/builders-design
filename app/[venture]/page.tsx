import { redirect } from "next/navigation";

export default async function Venture({ params }: { params: Promise<{ venture: string }> }) {
  redirect(`/${(await params).venture}/brand`);
}
