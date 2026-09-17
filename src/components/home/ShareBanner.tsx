"use client";

import { useState } from "react";

export default function ShareBanner() {
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: "AniVerse — Your AI Anime Companion",
    text: "Discover, track, and explore anime with AI-powered recommendations on AniVerse!",
    url: typeof window !== "undefined" ? window.location.origin : "https://aniverse.me",
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Dismissed
      }
    } else {
      copyLink();
    }
  };

  const copyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openPopup = (url: string) => {
    window.open(url, "_blank", "width=600,height=450,noopener,noreferrer");
  };

  return (
    <div className="border-b border-line bg-panel/40 py-2.5">
      <div className="container-page flex flex-wrap items-center justify-between gap-3">
        {/* Left text */}
        <div className="flex items-center gap-3">
          <span className="text-pink animate-pulse text-sm">✦</span>
          <div>
            <p className="text-xs font-semibold text-ink">
              Share <span className="text-pink font-bold">ANIVERSE</span> with your friends
            </p>
            <p className="font-mono text-[10px] text-ink-faint">
              Join thousands of anime fans tracking their favorite series
            </p>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Discord */}
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1 text-xs text-ink-dim hover:text-[#5865F2] hover:border-[#5865F2]/40 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="font-semibold text-[11px]">Discord</span>
          </a>

          {/* X / Twitter */}
          <button
            type="button"
            onClick={() =>
              openPopup(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  "Tracking my anime on AniVerse! Check it out:"
                )}&url=${encodeURIComponent(shareData.url)}`
              )
            }
            className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1 text-xs text-ink-dim hover:text-white hover:border-white/40 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="font-semibold text-[11px]">X / Twitter</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() =>
              openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`)
            }
            className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1 text-xs text-ink-dim hover:text-[#1877F2] hover:border-[#1877F2]/40 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.704 0-1.107.135-1.384.341-.448.334-.582.91-.582 1.884v1.755h4.19l-.578 3.667h-3.612v7.98h-4.707z"/>
            </svg>
            <span className="font-semibold text-[11px]">Facebook</span>
          </button>

          {/* Reddit */}
          <button
            type="button"
            onClick={() =>
              openPopup(`https://reddit.com/submit?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}`)
            }
            className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1 text-xs text-ink-dim hover:text-[#FF4500] hover:border-[#FF4500]/40 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.336.336 0 0 0-.232-.094z"/>
            </svg>
            <span className="font-semibold text-[11px]">Reddit</span>
          </button>

          {/* Share / Copy */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-lg border border-pink/30 bg-pink/15 px-3 py-1 text-xs text-pink hover:bg-pink/25 hover:shadow-pink-glow transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
            <span className="font-semibold text-[11px]">{copied ? "Copied Link! ✓" : "Share"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
