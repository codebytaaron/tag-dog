import { getReels } from "@/lib/reels";
import Reels from "@/components/Reels";

export const revalidate = 900;
export const maxDuration = 60;
export const metadata = { title: "Reels | TapeDog" };

export default async function ReelsPage({ searchParams }: { searchParams: Promise<{ clip?: string }> }) {
  const [{ clip }, { week, clips }] = await Promise.all([searchParams, getReels()]);
  return <main className="reelsmain"><Reels initial={clips} nextWeek={week - 2} first={clip || null} /></main>;
}
