"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "aniverse:installDismissed";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for "already added to home screen".
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Custom install affordance for the PWA (see public/manifest.json +
 * public/sw.js). Chrome/Edge/Android fire `beforeinstallprompt`, which we
 * capture and defer so we can trigger it from our own styled button
 * instead of a random browser-chrome icon nobody notices. iOS Safari
 * never fires that event — there's no programmatic install API there —
 * so it gets a short "how to" hint instead, shown once.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default hidden until checked

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    if (isStandalone()) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIos()) setShowIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  // Small delay before the banner is allowed to render at all — avoids it
  // popping in at the exact same instant as the homepage's WelcomeBanner
  // and the two competing for the same corner of the screen.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setDeferredPrompt(null);
    setShowIosHint(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // non-fatal
    }
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="safe-bottom fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-line bg-panel/95 p-4 shadow-xl backdrop-blur-md sm:left-auto sm:right-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">📲</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Install AniVerse</p>
          <p className="mt-0.5 text-xs text-ink-dim">
            {deferredPrompt
              ? "Add it to your home screen for a faster, full-screen experience."
              : 'Tap the Share icon, then "Add to Home Screen".'}
          </p>
          {deferredPrompt && (
            <button
              onClick={install}
              className="mt-3 rounded-full bg-cyan px-4 py-1.5 text-xs font-semibold text-void transition-opacity hover:opacity-90"
            >
              Install
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
