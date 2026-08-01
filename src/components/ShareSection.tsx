"use client";

function ShareIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  telegram: "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.93c-.24.24-.44.44-.82.44z",
  x: "M18.9 2H22l-7.2 8.2L23.2 22h-6.6l-5.2-6.8L5.4 22H2.3l7.7-8.8L1.2 2h6.8l4.7 6.2L18.9 2zM17.7 20h1.8L7.4 4H5.5l12.2 16z",
  whatsapp: "M17 14.2c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.2-.6.9-.8 1.1-.1.2-.3.2-.6.1-.7-.4-1.5-.9-2.1-1.6-.5-.6-1-1.2-1.4-1.9-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.3 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z",
  reddit: "M22 12c0-1.1-.9-2-2-2-.5 0-1 .2-1.3.5-1.3-.9-3.1-1.5-5-1.6l.9-4 2.8.6c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5S19.6 4 18.8 4c-.6 0-1.1.3-1.3.9l-3.1-.7c-.2 0-.3.1-.4.2l-1 4.5c-1.9.1-3.6.7-5 1.6-.3-.3-.8-.5-1.3-.5-1.1 0-2 .9-2 2 0 .8.5 1.5 1.1 1.8-.1.3-.1.6-.1.9 0 2.8 3.3 5 7.3 5s7.3-2.2 7.3-5c0-.3 0-.6-.1-.9.7-.3 1.2-1 1.2-1.8zM7.5 13.5c0-.6.5-1 1-1s1 .4 1 1-.5 1-1 1-1-.4-1-1zm7 3c-.9.7-2.2 1-3.5 1s-2.6-.3-3.5-1c-.1-.1-.1-.3 0-.4.1-.1.3-.1.4 0 .8.6 1.9.9 3.1.9s2.3-.3 3.1-.9c.1-.1.3-.1.4 0 .1.1.1.3 0 .4zm-.3-2c-.6 0-1-.4-1-1s.5-1 1-1 1 .4 1 1-.4 1-1 1z",
  facebook: "M13.5 22v-8.3h2.8l.4-3.2h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2H10V22h3.5z",
  instagram: "M12 2c-2.7 0-3.1 0-4.1.1-1.1.1-1.9.2-2.5.5-.7.3-1.3.7-1.9 1.3-.6.6-1 1.2-1.3 1.9-.3.6-.4 1.4-.5 2.5C1.6 9.3 1.6 9.7 1.6 12.4s0 3.1.1 4.1c.1 1.1.2 1.9.5 2.5.3.7.7 1.3 1.3 1.9.6.6 1.2 1 1.9 1.3.6.3 1.4.4 2.5.5 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1.1-.1 1.9-.2 2.5-.5.7-.3 1.3-.7 1.9-1.3.6-.6 1-1.2 1.3-1.9.3-.6.4-1.4.5-2.5.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-1.1-.2-1.9-.5-2.5-.3-.7-.7-1.3-1.3-1.9-.6-.6-1.2-1-1.9-1.3-.6-.3-1.4-.4-2.5-.5C15.1 2 14.7 2 12 2zm0 1.8c2.6 0 2.9 0 4 .1.9.1 1.5.2 1.8.3.5.2.8.4 1.1.7.3.3.6.6.7 1.1.1.3.3.9.3 1.8.1 1.1.1 1.4.1 4s0 2.9-.1 4c-.1.9-.2 1.5-.3 1.8-.2.5-.4.8-.7 1.1-.3.3-.6.6-1.1.7-.3.1-.9.3-1.8.3-1.1.1-1.4.1-4 .1s-2.9 0-4-.1c-.9-.1-1.5-.2-1.8-.3-.5-.2-.8-.4-1.1-.7-.3-.3-.6-.6-.7-1.1-.1-.3-.3-.9-.3-1.8-.1-1.1-.1-1.4-.1-4s0-2.9.1-4c.1-.9.2-1.5.3-1.8.2-.5.4-.8.7-1.1.3-.3.6-.6 1.1-.7.3-.1.9-.3 1.8-.3 1.1-.1 1.4-.1 4-.1zm0 3.1a5.1 5.1 0 100 10.2 5.1 5.1 0 000-10.2zm0 8.4a3.3 3.3 0 110-6.6 3.3 3.3 0 010 6.6zm5.3-8.6a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z",
  link: "M3.9 12c0-1.7 1.4-3.1 3.1-3.1h4V7H7C4.2 7 2 9.2 2 12s2.2 5 5 5h4v-1.9H7c-1.7 0-3.1-1.4-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.7 0 3.1 1.4 3.1 3.1S18.7 15.1 17 15.1h-4V17h4c2.8 0 5-2.2 5-5s-2.2-5-5-5z",
};

export default function ShareSection() {
  const url = typeof window !== "undefined" ? window.location.origin : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch {
      // clipboard API unavailable — no-op, the link is still visible to select manually
    }
  }

  async function shareToInstagram() {
    // Instagram has no web "share this link" intent like the others — the
    // only real option is the native share sheet (mobile) or copying the
    // link so it can be pasted into a bio/story/DM manually.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AniVerse", url });
        return;
      } catch {
        // user cancelled the share sheet — fall through to copy
      }
    }
    await copyLink();
    alert("Instagram doesn't support direct link sharing — link copied, paste it into your bio, story, or a DM!");
  }

  const links = [
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out AniVerse")}`,
      icon: ICONS.telegram,
      color: "#26A5E4",
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out AniVerse")}`,
      icon: ICONS.x,
      color: "#000000",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: ICONS.facebook,
      color: "#1877F2",
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`Check out AniVerse — ${url}`)}`,
      icon: ICONS.whatsapp,
      color: "#25D366",
    },
    {
      name: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent("AniVerse — track anime, find where to watch it legally")}`,
      icon: ICONS.reddit,
      color: "#FF4500",
    },
  ];

  return (
    <section className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-xl border border-line bg-panel px-6 py-8">
        <div>
          <p className="eyebrow mb-2">Spread the word</p>
          <h2 className="font-display text-2xl tracking-wide text-ink">
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
              aria-label={`Share on ${l.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-dim transition-colors hover:text-ink"
              style={{ borderColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = l.color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
            >
              <span style={{ color: l.color }}>
                <ShareIcon path={l.icon} />
              </span>
            </a>
          ))}
          <button
            type="button"
            onClick={shareToInstagram}
            aria-label="Share on Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-dim transition-colors hover:text-ink"
            style={{ borderColor: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#E1306C")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            <span style={{ color: "#E1306C" }}>
              <ShareIcon path={ICONS.instagram} />
            </span>
          </button>
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy link"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-dim transition-colors hover:border-cyan/50 hover:text-cyan"
          >
            <ShareIcon path={ICONS.link} />
          </button>
        </div>
      </div>
    </section>
  );
}
