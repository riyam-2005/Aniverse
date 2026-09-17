"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/core/clients/auth-context";
import { CommentListSkeleton } from "@/components/ui/Skeleton";

interface ReviewItem {
  id: string;
  rating: number;
  title?: string | null;
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
              <svg viewBox="0 0 20 20" className={`${dims} text-amber-400`} fill="currentColor">
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
  const { user } = useAuth();
  const currentUserId = user?.id;

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
  }, [animeMalId, currentUserId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a rating before submitting.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/anime/${animeMalId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save review.");
        return;
      }
      setReviews((prev) => {
        const withoutMine = (prev ?? []).filter((r) => r.user.id !== currentUserId);
        return [data, ...withoutMine];
      });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!confirm("Are you sure you want to delete your review?")) return;
    try {
      await fetch(`/api/anime/${animeMalId}/reviews`, { method: "DELETE" });
      setReviews((prev) => (prev ?? []).filter((r) => r.user.id !== currentUserId));
      setRating(0);
      setText("");
    } catch {
      // Ignored
    }
  }

  return (
    <section className="container-page border-t border-line py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">User Ratings</p>
          <h2 className="font-display text-3xl tracking-wide text-ink">Reviews</h2>
        </div>
        {average !== null && (
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl text-amber-400">
              {average.toFixed(1)}
            </span>
            <div>
              <Stars value={average} size="lg" />
              <p className="font-mono text-[11px] text-ink-faint">
                {count} {count === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {reviews === null ? (
            <CommentListSkeleton count={2} />
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-8 text-center">
              <p className="text-sm text-ink-dim">
                No reviews yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="rounded-xl border border-line bg-panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel2 font-mono text-xs text-cyan border border-line">
                      {initials(r.user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{r.user.name}</p>
                      <p className="font-mono text-[11px] text-ink-faint">
                        {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="font-mono text-xs text-amber-400">
                      {r.rating}/10
                    </span>
                  </div>
                </div>

                {r.body && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-dim whitespace-pre-line">
                    {r.body}
                  </p>
                )}
              </article>
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
            <h3 className="font-display text-xl text-ink">
              {myReview ? "Edit your review" : "Leave a review"}
            </h3>

            {user ? (
              <form onSubmit={onSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block font-mono text-xs text-ink-dim">
                    Rating (1–10)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const starVal = i + 1;
                      const active = (hoverRating || rating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(starVal)}
                          className={`h-7 w-7 rounded-lg text-xs font-mono font-bold transition-all ${
                            active
                              ? "bg-amber-400 text-slate-950 shadow-sm"
                              : "bg-panel2 text-ink-dim hover:text-ink"
                          }`}
                        >
                          {starVal}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-text" className="mb-1.5 block font-mono text-xs text-ink-dim">
                    Review thoughts (optional)
                  </label>
                  <textarea
                    id="review-text"
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What did you think of the story, animation, and characters?"
                    className="input w-full resize-none py-2 text-xs"
                  />
                </div>

                {error && <p className="text-xs text-pink">{error}</p>}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 text-xs py-2"
                  >
                    {submitting ? "Saving…" : myReview ? "Update Review" : "Post Review"}
                  </button>
                  {myReview && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="btn-ghost text-xs text-pink px-3"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="mt-4 text-center py-6">
                <p className="text-xs text-ink-dim mb-3">Sign in to rate and review this anime.</p>
                <Link href={`/login?callbackUrl=/anime/${animeMalId}`} className="btn-secondary text-xs inline-flex">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
