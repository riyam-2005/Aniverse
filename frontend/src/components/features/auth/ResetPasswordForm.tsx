"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import PasswordChecklist, { getPasswordRules } from "./PasswordChecklist";

export default function ResetPasswordForm({ token: propToken }: { token?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = propToken ?? (searchParams ? searchParams.get("token") : null) ?? "";

  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordValid = getPasswordRules(password).every((r) => r.met);

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-4xl tracking-wide text-ink">Invalid link</h1>
        <p className="mt-3 text-sm text-ink-dim">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm text-cyan hover:underline">
          Request a new link →
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setTouched(true);
      setError("Your password doesn't meet the requirements below yet.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to update password.");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-4xl tracking-wide text-ink">Password updated</h1>
        <p className="mt-3 text-sm text-ink-dim">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-4xl tracking-wide text-ink">Set a new password</h1>
      <p className="mt-2 text-sm text-ink-dim">Choose a new password for your account.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs text-ink-dim">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setTouched(true)}
            className="input-pill"
          />
          {touched && <PasswordChecklist password={password} />}
        </div>

        {error && <p className="text-sm text-pink">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full rounded-full">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
