"use client";

import { useCallback, useRef, useState } from "react";
import type { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

function firebaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | undefined)?.code ?? "";
  switch (code) {
    case "auth/invalid-phone-number":
      return "Enter a phone number in international format, e.g. +15551234567";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/invalid-verification-code":
      return "That code didn't work. Check it and try again.";
    case "auth/code-expired":
      return "That code expired. Send a new one.";
    default:
      return "Something went wrong. Try again.";
  }
}

/**
 * Wraps Firebase's phone-auth flow: an invisible reCAPTCHA (required by
 * Firebase to send an SMS), sendCode(phone) to trigger it, and
 * confirmCode(code) to check what the user typed and return a Firebase ID
 * token for the backend to verify (see src/lib/firebaseAdmin.ts). Renders
 * nothing itself — mount the returned `containerRef` div anywhere in the
 * form; it's invisible.
 */
export function useFirebasePhoneAuth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getVerifier(): Promise<RecaptchaVerifier> {
    if (!verifierRef.current) {
      if (!containerRef.current) {
        throw new Error("Recaptcha container isn't mounted yet.");
      }
      const [{ RecaptchaVerifier }, auth] = await Promise.all([
        import("firebase/auth"),
        getFirebaseAuth(),
      ]);
      verifierRef.current = new RecaptchaVerifier(auth, containerRef.current, {
        size: "invisible",
      });
    }
    return verifierRef.current;
  }

  const sendCode = useCallback(async (phone: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const [{ signInWithPhoneNumber }, auth, verifier] = await Promise.all([
        import("firebase/auth"),
        getFirebaseAuth(),
        getVerifier(),
      ]);
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      confirmationRef.current = confirmation;
      setCodeSent(true);
      return true;
    } catch (err) {
      setError(firebaseErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Resolves to a Firebase ID token on success, or null on failure (error is set). */
  const confirmCode = useCallback(async (code: string): Promise<string | null> => {
    setError(null);
    setLoading(true);
    try {
      if (!confirmationRef.current) {
        setError("Send a code first.");
        return null;
      }
      const result = await confirmationRef.current.confirm(code);
      return await result.user.getIdToken();
    } catch (err) {
      setError(firebaseErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    confirmationRef.current = null;
    setCodeSent(false);
    setError(null);
  }, []);

  return { containerRef, codeSent, loading, error, setError, sendCode, confirmCode, reset };
}
