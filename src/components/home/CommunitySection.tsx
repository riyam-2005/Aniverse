"use client";

import { useState } from "react";
import Link from "next/link";

interface CommentItem {
  id: string;
  author: string;
  avatar?: string;
  role: "ADMIN" | "USER" | "MOD";
  timeAgo: string;
  text: string;
  animeTitle: string;
  animeId: number;
}

const DEFAULT_COMMENTS: CommentItem[] = [
  {
    id: "1",
    author: "nat1k",
    role: "ADMIN",
    timeAgo: "22m ago",
    text: "ep 28 was insane 🔥 the studio completely outdid themselves!",
    animeTitle: "Solo Leveling",
    animeId: 52299,
  },
  {
    id: "2",
    author: "Kira_99",
    role: "USER",
    timeAgo: "45m ago",
    text: "okay this plot twist was smth else 💀 did not expect that reveal!",
    animeTitle: "Attack on Titan",
    animeId: 16498,
  },
  {
    id: "3",
    author: "Sigma_fr",
    role: "ADMIN",
    timeAgo: "1h ago",
    text: "Soundtrack during the final showdown gave me absolute chills. 10/10.",
    animeTitle: "Jujutsu Kaisen",
    animeId: 40748,
  },
  {
    id: "4",
    author: "Aoi_san",
    role: "USER",
    timeAgo: "2h ago",
    text: "Highly recommend checking out the manga too if you enjoyed this season!",
    animeTitle: "Chainsaw Man",
    animeId: 44511,
  },
];

export default function CommunitySection() {
  const [activeTab, setActiveTab] = useState<"newest" | "top">("newest");
  const [hidden, setHidden] = useState(false);

  return (
    <section className="container-page py-6">
      {/* Header controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("newest")}
            className={`text-sm font-semibold transition-colors ${
              activeTab === "newest"
                ? "text-pink font-bold border-b-2 border-pink pb-1 -mb-[13px]"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            Newest Comments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("top")}
            className={`text-sm font-semibold transition-colors ${
              activeTab === "top"
                ? "text-pink font-bold border-b-2 border-pink pb-1 -mb-[13px]"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            Top Comments
          </button>
        </div>

        {/* Hide comments switch */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-faint">Hide Comments</span>
          <button
            type="button"
            role="switch"
            aria-checked={hidden}
            onClick={() => setHidden((prev) => !prev)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              hidden ? "bg-pink" : "bg-panel2"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                hidden ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Cards list */}
      {!hidden && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEFAULT_COMMENTS.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-2xl border border-line bg-panel p-4 transition-all hover:border-pink/30 hover:bg-panel2 hover:shadow-lg"
            >
              <div>
                {/* Author row */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink/20 font-mono text-xs font-bold text-pink">
                    {item.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-ink">
                        {item.author}
                      </span>
                      {item.role === "ADMIN" && (
                        <span className="rounded bg-pink/20 px-1 py-0.2 font-mono text-[9px] font-bold uppercase text-pink">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-ink-faint">
                      {item.timeAgo}
                    </span>
                  </div>
                </div>

                {/* Comment quote text */}
                <p className="line-clamp-3 text-xs leading-relaxed text-ink-dim italic group-hover:text-ink transition-colors">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              {/* Anime title footer badge */}
              <Link
                href={`/anime/${item.animeId}`}
                className="mt-3.5 flex items-center gap-1.5 rounded-lg border border-line bg-panel2/80 px-2.5 py-1 text-[11px] text-ink-dim hover:text-pink hover:border-pink/30 transition-colors"
              >
                <span className="text-pink">📺</span>
                <span className="truncate font-medium">{item.animeTitle}</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
