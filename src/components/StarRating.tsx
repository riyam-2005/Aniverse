"use client";

import { useState } from "react";

/**
 * The watchlist score field is an existing 1-10 int (see
 * prisma/schema.prisma, already wired through the PATCH /api/watchlist/:id
 * route). This renders it as 5 stars — each star is worth 2 points — so a
 * "5-star" UI works without a schema or API change. Full 5 stars = 10.
 */
const MAX_STARS = 5;

export function scoreToStars(score: number | null): number {
  if (!score) return 0;
  return Math.round(score / 2);
}

export function starsToScore(stars: number): number {
  return stars * 2;
}

export default function StarRating({
  score,
  onChange,
  readOnly = false,
  size = "md",
}: {
  score: number | null;
  onChange?: (score: number | null) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const filled = hovered ?? scoreToStars(score);
  const starSize = size === "sm" ? "text-sm" : "text-lg";

  if (readOnly) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Rated ${filled} out of 5 stars`}>
        {Array.from({ length: MAX_STARS }).map((_, i) => (
          <span
            key={i}
            className={`${starSize} ${i < filled ? "text-amber" : "text-line"}`}
            aria-hidden
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
      role="radiogroup"
      aria-label="Your rating"
    >
      {Array.from({ length: MAX_STARS }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= filled;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={scoreToStars(score) === starValue}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            onMouseEnter={() => setHovered(starValue)}
            onFocus={() => setHovered(starValue)}
            onBlur={() => setHovered(null)}
            onClick={() => {
              // Clicking the star that's already the current rating clears it.
              const next = scoreToStars(score) === starValue ? null : starsToScore(starValue);
              onChange?.(next);
            }}
            className={`${starSize} leading-none transition-colors ${
              isFilled ? "text-amber" : "text-line hover:text-amber/50"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
