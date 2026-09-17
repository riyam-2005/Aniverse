"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { createClient } from "@/core/clients/supabase";
import GoogleIcon from "@/components/icons/GoogleIcon";
import PhoneAuthForm from "@/components/features/auth/PhoneAuthForm";

const REMEMBER_KEY = "aniverse:rememberedEmail";

export default function LoginForm({
  hasGoogle = true,
}: {
  hasGoogle?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/app/library";

  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) setEmail(saved);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (rememberMe) {
      window.localStorage.setItem(REMEMBER_KEY, email);
    } else {
      window.localStorage.removeItem(REMEMBER_KEY);
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.session) {
        const targetUrl =
          !callbackUrl || callbackUrl === "/login" || callbackUrl === "/register"
            ? "/app/library"
            : callbackUrl;

        window.location.href = targetUrl;
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
      }
    } catch {
      setError("Failed to start Google sign-in.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-line bg-panel/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/60">
      <h1 className="font-display text-4xl tracking-wide text-ink text-center">Sign in</h1>
      <p className="mt-1.5 text-center text-xs text-ink-dim">
        New here?{" "}
        <Link href="/register" className="text-pink font-semibold hover:underline">
          Create an account
        </Link>
      </p>

      {/* Auth Method Tabs */}
      <div className="mt-6 flex rounded-full border border-line bg-panel2 p-1">
        <button
          type="button"
          onClick={() => {
            setAuthMethod("email");
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all ${
            authMethod === "email"
              ? "bg-pink text-white shadow-pink-glow"
              : "text-ink-dim hover:text-ink"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <span>Email</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("phone");
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all ${
            authMethod === "phone"
              ? "bg-pink text-white shadow-pink-glow"
              : "text-ink-dim hover:text-ink"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
          </svg>
          <span>Phone SMS</span>
        </button>
      </div>

      <div className="mt-6">
        {authMethod === "phone" ? (
          <PhoneAuthForm mode="login" callbackUrl={callbackUrl} />
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-ink-dim mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-ink-dim mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label htmlFor="remember" className="flex items-center gap-2 text-xs text-ink-dim cursor-pointer">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-line bg-panel accent-pink"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-xs text-pink hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && <p className="text-xs text-pink">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm font-semibold">
              {loading ? "Signing in…" : "Sign in ➔"}
            </button>
          </form>
        )}
      </div>

      {hasGoogle && (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-panel2 py-2 text-xs font-semibold text-ink hover:border-white/30 hover:bg-panel3 transition-all"
          >
            <GoogleIcon />
            <span>Google</span>
          </button>
        </>
      )}

      <p className="mt-6 text-center text-[10px] leading-relaxed text-ink-faint">
        By continuing, you agree to AniVerse&apos;s{" "}
        <Link href="/terms" className="underline hover:text-ink-dim">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-ink-dim">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
