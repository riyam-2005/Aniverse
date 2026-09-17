import { z } from "zod";
import { apiOk, apiError, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";

export const GET = withApiHandler(async () => {
  const user = await getUser();
  if (!user) return apiError("Not signed in.", 401);

  const supabase = createClient();

  const [notifsRes, countRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
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

  return apiOk({
    notifications,
    unreadCount: countRes.count || 0,
  });
});

const readSchema = z.object({
  id: z.string().optional(),
});

export const PATCH = withApiHandler(async (req) => {
  const user = await getUser();
  if (!user) return apiError("Not signed in.", 401);

  const rate = await checkRateLimit(`notifications-read:${user.id}`, 60, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = readSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const supabase = createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (parsed.data.id) {
    query = query.eq("id", parsed.data.id);
  }

  const { error } = await query;
  if (error) throw error;

  return apiOk({ ok: true });
});
