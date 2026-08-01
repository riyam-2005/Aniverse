"use client";

import { useEffect } from "react";
import { reportError } from "@/components/ErrorReporter";

// This only fires if the root layout itself throws (e.g. a font or
// Providers failure) — regular route errors are caught by error.tsx.
// Because it replaces the root layout, it has to supply its own
// <html>/<body> and can't rely on globals.css tokens being guaranteed
// to load, so the styling here is deliberately plain and inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "global", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0b0b14",
          color: "#f2f2f7",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          AniVerse hit a snag
        </h1>
        <p style={{ maxWidth: 420, color: "#9a9ab0", fontSize: "0.9rem" }}>
          Something went wrong loading the app. Try reloading — if it keeps
          happening, it&apos;s likely on our end, not yours.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "0.5rem",
            border: "1px solid #2a2a3d",
            background: "transparent",
            color: "#f2f2f7",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
