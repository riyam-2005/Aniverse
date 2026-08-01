"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";

export default function ScheduleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[schedule error boundary]", error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load the schedule"
      message="The broadcast guide didn't come through — likely a blip with the anime data source. Give it another try."
      reset={reset}
    />
  );
}
