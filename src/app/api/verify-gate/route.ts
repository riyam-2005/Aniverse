import { NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Verifies the reCAPTCHA token from the homepage gate (see
 * HomeVerifyGate.tsx). Scoped to just the home screen on purpose — the
 * register form has its own captcha check in /api/register, and login
 * has none. Rate-limited by IP so someone can't hammer this endpoint
 * trying to brute-force past it without solving a captcha each time.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`verify-gate:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const token = body?.token as string | undefined;

  const ok = await verifyRecaptcha(token);
  if (!ok) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
