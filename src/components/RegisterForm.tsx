"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import PasswordChecklist, { getPasswordRules } from "./PasswordChecklist";
import GoogleIcon from "./icons/GoogleIcon";
import { useFirebasePhoneAuth } from "@/lib/useFirebasePhoneAuth";

export default function RegisterForm({
  hasGoogle = false,
  hasPhone = false,
}: {
  hasGoogle?: boolean;
  hasPhone?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Once the account itself is created and the user is signed in, we
  // optionally show a second step offering to link+verify a phone number
  // (reuses /api/user/phone, same as /account/phone) before sending them
  // on to onboarding. Skippable — a phone number is never required to use
  // the site. The send-code/confirm-code exchange itself happens directly
  // between the browser and Firebase (see useFirebasePhoneAuth).
  const [step, setStep] = useState<"account" | "phone">("account");
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

  function goToOnboarding() {
    router.push("/onboarding");
    router.refresh();
  }

  async function sendPhoneCode(e: FormEvent) {
    e.preventDefault();
    await sendCode(phone);
  }

  async function verifyAndLinkPhone(e: FormEvent) {
    e.preventDefault();

    const idToken = await confirmCode(code);
    if (!idToken) return;

    try {
      const res = await fetch("/api/user/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPhoneError(data.error ?? "Couldn't link that number. Try again.");
        return;
      }
      goToOnboarding();
    } catch {
      setPhoneError("Something went wrong. Try again.");
    }
  }

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

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }

    if (hasPhone) {
      // Offer to link a phone number now that they're signed in (linking
      // requires a session — see /api/user/phone). Skippable.
      setStep("phone");
      return;
    }

    // New account, no watchlist yet — send them to pick a few genres so
    // the homepage has something to recommend on their first visit,
    // instead of straight to a homepage with an empty "Recommended" row.
    goToOnboarding();
  }

  if (step === "phone") {
    return (
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-4xl tracking-wide text-ink">Add a phone number</h1>
        <p className="mt-2 text-sm text-ink-dim">
          Optional — lets you sign in with a text code instead of your password. You can always
          add this later from account settings.
        </p>

        <form
          onSubmit={codeSent ? verifyAndLinkPhone : sendPhoneCode}
          className="mt-8 space-y-4"
        >
          <div ref={recaptchaRef} />
          <div>
            <label htmlFor="reg-phone" className="sr-only">
              Phone number
            </label>
            <input
              id="reg-phone"
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
              <label htmlFor="reg-code" className="sr-only">
                Verification code
              </label>
              <input
                id="reg-code"
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

          <button
            type="submit"
            disabled={phoneLoading}
            className="btn-primary w-full rounded-full"
          >
            {phoneLoading
              ? codeSent
                ? "Verifying…"
                : "Sending code…"
              : codeSent
                ? "Verify & continue"
                : "Send code"}
          </button>

          <button
            type="button"
            onClick={goToOnboarding}
            className="w-full text-center font-mono text-xs text-ink-faint hover:text-ink"
          >
            Skip for now
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-4xl tracking-wide text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-ink-dim">
        Already have one?{" "}
        <Link href="/login" className="text-cyan hover:underline">
          Sign in
        </Link>
      </p>

      {hasGoogle && (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
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

      <form onSubmit={onSubmit} className={`space-y-4 ${hasGoogle ? "" : "mt-8"}`}>
        <div>
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input
            id="name"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-pill"
          />
        </div>
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
            minLength={8}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordTouched(true)}
            className="input-pill"
          />
          {passwordTouched && <PasswordChecklist password={password} />}
        </div>

        {error && <p className="text-sm text-pink">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full rounded-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-faint">
        By continuing, you agree to AniVerse&apos;s{" "}
        <Link href="/terms" className="underline hover:text-ink-dim">
          Terms of Service
        </Link>{" "}
        and acknowledge the{" "}
        <Link href="/privacy" className="underline hover:text-ink-dim">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
