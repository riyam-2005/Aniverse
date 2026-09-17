"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/core/clients/supabase";
import PasswordChecklist, { getPasswordRules } from "./PasswordChecklist";
import GoogleIcon from "@/components/icons/GoogleIcon";
import PhoneAuthForm from "@/components/features/auth/PhoneAuthForm";

export default function RegisterForm({
  hasGoogle = true,
}: {
  hasGoogle?: boolean;
}) {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const passwordRules = getPasswordRules(password);
  const passwordValid = passwordRules.every((r) => r.met);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setPasswordTouched(true);
      setError("Your password doesn't meet the requirements below yet.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            username: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Failed to create account.");
        setLoading(false);
        return;
      }

      if (data.session) {
        window.location.href = "/onboarding";
      } else {
        router.push("/login?message=check_email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    try {
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/onboarding`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
      }
    } catch {
      setError("Failed to start Google signup.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-line bg-panel/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/60">
      <h1 className="font-display text-4xl tracking-wide text-ink text-center">Create account</h1>
      <p className="mt-1.5 text-center text-xs text-ink-dim">
        Already have one?{" "}
        <Link href="/login" className="text-pink font-semibold hover:underline">
          Sign in
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
          <PhoneAuthForm mode="register" callbackUrl="/onboarding" />
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-ink-dim mb-1">
                Your Name
              </label>
              <input
                id="name"
                required
                autoComplete="name"
                placeholder="What should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
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
                autoComplete="new-password"
                minLength={8}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordTouched(true)}
                className="input"
              />
              {passwordTouched && <PasswordChecklist password={password} />}
            </div>

            {error && <p className="text-xs text-pink">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm font-semibold">
              {loading ? "Creating account…" : "Create account ➔"}
            </button>
          </form>
        )}
      </div>

      {hasGoogle && (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              Or sign up with
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
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
