"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, type FormEvent } from "react";
import { CommentListSkeleton } from "./Skeleton";

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
  const { data: session, status } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

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
  }

  async function onDelete(id: string) {
    const prev = comments;
    setComments((c) => (c ?? []).filter((x) => x.id !== id));
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      // restore on failure
      setComments(prev ?? null);
    }
  }

  async function toggleLike(id: string) {
    if (status !== "authenticated") return;

    const prev = comments;
    // Optimistic — flip immediately, reconcile with the server's real
    // count once the response comes back (or roll back on failure).
    setComments((c) =>
      (c ?? []).map((x) =>
        x.id === id
          ? { ...x, likedByMe: !x.likedByMe, likeCount: x.likeCount + (x.likedByMe ? -1 : 1) }
          : x
      )
    );

    try {
      const res = await fetch(`/api/comments/like/${id}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments((c) =>
        (c ?? []).map((x) =>
          x.id === id ? { ...x, likedByMe: data.liked, likeCount: data.likeCount } : x
        )
      );
    } catch {
      setComments(prev ?? null);
    }
  }

  return (
    <section className="container-page py-10">
      <div className="mb-5">
        <p className="eyebrow mb-1.5">Discussion</p>
        <h2 className="font-display text-3xl tracking-wide text-ink">
          Comments {comments ? `(${comments.length})` : ""}
        </h2>
      </div>

      {status === "authenticated" ? (
        <form onSubmit={onSubmit} className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Share your thoughts…"
            className="w-full resize-none rounded-lg border border-line bg-panel px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-cyan/50"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink-faint">
              {text.length}/1000
            </span>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="btn-primary rounded-full px-6 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-pink">{error}</p>}
        </form>
      ) : status === "unauthenticated" ? (
        <div className="mb-8 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-ink-dim">
          <Link href="/login" className="text-cyan hover:underline">
            Sign in
          </Link>{" "}
          to join the discussion.
        </div>
      ) : null}

      {comments === null ? (
        <CommentListSkeleton />
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink-dim">
          No comments yet — be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel2 font-mono text-xs text-ink-dim">
                {initials(c.user.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{c.user.name}</span>
                  <span className="font-mono text-[11px] text-ink-faint">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-dim">{c.content}</p>
                <div className="mt-1.5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleLike(c.id)}
                    disabled={status !== "authenticated"}
                    className={`flex items-center gap-1 font-mono text-[11px] transition-colors disabled:cursor-default ${
                      c.likedByMe ? "text-pink" : "text-ink-faint hover:text-pink"
                    }`}
                  >
                    <svg
                      key={c.likeCount}
                      viewBox="0 0 24 24"
                      fill={c.likedByMe ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="pop-in h-3.5 w-3.5"
                    >
                      <path d="M12 21s-6.7-4.35-9.3-8.1C1.1 10.4 1.6 6.9 4.3 5.3a5 5 0 016.7 1.2 5 5 0 016.7-1.2c2.7 1.6 3.2 5.1 1.6 7.6C18.7 16.65 12 21 12 21z" />
                    </svg>
                    {c.likeCount > 0 && c.likeCount}
                  </button>
                  {currentUserId === c.user.id && (
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="font-mono text-[11px] text-ink-faint transition-colors hover:text-pink"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
