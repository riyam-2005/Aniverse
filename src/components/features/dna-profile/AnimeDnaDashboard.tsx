"use client";

import { useState } from "react";
import type { AnimeDnaProfile } from "@/features/dna-engine/dna.service";
import Link from "next/link";
import TasteComparisonModal from "@/components/features/dna-profile/TasteComparisonModal";

export default function AnimeDnaDashboard({ profile }: { profile: AnimeDnaProfile }) {
  const [copied, setCopied] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  function handleShare() {
    const text = `🧬 My Aniverse Anime DNA Archetype is ${profile.archetype.title} ${profile.archetype.badge}!\nWatched ${profile.totalEpisodesWatched} episodes (${profile.totalHoursWatched} hours).\nCheck yours on Aniverse!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-8">
      {/* Archetype Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan/30 bg-gradient-to-br from-panel2 via-void to-panel p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-pink/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan/20 to-pink/20 border border-cyan/40 text-5xl shadow-lg shadow-cyan/20 animate-pulse">
              {profile.archetype.badge}
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-cyan font-semibold">
                Your Anime Persona Archetype
              </span>
              <h1 className="mt-1 font-display text-3xl sm:text-5xl text-ink tracking-wide">
                {profile.archetype.title}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-ink-dim leading-relaxed">
                {profile.archetype.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={() => setCompareOpen(true)}
              className="btn-secondary flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"
            >
              <span>🧬 Taste Radar Comparison</span>
            </button>
            <button
              onClick={handleShare}
              className="btn-primary flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold"
            >
              <span>{copied ? "✓ Copied!" : "Share Anime DNA"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-5 text-center">
          <p className="font-display text-3xl sm:text-4xl text-cyan">{profile.totalHoursWatched}</p>
          <p className="mt-1 font-mono text-xs text-ink-dim uppercase tracking-wider">Hours Watched</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 text-center">
          <p className="font-display text-3xl sm:text-4xl text-pink">{profile.totalEpisodesWatched}</p>
          <p className="mt-1 font-mono text-xs text-ink-dim uppercase tracking-wider">Episodes Logged</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 text-center">
          <p className="font-display text-3xl sm:text-4xl text-emerald-400">{profile.completedTitles}</p>
          <p className="mt-1 font-mono text-xs text-ink-dim uppercase tracking-wider">Completed Anime</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 text-center">
          <p className="font-display text-3xl sm:text-4xl text-amber-400">
            {profile.averageRating ? `${profile.averageRating} ★` : "—"}
          </p>
          <p className="mt-1 font-mono text-xs text-ink-dim uppercase tracking-wider">Avg Score Given</p>
        </div>
      </div>

      {/* DNA Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genre Affinity Spectrum */}
        <div className="rounded-2xl border border-line bg-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-xl text-ink">Genre Affinity Matrix</h3>
              <p className="text-xs text-ink-dim">Based on your completed titles, watchlist, and ratings</p>
            </div>
            <span className="text-xl">🧬</span>
          </div>

          <div className="space-y-5">
            {profile.topGenres.map((genre) => (
              <div key={genre.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ink font-medium">{genre.name}</span>
                  <span className="text-cyan font-bold">{genre.percentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-panel2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan via-pink to-magenta transition-all duration-1000"
                    style={{ width: `${genre.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Viewing Insights */}
        <div className="rounded-2xl border border-line bg-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-xl text-ink">Viewing Habits</h3>
                <p className="text-xs text-ink-dim">Behavioral insights from your tracking history</p>
              </div>
              <span className="text-xl">📊</span>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-line/60 bg-panel2/60 p-4">
                <p className="text-xs font-mono text-ink-faint uppercase">Preferred Format</p>
                <p className="text-sm font-semibold text-ink mt-0.5">{profile.preferredEpisodeLength}</p>
              </div>
              <div className="rounded-xl border border-line/60 bg-panel2/60 p-4">
                <p className="text-xs font-mono text-ink-faint uppercase">Pacing Style</p>
                <p className="text-sm font-semibold text-ink mt-0.5">
                  {profile.completedTitles > 10 ? "Dedicated Binge Streamer" : "Thoughtful Episodic Watcher"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-line/60 flex items-center justify-between">
            <Link href="/ask" className="text-xs font-mono text-pink hover:underline flex items-center gap-1.5">
              <span>✨ Ask AI for recommendations based on this DNA →</span>
            </Link>
            <Link href="/app/library" className="text-xs font-mono text-cyan hover:underline">
              Manage Library →
            </Link>
          </div>
        </div>
      </div>

      {/* Archetype Evolution Timeline */}
      {Boolean(profile.evolutionTimeline && profile.evolutionTimeline.length > 0) && (
        <div className="rounded-3xl border border-line bg-panel p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="eyebrow mb-1">Historical Progression</p>
              <h3 className="font-display text-2xl text-ink">Archetype Evolution Timeline</h3>
              <p className="text-xs text-ink-dim">How your anime taste and watch volume have evolved over time</p>
            </div>
            <span className="font-mono text-xs text-cyan border border-cyan/30 rounded-full px-3 py-1 bg-cyan/10">
              Live Telemetry
            </span>
          </div>

          <div className="relative">
            {/* Timeline connection line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan via-pink to-purple-500 hidden sm:block" />

            <div className="space-y-6">
              {profile.evolutionTimeline.map((item, idx) => (
                <div
                  key={item.period + idx}
                  className="relative sm:pl-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-line/60 bg-panel2/50 p-4 sm:p-5 hover:border-cyan/40 transition-colors"
                >
                  {/* Timeline Badge Node */}
                  <div className="sm:absolute sm:left-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-void border border-cyan/40 text-lg shadow-sm">
                    {item.archetypeBadge}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-cyan">{item.period}</span>
                      <span className="text-xs font-semibold text-ink">{item.archetypeTitle}</span>
                    </div>
                    <p className="text-xs text-ink-dim mt-1">
                      Logged {item.episodes} episodes across this period ({item.hours} hours watched).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-ink-faint">
                    <span className="rounded-md bg-void px-2 py-1 border border-line">
                      {item.episodes} eps
                    </span>
                    <span className="rounded-md bg-void px-2 py-1 border border-line">
                      {item.hours} hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Taste Radar Comparison Modal */}
      <TasteComparisonModal
        userGenres={profile.topGenres}
        userArchetypeTitle={profile.archetype.title}
        userArchetypeBadge={profile.archetype.badge}
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  );
}
