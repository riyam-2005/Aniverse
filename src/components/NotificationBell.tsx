"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  animeMalId: number;
  read: boolean;
  createdAt: string;
}

// Fallback poll interval, used only if the SSE connection can't be
// established at all (e.g. a proxy that strips streaming responses). While
// SSE is connected this never fires — the stream pushes updates instead.
const FALLBACK_POLL_INTERVAL_MS = 20_000;

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { status } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function applyPayload(data: { notifications?: NotificationItem[]; unreadCount?: number }) {
    setItems(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }

  // Real-time push via Server-Sent Events, with a polling fallback for
  // browsers/proxies that can't sustain a streaming connection (or if the
  // stream errors out repeatedly). EventSource reconnects automatically on
  // its own when the server closes the connection (see MAX_STREAM_MS in
  // the route handler) or on a transient network blip, so no manual
  // reconnect logic is needed here.
  useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;

    let cancelled = false;
    let fallbackId: ReturnType<typeof setInterval> | null = null;
    let consecutiveErrors = 0;

    async function pollOnce() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok || cancelled) return;
        applyPayload(await res.json());
      } catch {
        // Silent — a missed poll just tries again next interval.
      }
    }

    function startFallbackPolling() {
      if (fallbackId) return;
      pollOnce();
      fallbackId = setInterval(pollOnce, FALLBACK_POLL_INTERVAL_MS);
    }

    const source = new EventSource("/api/notifications/stream");

    source.addEventListener("notifications", (event) => {
      consecutiveErrors = 0;
      if (fallbackId) {
        clearInterval(fallbackId);
        fallbackId = null;
      }
      try {
        applyPayload(JSON.parse((event as MessageEvent).data));
      } catch {
        // Malformed payload — ignore this tick, the next one self-corrects.
      }
    });

    source.onerror = () => {
      consecutiveErrors += 1;
      // A couple of hiccups is normal (the connection is intentionally
      // recycled every MAX_STREAM_MS); only fall back to polling if the
      // stream can't seem to establish at all.
      if (consecutiveErrors >= 3) {
        startFallbackPolling();
      }
    };

    return () => {
      cancelled = true;
      source.close();
      if (fallbackId) clearInterval(fallbackId);
    };
  }, [status]);


  // Close the dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // Best-effort — next poll reconciles the real state either way.
    }
  }

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Best-effort — next poll reconciles the real state either way.
    }
  }

  if (status !== "authenticated") return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-dim transition-colors hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm7-6v-5a7 7 0 00-5.5-6.84V3a1.5 1.5 0 00-3 0v1.16A7 7 0 005 11v5l-1.7 1.7a1 1 0 00.7 1.71h15.99a1 1 0 00.71-1.71z" />
        </svg>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink px-1 font-mono text-[10px] font-bold text-void"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-line bg-panel shadow-xl"
          >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="font-mono text-[11px] text-cyan hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-faint">
                Nothing yet — check back later.
              </p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={`/anime/${n.animeMalId}`}
                  onClick={() => markOneRead(n.id)}
                  className={`block border-b border-line px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-panel2 ${
                    n.read ? "text-ink-dim" : "text-ink"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                    )}
                    <div className="min-w-0">
                      <p className="leading-snug">{n.message}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
