"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SEEN_KEY = "aniverse:welcomeSeen";

/**
 * Replaces the old full-screen "prove you're not a robot" gate that used
 * to block the homepage on first visit. That approach had two real
 * problems: it added a CAPTCHA challenge for every single visitor just to
 * see the site (most of whom are humans, not bots — actual abuse is
 * already handled at the points that matter: registration and comment/
 * review rate-limiting), and because it tracked "seen" via localStorage,
 * anyone browsing in a private/incognito window got the full checkbox
 * challenge again every single session, since incognito storage never
 * persists.
 *
 * This is a plain, dismissible, non-blocking welcome banner instead — no
 * verification step, so there's nothing to be annoying about in
 * incognito. It uses sessionStorage (not localStorage) on purpose: it
 * reappears once per new browser session (a fresh tab, a fresh incognito
 * window) but won't nag someone repeatedly within the same visit as they
 * click around the site.
 */
export default function WelcomeBanner({ signedIn }: { signedIn: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (signedIn) return;
    try {
      if (!window.sessionStorage.getItem(SEEN_KEY)) {
        setVisible(true);
      }
    } catch {
      // Storage can throw in some locked-down private-browsing modes —
      // fail safe by just not showing the banner rather than crashing.
    }
  }, [signedIn]);

  function dismiss() {
    setVisible(false);
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Same as above — non-fatal if storage is unavailable.
    }
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 px-4 py-4 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-2xl sm:border sm:shadow-xl"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">👋</span>
        <div className="flex-1">
          <p className="font-display text-lg tracking-wide text-ink">Hi, anime fan!</p>
          <p className="mt-0.5 text-sm text-ink-dim">
            Create a free account to track your watchlist and get episode alerts — or just keep browsing.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/register"
              onClick={dismiss}
              className="rounded-full bg-cyan px-4 py-1.5 text-xs font-semibold text-void transition-opacity hover:opacity-90"
            >
              Create account
            </Link>
            <button
              onClick={dismiss}
              className="rounded-full border border-line px-4 py-1.5 text-xs text-ink-dim transition-colors hover:text-ink"
            >
              Keep browsing
            </button>
          </div>
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
