import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password — AniVerse",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center py-16">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
