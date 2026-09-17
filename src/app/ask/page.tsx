import type { Metadata } from "next";
import AskAniverseChat from "@/components/features/ai-chat/AskAniverseChat";

export const metadata: Metadata = {
  title: "Ask Aniverse — AI Anime Companion",
  description: "Get personalized, non-hallucinated anime recommendations powered by AI and real MyAnimeList data.",
};

export default function AskPage() {
  return (
    <div className="container-page py-6 sm:py-10">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <p className="eyebrow mb-1">AI Anime Discovery</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink">
          Ask <span className="text-pink">Aniverse</span>
        </h1>
        <p className="mt-2 text-sm text-ink-dim">
          Describe your mood, favorite tropes, or reference shows. Our AI reasons over thousands of verified anime to find your perfect match.
        </p>
      </div>

      <AskAniverseChat />
    </div>
  );
}
