"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AskAniverseResult, GroundedRecommendation } from "@/features/ai-companion/ai.service";
import WatchlistButton from "@/components/features/watchlist/WatchlistButton";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  recommendations?: GroundedRecommendation[];
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Recommend something like Attack on Titan",
  "Short emotional anime under 13 episodes",
  "Psychological thriller with mind-bending twists",
  "Wholesome slice of life for the weekend",
  "Dark fantasy with insane animation",
];

export default function AskAniverseChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Konnichiwa! I am your AI Anime Companion. Tell me what vibe, genre, or show you loved, and I'll find your next obsession.",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(promptText?: string) {
    const textToSend = (promptText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const historyTurns = messages
      .filter((m) => m.id !== "welcome" && !m.id.startsWith("ai-err"))
      .slice(-6)
      .map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));

    setMessages((prev) => [...prev, userMessage]);
    if (!promptText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          history: historyTurns,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate recommendations");
      }

      const data: AskAniverseResult = await res.json();

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.message,
        recommendations: data.recommendations,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `⚠️ ${errorMessage}. Please try another question or slow down.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "Konnichiwa! I am your AI Anime Companion. Tell me what vibe, genre, or show you loved, and I'll find your next obsession.",
        timestamp: "Just now",
      },
    ]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto rounded-2xl border border-line bg-panel/40 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-void/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink to-cyan text-slate-950 font-bold shadow-md shadow-pink/20 text-lg">
            ✨
          </div>
          <div>
            <h2 className="font-display text-xl tracking-wide text-ink flex items-center gap-2">
              Ask Aniverse
              <span className="rounded bg-pink/20 px-2 py-0.5 font-mono text-[10px] text-pink border border-pink/30">
                AI Companion
              </span>
            </h2>
            <p className="text-xs text-ink-dim">Grounded multi-turn anime intelligence with contextual memory</p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="rounded-full border border-line bg-panel2/60 px-3 py-1.5 text-xs text-ink-dim hover:text-ink hover:border-pink/40 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-cyan/15 text-ink border border-cyan/30 rounded-tr-none shadow-sm"
                  : "bg-panel2/80 text-ink border border-line rounded-tl-none shadow-sm"
              }`}
            >
              <p>{msg.text}</p>

              {/* Render Anime Cards if present */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-line/60">
                  {msg.recommendations.map(({ anime, reason, matchScore }) => {
                    const title = anime.title_english || anime.title;
                    const poster = anime.images?.jpg?.image_url;
                    return (
                      <div
                        key={anime.mal_id}
                        className="group relative flex flex-col justify-between rounded-xl border border-line bg-void/80 p-3 hover:border-pink/50 transition-all"
                      >
                        <div className="flex gap-3">
                          <Link
                            href={`/anime/${anime.mal_id}`}
                            className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-panel border border-line/60"
                          >
                            {poster && (
                              <Image
                                src={poster}
                                alt={title}
                                fill
                                sizes="64px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[10px] text-cyan font-semibold">
                                {matchScore}% MATCH
                              </span>
                              {anime.score && (
                                <span className="font-mono text-[10px] text-amber-400">
                                  ★ {anime.score}
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/anime/${anime.mal_id}`}
                              className="font-medium text-xs text-ink hover:text-cyan line-clamp-1 mt-0.5"
                            >
                              {title}
                            </Link>
                            <p className="mt-1 text-[11px] text-ink-dim line-clamp-3 leading-snug">
                              {reason}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-line/40">
                          <Link
                            href={`/anime/${anime.mal_id}`}
                            className="text-[11px] font-mono text-cyan hover:underline"
                          >
                            Details →
                          </Link>
                          <WatchlistButton
                            malId={anime.mal_id}
                            title={title}
                            imageUrl={poster || ""}
                            totalEpisodes={anime.episodes || null}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <span className="mt-1 font-mono text-[10px] text-ink-faint px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-ink-dim text-xs bg-panel2/60 border border-line rounded-2xl px-4 py-3 w-fit">
            <span className="h-2 w-2 rounded-full bg-pink animate-ping" />
            <span>Aniverse is analyzing anime database and crafting recommendations…</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-line/60 bg-void/30 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] font-mono text-ink-faint shrink-0">Try:</span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="shrink-0 rounded-full border border-line bg-panel/80 px-3 py-1 text-xs text-ink-dim hover:text-pink hover:border-pink/40 transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-line p-3 sm:p-4 bg-void/80"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything (e.g. 'I loved Death Note but want something shorter with strategy')..."
          className="flex-1 rounded-full border border-line bg-panel px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-cyan focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary rounded-full px-5 py-2.5 text-xs font-semibold shrink-0 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}
