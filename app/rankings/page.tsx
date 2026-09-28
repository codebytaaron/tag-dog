import { getFutures, getPolls, getStandings } from "@/lib/pulse";
import Pulse from "@/components/Pulse";

export const revalidate = 900;
export const maxDuration = 60;
export const metadata = { title: "Rankings & odds | TapeDog" };

export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab }, polls, standings, futures] = await Promise.all([searchParams, getPolls(), getStandings(), getFutures()]);
  return <main><Pulse polls={polls} standings={standings} futures={futures} initialTab={tab || "ap"} /></main>;
}
