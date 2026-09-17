"use client";

import Link from "next/link";
import { useAuth } from "@/core/clients/auth-context";

export default function AnimeDNAWidget() {
  const { user } = useAuth();

  const traits = [
    { name: "Action & Adventure", percent: 89, color: "bg-pink" },
    { name: "Drama & Mystery", percent: 81, color: "bg-purple" },
    { name: "Psychological & Sci-Fi", percent: 78, color: "bg-cyan" },
    { name: "Romance & Slice of Life", percent: 61, color: "bg-amber" },
  ];

  return (
    <section className="container-page py-6">
      <div className="rounded-3xl border border-pink/20 bg-gradient-to-r from-[#141029] via-[#171333] to-[#0D0B1A] p-6 sm:p-8 backdrop-blur-md">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan mb-2">
              <span>🧬</span>
              <span>Taste Intelligence</span>
            </div>
            <h3 className="font-display text-3xl tracking-wide text-ink font-bold">
              Your Anime DNA Profile
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-ink-dim max-w-lg">
              {user
                ? "Computed in real-time from your ratings, watchlist genres, and completed series."
                : "AniVerse analyzes your watch history and ratings to uncover your psychological anime archetype."}
            </p>

            <div className="mt-5 space-y-3 max-w-lg">
              {traits.map((trait) => (
                <div key={trait.name}>
                  <div className="flex justify-between text-xs font-semibold text-ink-dim mb-1">
                    <span>{trait.name}</span>
                    <span className="font-mono text-ink">{trait.percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-panel2 border border-white/5">
                    <div
                      className={`h-full ${trait.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${trait.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel/70 p-6 text-center">
            <span className="text-4xl mb-2">🧠</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-pink">
              Archetype Match
            </span>
            <p className="font-display text-3xl tracking-wide text-white mt-1">
              THE STRATEGIST
            </p>
            <p className="text-xs text-ink-dim mt-2 max-w-xs leading-relaxed">
              You favor high-stakes intellect, psychological mind games, and rich narrative world-building.
            </p>
            <Link
              href="/app/anime-dna"
              className="btn-primary mt-4 text-xs px-5 py-2"
            >
              Explore Full DNA Breakdown 🧬
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
