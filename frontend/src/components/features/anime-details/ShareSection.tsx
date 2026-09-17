"use client";

function ShareIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  telegram:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  whatsapp:
    "M17 14.2c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.2-.6.9-.8 1.1-.1.2-.3.2-.6.1-.7-.4-1.5-.9-2.1-1.6-.5-.6-1-1.2-1.4-1.9-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2.2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.3 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z",
  reddit:
    "M22 12c0-1.1-.9-2-2-2-.5 0-1 .2-1.3.5-1.3-.9-3.1-1.5-5-1.6l.9-4 2.8.6c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5S19.6 4 18.8 4c-.6 0-1.1.3-1.3.9l-3.1-.7c-.2 0-.3.1-.4.2l-1 4.5c-1.9.1-3.6.7-5 1.6-.3-.3-.8-.5-1.3-.5-1.1 0-2 .9-2 2 0 .8.5 1.5 1.1 1.8-.1.3-.1.6-.1.9 0 2.8 3.3 5 7.3 5s7.3-2.2 7.3-5c0-.3 0-.6-.1-.9.7-.3 1.2-1 1.2-1.8zM7.5 13.5c0-.6.5-1 1-1s1 .4 1 1-.5 1-1 1-1-.4-1-1zm7 3c-.9.7-2.2 1-3.5 1s-2.6-.3-3.5-1c-.1-.1-.1-.3 0-.4.1-.1.3-.1.4 0 .8.6 1.9.9 3.1.9s2.3-.3 3.1-.9c.1-.1.3-.1.4 0 .1.1.1.3 0 .4zm-.3-2c-.6 0-1-.4-1-1s.5-1 1-1 1 .4 1 1-.4 1-1 1z",
  facebook:
    "M13.5 22v-8.3h2.8l.4-3.2h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2H10V22h3.5z",
  instagram:
    "M12 2c-2.7 0-3.1 0-4.1.1-1.1.1-1.9.2-2.5.5-.7.3-1.3.7-1.9 1.3-.6.6-1 1.2-1.3 1.9-.3.6-.4 1.4-.5 2.5C1.6 9.3 1.6 9.7 1.6 12.4s0 3.1.1 4.1c.1 1.1.2 1.9.5 2.5.3.7.7 1.3 1.3 1.9.6.6 1.2 1 1.9 1.3.6.3 1.4.4 2.5.5 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1.1-.1 1.9-.2 2.5-.5.7-.3 1.3-.7 1.9-1.3.6-.6 1-1.2 1.3-1.9.3-.6.4-1.4.5-2.5.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-1.1-.2-1.9-.5-2.5-.3-.7-.7-1.3-1.3-1.9-.6-.6-1.2-1-1.9-1.3-.6-.3-1.4-.4-2.5-.5C15.1 2 14.7 2 12 2zm0 1.8c2.6 0 2.9 0 4 .1.9.1 1.5.2 1.8.3.5.2.8.4 1.1.7.3.3.6.6.7 1.1.1.3.3.9.3 1.8.1 1.1.1 1.4.1 4s0 2.9-.1 4c-.1.9-.2 1.5-.3 1.8-.2.5-.4.8-.7 1.1-.3.3-.6.6-1.1.7-.3.1-.9.3-1.8.3-1.1.1-1.4.1-4 .1s-2.9 0-4-.1c-.9-.1-1.5-.2-1.8-.3-.5-.2-.8-.4-1.1-.7-.3-.3-.6-.6-.7-1.1-.1-.3-.3-.9-.3-1.8-.1-1.1-.1-1.4-.1-4s0-2.9.1-4c.1-.9.2-1.5.3-1.8.2-.5.4-.8.7-1.1.3-.3.6-.6 1.1-.7.3-.1.9-.3 1.8-.3 1.1-.1 1.4-.1 4-.1zm0 3.1a5.1 5.1 0 100 10.2 5.1 5.1 0 000-10.2zm0 8.4a3.3 3.3 0 110-6.6 3.3 3.3 0 010 6.6zm5.3-8.6a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z",
  link: "M3.9 12c0-1.7 1.4-3.1 3.1-3.1h4V7H7C4.2 7 2 9.2 2 12s2.2 5 5 5h4v-1.9H7c-1.7 0-3.1-1.4-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.7 0 3.1 1.4 3.1 3.1S18.7 15.1 17 15.1h-4V17h4c2.8 0 5-2.2 5-5s-2.2-5-5-5z",
};

export default function ShareSection() {
  const url = typeof window !== "undefined" ? window.location.origin : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch {
      // clipboard API unavailable
    }
  }

  async function shareToInstagram() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AniVerse", url });
        return;
      } catch {
        // user cancelled
      }
    }
    await copyLink();
    alert("Link copied! Paste it into your Instagram story, bio, or message.");
  }

  const links = [
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out AniVerse — your AI-powered anime companion!")}`,
      icon: ICONS.telegram,
      color: "#229ED9",
      bgHover: "hover:border-[#229ED9]/50 hover:bg-[#229ED9]/10",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out AniVerse — your AI anime companion!")}`,
      icon: ICONS.x,
      color: "#FFFFFF",
      bgHover: "hover:border-white/50 hover:bg-white/10",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: ICONS.facebook,
      color: "#1877F2",
      bgHover: "hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10",
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`Check out AniVerse — ${url}`)}`,
      icon: ICONS.whatsapp,
      color: "#25D366",
      bgHover: "hover:border-[#25D366]/50 hover:bg-[#25D366]/10",
    },
    {
      name: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent("AniVerse — AI-Powered Anime Companion & Tracker")}`,
      icon: ICONS.reddit,
      color: "#FF4500",
      bgHover: "hover:border-[#FF4500]/50 hover:bg-[#FF4500]/10",
    },
  ];

  return (
    <section className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-line bg-panel/80 p-6 sm:p-8 backdrop-blur-sm shadow-lg">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-2">
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-pink to-cyan inline-block" />
            Spread the word
          </p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wide text-ink">
            Share AniVerse with a friend
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              title={`Share on ${l.name}`}
              aria-label={`Share on ${l.name}`}
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-line/80 bg-panel2/80 text-ink-dim transition-all hover:scale-110 active:scale-95 shadow-sm ${l.bgHover}`}
            >
              <span style={{ color: l.color }}>
                <ShareIcon path={l.icon} />
              </span>
            </a>
          ))}

          <button
            type="button"
            onClick={shareToInstagram}
            title="Share on Instagram"
            aria-label="Share on Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line/80 bg-panel2/80 text-ink-dim transition-all hover:scale-110 active:scale-95 hover:border-[#E1306C]/50 hover:bg-[#E1306C]/10 shadow-sm"
          >
            <span style={{ color: "#E1306C" }}>
              <ShareIcon path={ICONS.instagram} />
            </span>
          </button>

          <button
            type="button"
            onClick={copyLink}
            title="Copy link"
            aria-label="Copy link"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line/80 bg-panel2/80 text-ink-dim transition-all hover:scale-110 active:scale-95 hover:border-cyan/50 hover:bg-cyan/10 hover:text-cyan shadow-sm"
          >
            <ShareIcon path={ICONS.link} />
          </button>
        </div>
      </div>
    </section>
  );
}
