import { getSlate, lite } from "@/lib/data";
import { getLive } from "@/lib/live";
import Tracker from "@/components/Tracker";

export const revalidate = 60;
export const maxDuration = 60;
export const metadata = { title: "Score Tracker | TapeDog" };

export default async function TrackerPage() {
  const [s, live] = await Promise.all([getSlate(), getLive()]);
  return <main><Tracker games={s.games.map(lite)} initial={live} /></main>;
}
