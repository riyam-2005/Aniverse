import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/core/clients/supabase-server";
import { calculateAnimeDna } from "@/features/dna-engine/dna.service";
import AnimeDnaDashboard from "@/components/features/dna-profile/AnimeDnaDashboard";

export const metadata: Metadata = {
  title: "Anime DNA — Personal Taste Profile",
  description: "Explore your Anime DNA personality archetype, genre affinity breakdown, and streaming insights.",
};

export const dynamic = "force-dynamic";

export default async function AnimeDnaPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?callbackUrl=/app/anime-dna");
  }

  const profile = await calculateAnimeDna(user.id);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <p className="eyebrow mb-1">Personalization Engine</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink">
          My <span className="text-cyan">Anime DNA</span>
        </h1>
      </div>

      <AnimeDnaDashboard profile={profile} />
    </div>
  );
}
