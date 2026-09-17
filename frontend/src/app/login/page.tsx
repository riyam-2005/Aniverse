import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/core/clients/supabase-server";
import LoginForm from "@/components/features/auth/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In — AniVerse",
};

export default async function LoginPage() {
  const user = await getUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <Suspense fallback={<div className="h-40 w-full max-w-sm rounded-2xl bg-panel2 skeleton" />}>
        <LoginForm hasGoogle={true} />
      </Suspense>
    </div>
  );
}
