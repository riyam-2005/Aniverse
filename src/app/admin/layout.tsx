import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

// Every /admin/* page is gated here so no individual page can forget the
// check. Non-admins (including signed-out visitors) get a plain 404 rather
// than a 403/redirect-to-login — that avoids confirming to a random visitor
// that an admin area exists at all.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!(await isAdmin(email))) {
    notFound();
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <Link href="/admin" className="eyebrow mr-4">
          Admin
        </Link>
        <Link href="/admin" className="btn-ghost">
          Dashboard
        </Link>
        <Link href="/admin/analytics" className="btn-ghost">
          Analytics
        </Link>
        <Link href="/admin/monitoring" className="btn-ghost">
          Monitoring
        </Link>
      </div>
      {children}
    </div>
  );
}
