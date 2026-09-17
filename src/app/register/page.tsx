import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/core/clients/supabase-server";
import RegisterForm from "@/components/features/auth/RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Your Account — AniVerse",
};

export default async function RegisterPage() {
  const user = await getUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <Suspense fallback={<div className="h-40 w-full max-w-sm rounded-2xl bg-panel2 skeleton" />}>
        <RegisterForm hasGoogle={true} />
      </Suspense>
    </div>
  );
}
