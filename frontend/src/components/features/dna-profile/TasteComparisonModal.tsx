"use client";

import { useState, useMemo } from "react";
import type { GenreAffinity } from "@/features/dna-engine/dna.service";

interface TasteArchetypePreset {
  key: string;
  name: string;
  badge: string;
  description: string;
  genres: Record<string, number>;
}

const COMPARISON_PRESETS: TasteArchetypePreset[] = [
  {
    key: "mastermind",
    name: "The Mastermind Strategist",
    badge: "🧠",
    description: "Prioritizes high-stakes intellectual battles, psychological tension, and multi-layered plots.",
    genres: {
      Psychological: 95,
      Mystery: 90,
      Thriller: 88,
      Drama: 75,
      "Sci-Fi": 70,
      Action: 50,
      "Slice of Life": 35,
      Romance: 30,
    },
  },
  {
    key: "shonen",
    name: "The Shonen Champion",
    badge: "🔥",
    description: "Thrives on hype sakuga animation, heroic perseverance, tournament arcs, and power escalation.",
    genres: {
      Action: 98,
      Adventure: 92,
      Supernatural: 85,
      Fantasy: 80,
      Comedy: 65,
      Drama: 50,
      Psychological: 45,
      Romance: 35,
    },
  },
  {
    key: "wholesome",
    name: "The Wholesome Philosopher",
    badge: "☕",
    description: "Values heartfelt human connections, comforting atmospheres, and intimate character drama.",
    genres: {
      "Slice of Life": 96,
      Romance: 92,
      Comedy: 85,
      Drama: 78,
      Fantasy: 55,
      Action: 30,
      Psychological: 35,
      Thriller: 20,
    },
  },
  {
    key: "cybernetic",
    name: "The Cybernetic Visionary",
    badge: "⚡",
    description: "Fascinated by futuristic speculative fiction, neon cyber aesthetics, AI, and mecha.",
    genres: {
      "Sci-Fi": 96,
      Mecha: 90,
      Action: 82,
      Thriller: 78,
      Psychological: 75,
      Drama: 60,
      Fantasy: 40,
      "Slice of Life": 30,
    },
  },
  {
    key: "community",
    name: "Community Otaku Average",
    badge: "🌟",
    description: "Aggregated taste vector of active AniVerse community members across all seasons.",
    genres: {
      Action: 85,
      Fantasy: 78,
      Comedy: 74,
      Drama: 72,
      Adventure: 70,
      "Sci-Fi": 65,
      Romance: 60,
      Psychological: 58,
    },
  },
];

export default function TasteComparisonModal({
  userGenres,
  userArchetypeTitle,
  userArchetypeBadge,
  isOpen,
  onClose,
}: {
  userGenres: GenreAffinity[];
  userArchetypeTitle: string;
  userArchetypeBadge: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("mastermind");
  const [copied, setCopied] = useState(false);

  const selectedPreset = useMemo(
    () => COMPARISON_PRESETS.find((p) => p.key === selectedPresetKey) || COMPARISON_PRESETS[0],
    [selectedPresetKey]
  );

  // Compute Compatibility Score (0 - 100%)
  const { compatibilityScore, affinityTier, sharedHighlights } = useMemo(() => {
    const userMap: Record<string, number> = {};
    for (const g of userGenres) {
      userMap[g.name] = g.percentage;
    }

    const presetMap = selectedPreset.genres;
    const allGenreNames = Array.from(
      new Set([...Object.keys(userMap), ...Object.keys(presetMap)])
    );

    let totalDiff = 0;
    let comparisons = 0;
    const shared: string[] = [];

    for (const name of allGenreNames) {
      const uVal = userMap[name] ?? 40;
      const pVal = presetMap[name] ?? 40;
      const diff = Math.abs(uVal - pVal);
      totalDiff += diff;
      comparisons++;

      if (uVal >= 65 && pVal >= 65) {
        shared.push(name);
      }
    }

    const avgDiff = comparisons > 0 ? totalDiff / comparisons : 20;
    const score = Math.max(42, Math.min(99, Math.round(100 - avgDiff * 0.95)));

    let tier = "Complementary Exploration";
    if (score >= 88) tier = "Cosmic Synergy ✨";
    else if (score >= 75) tier = "Strong Harmonic Resonance 🧬";
    else if (score >= 60) tier = "Shared Horizon 🤝";

    return {
      compatibilityScore: score,
      affinityTier: tier,
      sharedHighlights: shared.slice(0, 3),
    };
  }, [userGenres, selectedPreset]);

  function handleShareComparison() {
    const shareText = `🧬 AniVerse Taste Radar: I have a ${compatibilityScore}% match with "${selectedPreset.name}" (${selectedPreset.badge})! Shared loves: ${sharedHighlights.join(", ")}. Compare your Anime DNA on AniVerse!`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-splash-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-line bg-panel p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow ambient backdrops */}
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-cyan/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-pink/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-line/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧬</span>
              <h2 className="font-display text-2xl sm:text-3xl text-ink">Taste Radar Comparison</h2>
            </div>
            <p className="text-xs text-ink-dim mt-0.5">
              Side-by-side anime compatibility index & genre spectrum alignment
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full h-8 w-8 flex items-center justify-center border border-line text-ink-dim hover:text-ink hover:border-pink/50 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Preset Selector */}
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-faint block mb-2">
              Compare With Persona or Community:
            </label>
            <div className="flex flex-wrap gap-2">
              {COMPARISON_PRESETS.map((preset) => {
                const isActive = preset.key === selectedPresetKey;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setSelectedPresetKey(preset.key)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-cyan text-slate-950 shadow-md shadow-cyan/20 scale-105"
                        : "bg-panel2 text-ink-dim hover:text-ink hover:bg-panel3 border border-line"
                    }`}
                  >
                    <span>{preset.badge}</span>
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compatibility Card */}
          <div className="rounded-2xl border border-cyan/30 bg-gradient-to-br from-panel2 via-void to-panel p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan/20 border border-cyan/40 text-2xl font-bold text-cyan shadow-sm">
                  {compatibilityScore}%
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-cyan font-bold">
                    Compatibility Index
                  </span>
                  <h4 className="text-base font-bold text-ink">{affinityTier}</h4>
                  <p className="text-xs text-ink-dim mt-0.5 leading-relaxed">
                    {selectedPreset.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleShareComparison}
                className="btn-primary text-xs py-2 px-4 rounded-full whitespace-nowrap self-end sm:self-center shrink-0"
              >
                {copied ? "✓ Copied!" : "Share Match"}
              </button>
            </div>

            {sharedHighlights.length > 0 && (
              <div className="mt-4 pt-3 border-t border-line/40 flex items-center gap-2 text-xs text-ink-dim">
                <span className="font-mono text-[11px] text-pink font-semibold">Resonant Loves:</span>
                <div className="flex flex-wrap gap-1.5">
                  {sharedHighlights.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-md bg-panel3 px-2 py-0.5 font-mono text-[11px] text-cyan border border-cyan/20"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side-by-Side Genre Spectrum */}
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-ink-faint border-b border-line/40 pb-2">
              <span className="flex items-center gap-1.5 text-cyan font-semibold">
                <span>{userArchetypeBadge}</span> You ({userArchetypeTitle})
              </span>
              <span className="flex items-center gap-1.5 text-pink font-semibold">
                <span>{selectedPreset.badge}</span> {selectedPreset.name}
              </span>
            </div>

            <div className="space-y-3.5">
              {Object.entries(selectedPreset.genres).map(([genreName, presetVal]) => {
                const userVal =
                  userGenres.find((g) => g.name.toLowerCase() === genreName.toLowerCase())?.percentage ?? 40;

                return (
                  <div key={genreName} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-cyan font-medium">{userVal}%</span>
                      <span className="text-ink font-semibold text-[11px]">{genreName}</span>
                      <span className="text-pink font-medium">{presetVal}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 h-2 w-full rounded-full bg-panel2 overflow-hidden">
                      {/* User side (right-aligned to center) */}
                      <div className="flex justify-end bg-panel2">
                        <div
                          className="h-full bg-cyan rounded-l-full transition-all duration-500"
                          style={{ width: `${userVal}%` }}
                        />
                      </div>
                      {/* Target preset side (left-aligned from center) */}
                      <div className="bg-panel2">
                        <div
                          className="h-full bg-pink rounded-r-full transition-all duration-500"
                          style={{ width: `${presetVal}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-line/60 flex items-center justify-between">
          <p className="font-mono text-[10px] text-ink-faint">
            Calculated over multi-dimensional genre telemetry
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line bg-panel2 px-4 py-1.5 text-xs text-ink hover:text-cyan hover:border-cyan/40 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
