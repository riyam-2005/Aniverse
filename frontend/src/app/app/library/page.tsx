import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, createClient } from "@/core/clients/supabase-server";
import WatchlistBoard, { type LibraryItem } from "@/components/features/watchlist/WatchlistBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Anime Library — AniVerse",
  description: "Track your watching progress, completed series, ratings, and favorites.",
  robots: { index: false },
};

export default async function LibraryPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?callbackUrl=/app/library");
  }

  const supabase = createClient();
  const { data: items } = await supabase
    .from("user_anime")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Personal Collection</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink">
            My <span className="text-cyan">Anime Library</span>
          </h1>
        </div>
      </div>

      <WatchlistBoard initialItems={(items || []) as unknown as LibraryItem[]} />
    </div>
  );
}
