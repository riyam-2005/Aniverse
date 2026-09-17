import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/core/clients/rate-limit';
import { createClient } from '@/core/clients/supabase';

export const authRoutes = Router();

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be under 60 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

authRoutes.post('/forgot-password', async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'anon';
    const rate = await checkRateLimit(`forgot-password:${clientIp}`, 5, 15 * 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many attempts. Please try again later.", code: "RATE_LIMITED" });
    }

    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    const supabase = createClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/reset-password`,
    });

    return res.json({ ok: true, data: { message: "If that email has an account, we've sent a reset link." } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

authRoutes.post('/reset-password', async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'anon';
    const rate = await checkRateLimit(`reset-password:${clientIp}`, 10, 15 * 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many attempts. Please try again later.", code: "RATE_LIMITED" });
    }

    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return res.status(400).json({ ok: false, error: error.message, code: "AUTH_ERROR" });
    }

    return res.json({ ok: true, data: { message: "Password updated successfully. You can now sign in." } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

authRoutes.post('/register', async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'anon';
    const rate = await checkRateLimit(`register:${clientIp}`, 5, 10 * 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many attempts. Please try again later.", code: "RATE_LIMITED" });
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    const { name, email, password } = parsed.data;
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          username: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase(),
        },
      },
    });

    if (error) {
      return res.status(400).json({ ok: false, error: error.message, code: "AUTH_ERROR" });
    }

    return res.status(201).json({ ok: true, data: { id: data.user?.id, email: data.user?.email } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});
