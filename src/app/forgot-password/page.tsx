import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password — AniVerse",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center py-16">
      <ForgotPasswordForm />
    </div>
  );
}
