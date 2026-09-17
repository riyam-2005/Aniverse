import type { Metadata } from "next";
import { createClient } from "@/core/clients/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users Management — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Accounts Directory</p>
          <h1 className="font-display text-4xl tracking-wide text-ink">Registered Users</h1>
        </div>
        <span className="font-mono text-xs text-cyan">
          Total: {users?.length || 0}
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-panel2/60 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Username</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {(users || []).map((u) => (
                <tr key={u.id} className="hover:bg-panel2/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-ink flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-cyan/20 text-cyan font-bold flex items-center justify-center font-mono">
                      {u.display_name?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span>{u.display_name || "Unnamed"}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-ink-dim">@{u.username || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold ${
                        u.role === "ADMIN"
                          ? "bg-pink/20 text-pink border border-pink/30"
                          : "bg-panel2 text-ink-faint"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-ink-faint">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
