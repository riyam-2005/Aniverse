import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WatchlistBoard, { type Item } from "@/components/WatchlistBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Watchlist — AniVerse",
  robots: { index: false },
};

export default async function WatchlistPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login?callbackUrl=/watchlist");
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="container-page py-10">
      <p className="eyebrow mb-1.5">Your tracking</p>
      <h1 className="font-display text-5xl tracking-wide text-ink">My Watchlist</h1>

      <div className="mt-8">
        <WatchlistBoard initialItems={items as unknown as Item[]} />
      </div>
    </div>
  );
}
