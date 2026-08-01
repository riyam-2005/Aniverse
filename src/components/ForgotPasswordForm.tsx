"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-4xl tracking-wide text-ink">Check your email</h1>
        <p className="mt-3 text-sm text-ink-dim">
          If an account exists for <span className="text-ink">{email}</span>, we&apos;ve sent a
          link to reset your password. It expires in 1 hour.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-cyan hover:underline">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-4xl tracking-wide text-ink">Forgot password</h1>
      <p className="mt-2 text-sm text-ink-dim">
        Enter the email on your account and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs text-ink-dim">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>

        {error && <p className="text-sm text-pink">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link href="/login" className="mt-6 inline-block text-sm text-cyan hover:underline">
        ← Back to sign in
      </Link>
    </div>
  );
}
