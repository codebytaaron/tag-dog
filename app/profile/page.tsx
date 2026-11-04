import { getSlate, lite } from "@/lib/data";
import Profile from "@/components/Profile";

export const revalidate = 300;
export const maxDuration = 60;
export const metadata = { title: "Your profile | TapeDog" };

export default async function ProfilePage() {
  const s = await getSlate();
  return <main><Profile games={s.games.map(lite)} /></main>;
}
