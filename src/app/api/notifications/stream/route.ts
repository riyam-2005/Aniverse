import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECK_INTERVAL_MS = 5_000;
const MAX_STREAM_MS = 120_000;

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) {
    return new Response("Not signed in.", { status: 401 });
  }

  const userId = user.id;

  const rate = await checkRateLimit(`notifications-stream:${userId}`, 10, 60 * 1000);
  if (!rate.ok) {
    return new Response("Too many requests. Please slow down.", { status: 429 });
  }

  const supabase = createClient();
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
          const [notifsRes, countRes] = await Promise.all([
            supabase
              .from("notifications")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(20),
            supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .is("read_at", null),
          ]);

          const notifications = (notifsRes.data || []).map((n) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            read: Boolean(n.read_at),
            createdAt: n.created_at,
            data: n.data,
          }));
          const unreadCount = countRes.count || 0;

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

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearTimeout(stopAt);
        closed = true;
        try {
          controller.close();
        } catch {
          // Already closed
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
