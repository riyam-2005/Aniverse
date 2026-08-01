"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function WatchlistButton({
  malId,
  title,
  imageUrl,
  totalEpisodes,
}: {
  malId: number;
  title: string;
  imageUrl: string;
  totalEpisodes: number | null;
}) {
  const { status } = useSession();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (status === "loading") {
    return <div className="h-10 w-32 skeleton rounded-full bg-panel2" />;
  }

  if (status !== "authenticated") {
    return (
      <Link href="/login" className="btn-secondary">
        Sign in to track this
      </Link>
    );
  }

  async function handleAdd() {
    setState("saving");
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          malId,
          title,
          imageUrl,
          totalEpisodes,
          status: "PLANNING",
        }),
      });
      if (!res.ok) throw new Error();
      setState("saved");
    } catch {
      setState("error");
    }
  }

  if (state === "saved") {
    return (
      <Link href="/watchlist" className="btn-primary">
        ✓ On your list — view it
      </Link>
    );
  }

  return (
    <button onClick={handleAdd} disabled={state === "saving"} className="btn-primary">
      {state === "saving" ? "Adding…" : "Add to Watchlist"}
      {state === "error" && (
        <span className="ml-1 text-void/70">— try again</span>
      )}
    </button>
  );
}
