"use client";

/**
 * Card-style "Share AniVerse" block — mirrors the mobile layout: circular
 * avatar, heading + subtext, single glowing CTA button. Uses the app's
 * existing cyan/pink theme tokens instead of hardcoded colors.
 *
 * The avatar is an original hand-drawn SVG — a generic "ninja-style" anime
 * character (spiky hair, whisker cheek marks, headband) evoking that genre
 * without copying any existing character's specific design. Swap it for an
 * <Image /> pointing at your own licensed/commissioned art whenever you have one.
 */

function OriginalAvatar() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <defs>
        <linearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--c-amber))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(var(--c-pink))" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="60" fill="url(#avatarBg)" />

      {/* face */}
      <ellipse cx="60" cy="72" rx="21" ry="23" fill="rgb(var(--c-panel2))" />

      {/* spiky blonde-toned hair */}
      <path
        d="M34 58c-3-4-3-10 1-13-2-5 1-10 5-11-1-4 2-8 6-8 1-4 5-6 9-5 3-3 8-3 11 0 4-1 8 1 9 5 4-1 7 3 6 8 4 1 7 6 5 11 4 3 4 9 1 13-3-8-8-13-15-15 2 5 1 10-2 14-3-9-9-14-17-14-2 5-1 10 2 14-7 0-13-5-15-14-3 2-5 5-6 15z"
        fill="rgb(var(--c-amber))"
      />

      {/* headband */}
      <rect x="37" y="55" width="46" height="7" rx="3.5" fill="rgb(var(--c-panel))" />
      <circle cx="60" cy="58.5" r="4.5" fill="rgb(var(--c-cyan))" />
      <path d="M83 56l14 4-14 3z" fill="rgb(var(--c-panel))" />

      {/* eyes */}
      <ellipse cx="52" cy="73" rx="2.6" ry="3.4" fill="rgb(var(--c-cyan))" />
      <ellipse cx="68" cy="73" rx="2.6" ry="3.4" fill="rgb(var(--c-cyan))" />

      {/* whisker marks */}
      <g stroke="rgb(var(--c-ink-dim))" strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
        <line x1="40" y1="79" x2="47" y2="78" />
        <line x1="40" y1="83" x2="47" y2="82" />
        <line x1="40" y1="87" x2="47" y2="86" />
        <line x1="80" y1="79" x2="73" y2="78" />
        <line x1="80" y1="83" x2="73" y2="82" />
        <line x1="80" y1="87" x2="73" y2="86" />
      </g>

      {/* mouth — mid-bite, cheeks puffed */}
      <path
        d="M55 90c2 2 8 2 10 0"
        stroke="rgb(var(--c-ink-dim))"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* food in hand, bottom-right */}
      <circle cx="82" cy="98" r="7" fill="rgb(var(--c-amber))" />
      <circle cx="82" cy="98" r="7" fill="none" stroke="rgb(var(--c-panel))" strokeWidth="1.5" />
    </svg>
  );
}

export default function ShareCard() {
  const url = typeof window !== "undefined" ? window.location.origin : "";

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "AniVerse",
          text: "Check out AniVerse — track anime, find where to watch it legally.",
          url,
        });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch {
      // clipboard API unavailable — no-op
    }
  }

  return (
    <section className="container-page py-6">
      <div className="relative overflow-hidden rounded-2xl border-l-4 border-cyan bg-panel px-6 py-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative h-32 w-32">
            {/* pulsing glow rings behind the avatar */}
            <span className="absolute inset-0 animate-ping rounded-full bg-cyan/25 [animation-duration:2.2s]" />
            <span className="absolute -inset-2 animate-pulse rounded-full bg-amber/20 blur-md" />
            <div className="relative h-full w-full overflow-hidden rounded-full ring-4 ring-cyan/50 shadow-[0_0_30px_rgb(var(--c-cyan)/0.45)]">
              <OriginalAvatar />
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl tracking-wide text-ink">
              Share AniVerse
            </h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-faint">
              to your friends
            </p>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="rounded-full bg-cyan px-8 py-3 font-display text-sm font-semibold tracking-wide text-void shadow-[0_0_20px_rgb(var(--c-cyan)/0.5)] transition-transform hover:scale-105 active:scale-95"
          >
            SHARE NOW
          </button>
        </div>
      </div>
    </section>
  );
}
