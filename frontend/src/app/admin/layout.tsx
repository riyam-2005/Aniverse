import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/core/clients/supabase-server";
import { isAdmin } from "@/features/admin/admin.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user || !(await isAdmin(user.email || user.id))) {
    notFound();
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <Link href="/admin" className="eyebrow mr-4">
          Admin Portal
        </Link>
        <Link href="/admin" className="btn-ghost text-xs">
          Dashboard
        </Link>
        <Link href="/admin/users" className="btn-ghost text-xs">
          Users
        </Link>
        <Link href="/admin/analytics" className="btn-ghost text-xs">
          Analytics
        </Link>
        <Link href="/admin/monitoring" className="btn-ghost text-xs">
          Monitoring
        </Link>
      </div>
      {children}
    </div>
  );
}
