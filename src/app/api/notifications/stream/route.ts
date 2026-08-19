import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// Runs on the Node runtime (needed for a long-lived streaming response —
// not available on Edge in this Next.js version) and must never be
// statically optimized, since the body is per-user and infinite.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECK_INTERVAL_MS = 4_000;
// Vercel serverless functions have a hard execution-time ceiling regardless
// of plan; keep each connection well under it and let EventSource's
// built-in auto-reconnect open a fresh one. The client never notices —
// it's still a live push, just re-established every couple of minutes
// instead of a single unbroken TCP connection.
const MAX_STREAM_MS = 120_000;

/**
 * GET /api/notifications/stream — Server-Sent Events.
 *
 * Pushes the current user's notifications + unread count the moment they
 * change, instead of the client waiting up to POLL_INTERVAL_MS for the
 * next poll. Still implemented as a server-side poll internally (SQLite/
 * Postgres here has no LISTEN/NOTIFY wired up), just one the client no
 * longer has to drive itself — so a change lands in ~4s instead of ~20s,
 * without hammering the DB harder than the old client poll did.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return new Response("Not signed in.", { status: 401 });
  }

  // Each connection is long-lived (up to MAX_STREAM_MS, then the client
  // auto-reconnects), so this limits how often *new* connections can be
  // opened rather than requests within one — 10 new connections per
  // minute is far more than a normal client (one tab, occasional
  // reconnects) needs, and stops a script from opening a flood of
  // concurrent streams against this server.
  const rate = await checkRateLimit(`notifications-stream:${userId}`, 10, 60 * 1000);
  if (!rate.ok) {
    return new Response("Too many requests. Please slow down.", { status: 429 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      let lastSignature = "";

      async function tick() {
        if (closed) return;
        try {
          const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
              where: { userId },
              orderBy: { createdAt: "desc" },
              take: 20,
            }),
            prisma.notification.count({ where: { userId, read: false } }),
          ]);

          // Cheap change-detection so we only push a payload when something
          // actually differs, instead of re-sending an identical list every
          // 4s (SSE has no built-in diffing).
          const signature = JSON.stringify({ ids: notifications.map((n) => n.id), unreadCount });
          if (signature !== lastSignature) {
            lastSignature = signature;
            send("notifications", { notifications, unreadCount });
          } else {
            // Heartbeat comment — keeps proxies/load balancers from
            // treating the idle connection as dead.
            controller.enqueue(encoder.encode(": ping\n\n"));
          }
        } catch (err) {
          console.error("[notifications/stream] tick failed:", err);
        }
      }

      await tick();
      const interval = setInterval(tick, CHECK_INTERVAL_MS);
      const stopAt = setTimeout(() => {
        clearInterval(interval);
        closed = true;
        controller.close();
      }, MAX_STREAM_MS);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearTimeout(stopAt);
        closed = true;
        try {
          controller.close();
        } catch {
          // Already closed — fine.
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering if fronted by one
    },
  });
}
