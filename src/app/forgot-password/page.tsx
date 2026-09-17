import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordForm from "@/components/features/auth/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forgot Password — AniVerse",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center py-16">
      <Suspense fallback={<div className="h-40 w-full max-w-sm rounded-2xl bg-panel2 skeleton" />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
