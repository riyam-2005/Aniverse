import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PhoneSettingsForm from "@/components/PhoneSettingsForm";

export const revalidate = 60;
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Phone Sign-In — AniVerse",
};

export default async function AccountPhonePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    redirect("/login?callbackUrl=/account/phone");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, phoneVerifiedAt: true },
  });
  const linkedPhone = user?.phoneVerifiedAt ? user.phone : null;

  return (
    <div className="container-page max-w-md py-16">
      <p className="eyebrow mb-1.5">Account</p>
      <h1 className="font-display text-3xl tracking-wide text-ink">Phone sign-in</h1>
      <p className="mt-2 text-sm text-ink-dim">
        Link a phone number to sign in with a text-message code instead of your password.
      </p>
      <div className="mt-8">
        <PhoneSettingsForm initialPhone={linkedPhone ?? null} />
      </div>
    </div>
  );
}
