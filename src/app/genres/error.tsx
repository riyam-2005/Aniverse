"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";

export default function GenresError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[genres error boundary]", error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load genres"
      message="The genre list didn't come through — likely a blip with the anime data source. Give it another try."
      reset={reset}
    />
  );
}
