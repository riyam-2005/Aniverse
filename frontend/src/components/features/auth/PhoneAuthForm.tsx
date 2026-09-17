"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/core/clients/supabase";

const COUNTRY_CODES = [
  { code: "+1", label: "+1 (US/CA)" },
  { code: "+91", label: "+91 (IN)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+81", label: "+81 (JP)" },
  { code: "+61", label: "+61 (AU)" },
  { code: "+49", label: "+49 (DE)" },
  { code: "+33", label: "+33 (FR)" },
  { code: "+82", label: "+82 (KR)" },
  { code: "+55", label: "+55 (BR)" },
  { code: "+63", label: "+63 (PH)" },
  { code: "+62", label: "+62 (ID)" },
];

export default function PhoneAuthForm({
  mode = "login",
  callbackUrl = "/app/library",
}: {
  mode?: "login" | "register";
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();

  const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, "")}`;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputsRef.current[0]?.focus(), 50);
    }
  }, [step]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanNumber = phone.replace(/\D/g, "");
    if (cleanNumber.length < 7) {
      setError("Please enter a valid mobile number.");
      return;
    }

    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhoneNumber,
      });

      if (otpError) {
        setError(otpError.message || "Failed to send SMS code. Please check your number.");
        setLoading(false);
        return;
      }

      setStep("otp");
      setResendTimer(60);
    } catch {
      setError("An unexpected error occurred while sending SMS.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const token = otp.join("");
    if (token.length !== 6) {
      setError("Please enter the 6-digit code sent to your phone.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token,
        type: "sms",
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid or expired verification code.");
        setLoading(false);
        return;
      }

      if (data.session) {
        const target =
          mode === "register"
            ? "/onboarding"
            : !callbackUrl || callbackUrl === "/login" || callbackUrl === "/register"
            ? "/app/library"
            : callbackUrl;

        window.location.href = target;
      }
    } catch {
      setError("Failed to verify code. Please try again.");
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  }

  return (
    <div className="w-full">
      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-ink-dim mb-1.5">
              Phone Number
            </label>
            <div className="flex items-center rounded-2xl border border-line bg-panel2/80 p-1 focus-within:border-pink focus-within:ring-1 focus-within:ring-pink/40 transition-all shadow-inner">
              {/* Country dial code selector */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-label="Country Code"
                className="h-10 w-28 shrink-0 rounded-xl bg-panel px-2.5 text-xs font-semibold text-ink border border-line/40 focus:outline-none cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-panel text-ink">
                    {c.label}
                  </option>
                ))}
              </select>

              <div className="h-6 w-px bg-line mx-2" />

              {/* Phone number input */}
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="Mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 flex-1 bg-transparent px-2 text-sm text-ink placeholder-ink-faint focus:outline-none min-w-0"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-ink-faint">
              We&apos;ll send a 6-digit verification code via SMS.
            </p>
          </div>

          {error && <p className="text-xs text-pink">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
            )}
            <span>{loading ? "Sending SMS Code…" : "Send Verification Code"}</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
          <div className="text-center mb-3">
            <p className="text-xs text-ink-dim leading-relaxed">
              Enter the 6-digit verification code sent to <br />
              <strong className="text-ink font-mono">{fullPhoneNumber}</strong>
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp(["", "", "", "", "", ""]);
                setError(null);
              }}
              className="mt-1 text-xs text-pink font-semibold hover:underline"
            >
              Edit phone number ✎
            </button>
          </div>

          {/* 6-Digit OTP code inputs */}
          <div className="flex justify-center gap-1.5 sm:gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpInputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="h-12 w-10 sm:w-11 rounded-xl border border-line bg-panel2 text-center font-mono text-lg font-bold text-ink focus:border-pink focus:shadow-pink-glow focus:outline-none"
              />
            ))}
          </div>

          {error && <p className="text-xs text-center text-pink">{error}</p>}

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="btn-primary w-full py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : null}
            <span>{loading ? "Verifying…" : "Confirm & Sign In ✓"}</span>
          </button>

          {/* Resend button */}
          <div className="text-center pt-1">
            {resendTimer > 0 ? (
              <span className="font-mono text-xs text-ink-faint">
                Resend code in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-xs text-pink font-semibold hover:underline"
              >
                Resend SMS code ↻
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
