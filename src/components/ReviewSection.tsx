"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { CommentListSkeleton } from "./Skeleton";

interface ReviewItem {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  // Ratings are stored 1–10; displayed as a 5-star row (half-steps).
  const outOfFive = value / 2;
  const dims = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, outOfFive - i));
        return (
          <div key={i} className={`relative ${dims}`}>
            <svg viewBox="0 0 20 20" className={`${dims} text-line`} fill="currentColor">
              <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6z" />
            </svg>
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 20 20" className={`${dims} text-amber`} fill="currentColor">
                <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6z" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function ReviewSection({ animeMalId }: { animeMalId: number }) {
  const { data: session, status } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myReview = reviews?.find((r) => r.user.id === currentUserId);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/anime/${animeMalId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setAverage(data.average ?? null);
        setCount(data.count ?? 0);
        const mine = (data.reviews ?? []).find(
          (r: ReviewItem) => r.user.id === currentUserId
        );
        if (mine) {
          setRating(mine.rating);
          setText(mine.body ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
    // currentUserId intentionally omitted — only needed once, on first load,
    // to prefill an existing review; re-running on session hydration would
    // stomp on text the user's already typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeMalId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Pick a star rating first.");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/anime/${animeMalId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body: text }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    const withoutMine = (reviews ?? []).filter((r) => r.user.id !== currentUserId);
    const updated = [data, ...withoutMine];
    setReviews(updated);
    const avg = updated.reduce((sum, r) => sum + r.rating, 0) / updated.length;
    setAverage(avg);
    setCount(updated.length);
  }

  async function onDeleteMine() {
    if (!myReview) return;
    const prev = reviews ?? [];
    const updated = prev.filter((x) => x.id !== myReview.id);
    setReviews(updated);
    setAverage(updated.length ? updated.reduce((s, r) => s + r.rating, 0) / updated.length : null);
    setCount(updated.length);
    setRating(0);
    setText("");
    const res = await fetch(`/api/anime/${animeMalId}/reviews`, { method: "DELETE" });
    if (!res.ok) {
      setReviews(prev);
      setAverage(prev.length ? prev.reduce((s, r) => s + r.rating, 0) / prev.length : null);
      setCount(prev.length);
    }
  }

  return (
    <section className="container-page py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">Reviews & ratings</p>
          <h2 className="font-display text-3xl tracking-wide text-ink">What members think</h2>
        </div>
        {average !== null && (
          <div className="flex items-center gap-2">
            <Stars value={average} size="lg" />
            <span className="font-mono text-sm text-ink-dim">
              {average.toFixed(1)}/10 · {count} {count === 1 ? "rating" : "ratings"}
            </span>
          </div>
        )}
      </div>

      {status === "authenticated" ? (
        <form onSubmit={onSubmit} className="mb-8 rounded-lg border border-line bg-panel p-4">
          <p className="mb-2 text-sm text-ink-dim">
            {myReview ? "Update your rating" : "Rate this title"}
          </p>
          <div
            className="mb-3 flex items-center gap-1"
            onMouseLeave={() => setHoverRating(0)}
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const val = i + 1;
              const active = (hoverRating || rating) >= val;
              return (
                <button
                  key={val}
                  type="button"
                  onMouseEnter={() => setHoverRating(val)}
                  onClick={() => setRating(val)}
                  aria-label={`Rate ${val} out of 10`}
                  className="p-0.5"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-5 w-5 transition-colors ${active ? "text-amber" : "text-line"}`}
                    fill="currentColor"
                  >
                    <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6z" />
                  </svg>
                </button>
              );
            })}
            {rating > 0 && (
              <span className="ml-2 font-mono text-xs text-ink-faint">{rating}/10</span>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Optional — say more about why (max 2000 characters)"
            className="w-full resize-none rounded-lg border border-line bg-panel2 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-cyan/50"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {myReview && (
                <button
                  type="button"
                  onClick={onDeleteMine}
                  className="font-mono text-xs text-ink-faint transition-colors hover:text-pink"
                >
                  Remove my review
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || rating < 1}
              className="btn-primary rounded-full px-6 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? "Saving…" : myReview ? "Update review" : "Post review"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-pink">{error}</p>}
        </form>
      ) : status === "unauthenticated" ? (
        <div className="mb-8 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-ink-dim">
          <Link href="/login" className="text-cyan hover:underline">
            Sign in
          </Link>{" "}
          to rate this title.
        </div>
      ) : null}

      {reviews === null ? (
        <CommentListSkeleton />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-dim">No reviews yet — be the first to rate it.</p>
      ) : (
        <div className="space-y-5">
          {reviews
            .filter((r) => r.body)
            .map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel2 font-mono text-xs text-ink-dim">
                  {initials(r.user.name)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{r.user.name}</span>
                    <Stars value={r.rating} />
                    <span className="font-mono text-[11px] text-ink-faint">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-dim">{r.body}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
