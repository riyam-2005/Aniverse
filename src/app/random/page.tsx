import { redirect } from "next/navigation";
import { getRandomAnime } from "@/lib/jikan";

export const revalidate = 0;

export default async function RandomAnimePage() {
  const anime = await getRandomAnime();

  if (!anime) {
    // Jikan's random endpoint failed — send them somewhere useful instead
    // of a dead end.
    redirect("/trending");
  }

  redirect(`/anime/${anime.mal_id}`);
}
