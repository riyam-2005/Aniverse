"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";

export default function AnimeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[anime detail error boundary]", error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load this title"
      message="We couldn't reach the anime data source just now. This isn't a 404 — the title may still exist. Give it another try."
      reset={reset}
    />
  );
}
