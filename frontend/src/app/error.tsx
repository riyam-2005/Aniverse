"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ui/ErrorState";
import { reportError } from "@/components/ui/ErrorReporter";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "root", digest: error.digest });
  }, [error]);

  return <ErrorState reset={reset} />;
}
