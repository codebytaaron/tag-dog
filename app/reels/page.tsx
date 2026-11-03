import { getReels } from "@/lib/reels";
import Reels from "@/components/Reels";

export const revalidate = 900;
export const maxDuration = 60;
export const metadata = { title: "Reels | TapeDog" };

export default async function ReelsPage() {
  const reels = await getReels();
  return <main className="reelsmain"><Reels reels={reels} /></main>;
}
