"use client";

import { useState, type FormEvent } from "react";
import { useFirebasePhoneAuth } from "@/lib/useFirebasePhoneAuth";

export default function PhoneSettingsForm({
  initialPhone,
}: {
  initialPhone: string | null;
}) {
  const [linkedPhone, setLinkedPhone] = useState(initialPhone);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  const {
    containerRef: recaptchaRef,
    codeSent,
    loading,
    error,
    setError,
    sendCode,
    confirmCode,
    reset: resetPhone,
  } = useFirebasePhoneAuth();

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    await sendCode(phone);
  }

  async function verifyAndLink(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const idToken = await confirmCode(code);
    if (!idToken) return;

    try {
      const res = await fetch("/api/user/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "That code didn't work.");
        return;
      }
      setLinkedPhone(data.phone ?? phone);
      resetPhone();
      setPhone("");
      setCode("");
      setMessage("Phone number verified and linked.");
    } catch {
      setError("Something went wrong. Try again.");
    }
  }

  async function unlink() {
    setUnlinkError(null);
    setMessage(null);
    setUnlinkLoading(true);
    try {
      const res = await fetch("/api/user/phone", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setUnlinkError(data.error ?? "Couldn't remove the number.");
        return;
      }
      setLinkedPhone(null);
      setMessage("Phone number removed.");
    } finally {
      setUnlinkLoading(false);
    }
  }

  if (linkedPhone) {
    return (
      <div>
        <p className="text-sm text-ink-dim">
          Phone sign-in is enabled for <span className="text-ink">{linkedPhone}</span>.
        </p>
        {message && <p className="mt-2 text-sm text-cyan">{message}</p>}
        {unlinkError && <p className="mt-2 text-sm text-pink">{unlinkError}</p>}
        <button
          type="button"
          onClick={unlink}
          disabled={unlinkLoading}
          className="mt-4 font-mono text-xs text-ink-faint hover:text-pink disabled:opacity-50"
        >
          Remove this number
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={codeSent ? verifyAndLink : handleSendCode} className="space-y-3">
      <div ref={recaptchaRef} />
      <div>
        <input
          type="tel"
          required
          disabled={codeSent}
          placeholder="+1 555 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-pill disabled:opacity-60"
        />
      </div>

      {codeSent && (
        <div>
          <input
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

      {error && <p className="text-sm text-pink">{error}</p>}
      {message && <p className="text-sm text-cyan">{message}</p>}

      <button type="submit" disabled={loading} className="btn-primary rounded-full px-6 py-2 text-sm">
        {loading ? (codeSent ? "Verifying…" : "Sending…") : codeSent ? "Verify & link" : "Send code"}
      </button>
    </form>
  );
}
