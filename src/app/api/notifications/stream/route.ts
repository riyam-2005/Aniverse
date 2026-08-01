import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-static";

const CHECK_INTERVAL_MS = 4_000;
const MAX_STREAM_MS = 120_000;

export async function GET(req: Request) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return new Response("Not signed in.", { status: 401 });
  }

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

          const signature = JSON.stringify({ ids: notifications.map((n) => n.id), unreadCount });
          if (signature !== lastSignature) {
            lastSignature = signature;
            send("notifications", { notifications, unreadCount });
          } else {
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

      req.signal?.addEventListener("abort", () => {
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
      "X-Accel-Buffering": "no",
    },
  });
}
