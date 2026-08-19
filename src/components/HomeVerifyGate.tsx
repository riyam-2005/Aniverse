"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement,
        params: {
          sitekey: string;
          theme?: "light" | "dark";
          callback: (token: string) => void;
          "expired-callback": () => void;
        }
      ) => void;
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const SEEN_KEY = "aniverse:gatePassed";

/**
 * A one-time reCAPTCHA check on the home screen only — not on login or
 * register, which have their own separate flows (register already has
 * its own captcha in RegisterForm; login has none by design).
 *
 * Deliberately NOT styled like a raw embedded ad widget (bright green
 * box, no branding, sitting on top of unrelated content) — that pattern
 * reads as a malicious overlay on piracy sites, which is exactly what it
 * often is there. This uses the same underlying Google reCAPTCHA v2
 * checkbox, just in a plain card that matches the rest of the site and
 * is clearly labeled as ours.
 */
export default function HomeVerifyGate() {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaRendered = useRef(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
  if (!RECAPTCHA_SITE_KEY) return;
  try {
    if (!window.sessionStorage.getItem(SEEN_KEY)) setVisible(true);
  } catch {
    setVisible(true);
  }
}, []);

useEffect(() => {
  if (!RECAPTCHA_SITE_KEY || !visible) return;

  const tryRender = () => {
    if (captchaRendered.current || !captchaRef.current) return;
    if (!window.grecaptcha || typeof window.grecaptcha.render !== "function") return;
    window.grecaptcha.render(captchaRef.current, {
      sitekey: RECAPTCHA_SITE_KEY,
      theme: "dark",
      callback: (token: string) => {
        tokenRef.current = token;
        setError(null);
      },
      "expired-callback": () => {
        tokenRef.current = null;
      },
    });
    captchaRendered.current = true;
  };

  const interval = setInterval(() => {
    tryRender();
    if (captchaRendered.current) clearInterval(interval);
  }, 300);

  return () => clearInterval(interval);
}, [visible]);

  async function onContinue() {
    if (!tokenRef.current) {
      setError("Please check the box to verify you're human.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/verify-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "Verification failed. Please try again.");
        setVerifying(false);
        return;
      }
      setVisible(false);
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // non-fatal — worst case the gate shows again next load
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setVerifying(false);
    }
  }

  if (!RECAPTCHA_SITE_KEY || !visible) return null;

  return (
    <>
      <Script src="https://www.google.com/recaptcha/api.js?render=explicit" />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 text-center shadow-2xl">
          <p className="eyebrow mb-2 justify-center">Quick check</p>
          <h2 className="font-display text-2xl tracking-wide text-ink">Verify to continue</h2>
          <p className="mt-1.5 text-sm text-ink-dim">
            One quick check to keep bots off AniVerse — this only happens once per visit.
          </p>

          <div className="mt-5 flex justify-center">
            <div ref={captchaRef} />
          </div>

          {error && <p className="mt-3 text-sm text-pink">{error}</p>}

          <button
            onClick={onContinue}
            disabled={verifying}
            className="btn-primary mt-5 w-full disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Continue to AniVerse"}
          </button>
        </div>
      </div>
    </>
  );
}
