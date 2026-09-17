"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/core/clients/auth-context";
import { CommentListSkeleton } from "@/components/ui/Skeleton";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
  likeCount: number;
  likedByMe: boolean;
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

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CommentSection({ animeMalId }: { animeMalId: number }) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/anime/${animeMalId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setComments(data.comments ?? []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [animeMalId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/anime/${animeMalId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setComments((prev) => [data, ...(prev ?? [])]);
      setText("");
    } catch {
      setError("Failed to post comment.");
      setSubmitting(false);
    }
  }

  async function onDelete(id: string) {
    const prev = comments;
    setComments((c) => (c ?? []).filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setComments(prev ?? null);
      }
    } catch {
      setComments(prev ?? null);
    }
  }

  return (
    <section className="container-page border-t border-line py-12">
      <div className="mb-6">
        <p className="eyebrow mb-1.5">Community Discussion</p>
        <h2 className="font-display text-3xl tracking-wide text-ink">Comments</h2>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {comments === null ? (
            <CommentListSkeleton count={3} />
          ) : comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-8 text-center">
              <p className="text-sm text-ink-dim">
                No comments yet. Start the conversation!
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <article key={c.id} className="rounded-xl border border-line bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 font-mono text-xs text-pink border border-line">
                      {initials(c.user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{c.user.name}</p>
                      <p className="font-mono text-[10px] text-ink-faint">{timeAgo(c.createdAt)}</p>
                    </div>
                  </div>

                  {c.user.id === currentUserId && (
                    <button
                      onClick={() => onDelete(c.id)}
                      className="text-xs font-mono text-pink/80 hover:text-pink transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className="mt-3 text-sm text-ink-dim leading-relaxed whitespace-pre-line">
                  {c.content}
                </p>
              </article>
            ))
          )}
        </div>

        <div>
          <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
            <h3 className="font-display text-xl text-ink">Join the discussion</h3>

            {user ? (
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share your thoughts on this episode/series..."
                  className="input w-full resize-none py-2 text-xs"
                />

                {error && <p className="text-xs text-pink">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  className="btn-primary w-full text-xs py-2 disabled:opacity-50"
                >
                  {submitting ? "Posting…" : "Post Comment"}
                </button>
              </form>
            ) : (
              <div className="mt-4 text-center py-6">
                <p className="text-xs text-ink-dim mb-3">Sign in to leave a comment.</p>
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
