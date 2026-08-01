"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, type FormEvent, Suspense } from "react";
import GoogleIcon from "./icons/GoogleIcon";
import { useFirebasePhoneAuth } from "@/lib/useFirebasePhoneAuth";

const REMEMBER_KEY = "aniverse:rememberedEmail";

function LoginFormContent({
  hasGoogle,
  hasPhone = false,
}: {
  hasGoogle: boolean;
  hasPhone?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  const [mode, setMode] = useState<"email" | "phone">("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const {
    containerRef: recaptchaRef,
    codeSent,
    loading: phoneLoading,
    error: phoneError,
    setError: setPhoneError,
    sendCode,
    confirmCode,
    reset: resetPhone,
  } = useFirebasePhoneAuth();

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

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(
        res.error.toLowerCase().includes("too many")
          ? res.error
          : "Incorrect email or password."
      );
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    await sendCode(phone);
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();

    const idToken = await confirmCode(code);
    if (!idToken) return;

    const res = await signIn("phone", { idToken, redirect: false });

    if (res?.error) {
      setPhoneError(
        res.error.toLowerCase().includes("too many")
          ? res.error
          : "That code didn't work. Check it and try again."
      );
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-4xl tracking-wide text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-dim">
        New here?{" "}
        <Link href="/register" className="text-cyan hover:underline">
          Create an account
        </Link>
      </p>

      {hasGoogle && (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="btn-oauth mt-8"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              Or
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {hasPhone && (
        <div className={`mb-6 flex gap-1 rounded-full border border-line p-1 ${hasGoogle ? "" : "mt-8"}`}>
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`flex-1 rounded-full py-1.5 text-sm transition-colors ${
              mode === "email" ? "bg-cyan/10 text-cyan" : "text-ink-dim hover:text-ink"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={`flex-1 rounded-full py-1.5 text-sm transition-colors ${
              mode === "phone" ? "bg-cyan/10 text-cyan" : "text-ink-dim hover:text-ink"
            }`}
          >
            Phone
          </button>
        </div>
      )}

      {mode === "email" && (
        <form onSubmit={onSubmit} className={`space-y-4 ${hasGoogle || hasPhone ? "" : "mt-8"}`}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-pill"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-pill"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="remember" className="flex items-center gap-2 text-sm text-ink-dim">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-line bg-panel accent-cyan"
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-xs text-cyan hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-sm text-pink">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full rounded-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      {mode === "phone" && (
        <form
          onSubmit={codeSent ? verifyCode : handleSendCode}
          className={`space-y-4 ${hasGoogle || hasPhone ? "" : "mt-8"}`}
        >
          <div ref={recaptchaRef} />
          <div>
            <label htmlFor="phone" className="sr-only">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              required
              disabled={codeSent}
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-pill disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Include your country code, e.g. +1 for the US.
            </p>
          </div>

          {codeSent && (
            <div>
              <label htmlFor="code" className="sr-only">
                Verification code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                autoFocus
                placeholder="Enter the 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-pill"
              />
              <button
                type="button"
                onClick={() => {
                  resetPhone();
                  setCode("");
                }}
                className="mt-1.5 font-mono text-xs text-ink-faint hover:text-ink"
              >
                Use a different number
              </button>
            </div>
          )}

          {phoneError && <p className="text-sm text-pink">{phoneError}</p>}

          <button type="submit" disabled={phoneLoading} className="btn-primary w-full rounded-full">
            {phoneLoading
              ? codeSent
                ? "Verifying…"
                : "Sending code…"
              : codeSent
                ? "Verify & sign in"
                : "Send code"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-faint">
        By continuing, you agree to AniVerse&apos;s{" "}
        <Link href="/terms" className="underline hover:text-ink-dim">
          Terms of Service
        </Link>{" "}
        and acknowledge the{" "}
        <Link href="/privacy" className="underline hover:text-ink-dim">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginForm(props: { hasGoogle: boolean; hasPhone?: boolean }) {
  return (
    <Suspense fallback={null}>
      <LoginFormContent {...props} />
    </Suspense>
  );
}
