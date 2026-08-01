import type { Anime } from "@/types/anime";
import Carousel from "./Carousel";
import AnimeCard from "./AnimeCard";

export default function RecommendationsRow({
  basedOnTitles,
  anime,
  mode = "watchlist",
}: {
  basedOnTitles: string[];
  anime: Anime[];
  // "watchlist": titles are anime names, drawn from watch history.
  // "genres": titles are genre names from onboarding — used as a fallback
  // for users with an empty watchlist, so the heading doesn't falsely
  // imply "watched" for someone who hasn't watched anything here yet.
  mode?: "watchlist" | "genres";
}) {
  if (!anime.length) return null;

  const heading =
    mode === "genres" ? (
      <>
        Picked For You <span className="text-cyan">Based On Your Interests</span>
      </>
    ) : basedOnTitles.length <= 1 ? (
      <>
        Because You Watched{" "}
        <span className="text-cyan">{basedOnTitles[0] ?? ""}</span>
      </>
    ) : (
      <>
        Picked For You <span className="text-cyan">Based On Your Watchlist</span>
      </>
    );

  const subtext =
    mode === "genres" && basedOnTitles.length > 0
      ? `Based on ${basedOnTitles.slice(0, 3).join(", ")}${
          basedOnTitles.length > 3 ? ", and more" : ""
        }`
      : basedOnTitles.length > 1
        ? `Drawing on ${basedOnTitles.slice(0, 3).join(", ")}${
            basedOnTitles.length > 3 ? ", and more" : ""
          }`
        : null;

  return (
    <section className="container-page py-10">
      <div className="mb-5">
        <p className="eyebrow mb-1.5">Recommended for you</p>
        <h2 className="font-display text-3xl tracking-wide text-ink">{heading}</h2>
        {subtext && <p className="mt-1 text-xs text-ink-faint">{subtext}</p>}
      </div>
      <Carousel>
        {anime.map((a) => (
          <div key={a.mal_id} className="w-36 shrink-0 sm:w-44">
            <AnimeCard anime={a} />
          </div>
        ))}
      </Carousel>
    </section>
  );
}
