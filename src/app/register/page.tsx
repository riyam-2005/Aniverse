import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create Your Account — AniVerse",
};

export default function RegisterPage() {
  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const hasPhone = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );

  return (
    <div className="container-page flex min-h-[70vh] items-center py-16">
      <RegisterForm hasGoogle={hasGoogle} hasPhone={hasPhone} />
    </div>
  );
}
