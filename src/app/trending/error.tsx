"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";

export default function TrendingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[trending error boundary]", error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load trending anime"
      message="The rankings didn't come through — likely a blip with the anime data source. Give it another try."
      reset={reset}
    />
  );
}
