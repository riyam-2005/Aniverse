import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WatchlistBoard, { type Item } from "@/components/WatchlistBoard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "My Watchlist — AniVerse",
  robots: { index: false },
};

export default async function WatchlistPage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }
  const userId = (session?.user as { id?: string } | undefined)?.id;

  let items: Item[] = [];
  if (userId) {
    try {
      const dbItems = await prisma.watchlistItem.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      items = dbItems as unknown as Item[];
    } catch {
      items = [];
    }
  }

  return (
    <div className="container-page py-10">
      <p className="eyebrow mb-1.5">Your tracking</p>
      <h1 className="font-display text-5xl tracking-wide text-ink">My Watchlist</h1>

      <div className="mt-8">
        <WatchlistBoard initialItems={items} />
      </div>
    </div>
  );
}
