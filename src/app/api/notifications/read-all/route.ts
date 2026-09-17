import { apiOk, apiError, withApiHandler } from "@/core/utils/api";
import { createClient, getUser } from "@/core/clients/supabase-server";

export const POST = withApiHandler(async () => {
  const user = await getUser();
  if (!user) return apiError("Not signed in.", 401);

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) throw error;

  return apiOk({ ok: true });
});
