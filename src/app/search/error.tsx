"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[search error boundary]", error);
  }, [error]);

  return (
    <ErrorState
      title="Search is having trouble"
      message="We couldn't run that search — likely a blip with the anime data source. Give it another try."
      reset={reset}
    />
  );
}
