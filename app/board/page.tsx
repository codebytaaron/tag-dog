import { getSlate, lite } from "@/lib/data";
import Board from "@/components/Board";

export const revalidate = 900;
export const maxDuration = 60;
export const metadata = { title: "Fade Board — TapeDog" };

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab }, s] = await Promise.all([searchParams, getSlate()]);
  const t = tab === "heat" || tab === "saved" ? tab : "fade";
  return <main><Board games={s.games.map(lite)} week={s.week} season={s.season} updated={s.updated} initialTab={t} /></main>;
}
