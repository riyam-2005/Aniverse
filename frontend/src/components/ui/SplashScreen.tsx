"use client";

import { useEffect, useState } from "react";

// Same particle layout (position/delay/color) as the original static site's
// splash screen, just driven by Tailwind's particle-float animation instead
// of raw inline @keyframes.
const PARTICLES = [
  { top: "20%", left: "10%", delay: "0s", color: "bg-pink" },
  { top: "40%", left: "80%", delay: "0.5s", color: "bg-pink" },
  { top: "70%", left: "30%", delay: "1s", color: "bg-amber" },
  { top: "30%", left: "60%", delay: "1.5s", color: "bg-cyan" },
  { top: "80%", left: "70%", delay: "0.3s", color: "bg-pink" },
  { top: "15%", left: "50%", delay: "0.8s", color: "bg-amber" },
  { top: "60%", left: "15%", delay: "1.2s", color: "bg-cyan" },
  { top: "50%", left: "90%", delay: "0.6s", color: "bg-pink" },
];

const AUTO_DISMISS_MS = 2200;
const SESSION_KEY = "aniverse-splash-shown";

export default function SplashScreen() {
  // Start as "not shown" on the server so there's no hydration mismatch;
  // decide whether to actually show it once we're on the client and can
  // check sessionStorage.
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Show once per browser tab session — a fresh visit gets the splash,
    // clicking around the site afterward doesn't trigger it again. Remove
    // this check (and the sessionStorage.setItem below) if you'd rather it
    // play on every full page load instead.
    if (sessionStorage.getItem(SESSION_KEY)) return;

    setVisible(true);
    sessionStorage.setItem(SESSION_KEY, "1");

    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setExiting(true);
    // Match the CSS transition duration below before unmounting entirely.
    setTimeout(() => setVisible(false), 400);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Loading AniVerse"
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-void transition-opacity duration-[400ms] ${
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={`absolute h-2 w-2 rounded-full ${p.color} animate-particle-float`}
            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
          />
        ))}
      </div>

      <div className="animate-splash-in text-center">
        <p className="font-display text-5xl tracking-wide text-ink sm:text-7xl">
          Hi <span className="text-pink">Anime!</span>
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.25em] text-ink-dim sm:text-sm">
          Your gateway to the anime universe
        </p>
      </div>
    </div>
  );
}
