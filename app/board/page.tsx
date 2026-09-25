import { getSlate, lite } from "@/lib/data";
import { getLive } from "@/lib/live";
import Board from "@/components/Board";

export const revalidate = 60;
export const maxDuration = 60;
export const metadata = { title: "Fade Board — TapeDog" };

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab }, s, live] = await Promise.all([searchParams, getSlate(), getLive()]);
  return <main><Board games={s.games.map(lite)} week={s.week} season={s.season} updated={s.updated} initialTab={tab || ""} initialLive={live} /></main>;
}
