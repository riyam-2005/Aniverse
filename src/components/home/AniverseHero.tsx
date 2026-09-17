"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
  "Recommend me anime",
  "Top anime this season",
  "Good romance anime",
  "Anime like Jujutsu Kaisen",
];

export default function AniverseHero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/ask?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (text: string) => {
    router.push(`/ask?q=${encodeURIComponent(text)}`);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-pink/20 bg-gradient-to-r from-[#120F24] via-[#17132F] to-[#0A0915] p-6 sm:p-10 shadow-2xl shadow-black/80">
      {/* Background glow meshes */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-pink/15 blur-[100px]" />
      <div className="pointer-events-none absolute right-10 -bottom-20 h-80 w-80 rounded-full bg-purple/20 blur-[120px]" />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Left Column: AI Assistant Prompt */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-pink/30 bg-pink/10 px-3 py-1 text-xs font-semibold text-pink mb-3 shadow-pink-glow">
              <span>✦</span>
              <span>AI Anime Companion</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wide text-ink font-bold leading-tight">
              Hi! I&apos;m <span className="text-pink text-transparent bg-clip-text bg-gradient-to-r from-pink to-[#FF6BA8]">Aniverse</span> ✦
            </h1>
            <p className="mt-2 text-base sm:text-lg text-ink-dim font-medium">
              Ask me anything about anime! I learn your taste to find your next favorite show.
            </p>
          </div>

          {/* Search / AI Query Box */}
          <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. I want something like Attack on Titan"
              className="w-full rounded-2xl border border-white/10 bg-[#0E0C1B]/90 py-4 pl-5 pr-16 text-sm sm:text-base text-ink placeholder-ink-faint shadow-inner backdrop-blur-md transition-all focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/40 focus:shadow-pink-glow"
            />
            <button
              type="submit"
              aria-label="Ask Aniverse AI"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-xl bg-pink text-white shadow-pink-glow transition-all hover:bg-pink-dim hover:scale-105 active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </form>

          {/* Quick Prompt Suggestion Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                className="rounded-full border border-white/10 bg-panel2/80 px-3.5 py-1.5 text-xs text-ink-dim hover:text-pink hover:border-pink/40 hover:bg-pink/10 transition-all active:scale-95"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Character Visual Artwork */}
        <div className="relative flex justify-center lg:justify-end items-center">
          {/* Subtle star particle glow */}
          <div className="relative h-[280px] sm:h-[360px] lg:h-[420px] w-full max-w-[480px]">
            <Image
              src="/images/aniverse-hero-companion.png"
              alt="Aniverse AI Companion"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-contain drop-shadow-[0_15px_35px_rgba(255,46,116,0.3)] transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
