"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/core/clients/auth-context";

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
  const { user, loading } = useAuth();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [status, setStatus] = useState<"PLAN_TO_WATCH" | "WATCHING" | "COMPLETED">("PLAN_TO_WATCH");

  if (loading) {
    return <div className="h-9 w-32 skeleton rounded-full bg-panel2" />;
  }

  if (!user) {
    return (
      <Link href={`/login?callbackUrl=/anime/${malId}`} className="btn-secondary text-xs">
        Sign in to Track
      </Link>
    );
  }

  async function handleAdd(selectedStatus: "PLAN_TO_WATCH" | "WATCHING" | "COMPLETED" = status) {
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
          status: selectedStatus,
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
      <Link href="/app/library" className="btn-primary text-xs py-1.5 px-3">
        ✓ In Library
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => handleAdd("PLAN_TO_WATCH")}
        disabled={state === "saving"}
        className="btn-primary text-xs py-1.5 px-3"
      >
        {state === "saving" ? "Adding…" : "+ Add to Library"}
        {state === "error" && <span className="ml-1 text-void/70">— try again</span>}
      </button>
    </div>
  );
}
