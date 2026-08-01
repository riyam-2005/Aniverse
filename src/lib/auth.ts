import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isValidPhone } from "@/lib/phone";
import { phoneLoginConfigured, verifyFirebasePhoneToken } from "@/lib/firebaseAdmin";

const providers: AuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = credentials.email.toLowerCase().trim();

      // 10 login attempts per email per 15 minutes — throttles credential
      // stuffing / brute force without locking a user out for long.
      const rate = await checkRateLimit(`login:${email}`, 10, 15 * 60 * 1000);
      if (!rate.ok) {
        throw new Error("Too many login attempts. Please try again in a few minutes.");
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;

      const valid = await bcrypt.compare(credentials.password, user.password);
      if (!valid) return null;

      return { id: user.id, name: user.name, email: user.email };
    },
  }),
];

// Phone sign-in is optional — only wired up if Firebase Phone Auth is
// configured. The user already confirmed their SMS code directly with
// Firebase in the browser (see src/lib/useFirebasePhoneAuth.ts) before
// landing here; authorize() just verifies the ID token that produced and
// looks up the matching verified user.
if (phoneLoginConfigured()) {
  providers.push(
    CredentialsProvider({
      id: "phone",
      name: "Phone",
      credentials: {
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        const phone = await verifyFirebasePhoneToken(credentials.idToken);
        if (!phone || !isValidPhone(phone)) return null;

        // 10 attempts per phone per 15 minutes — same shape as the
        // email/password brute-force guard above.
        const rate = await checkRateLimit(`login-phone:${phone}`, 10, 15 * 60 * 1000);
        if (!rate.ok) {
          throw new Error("Too many login attempts. Please try again in a few minutes.");
        }

        // Only a phone that's actually been verified (via account
        // settings) can be used to sign in — a Firebase-verified token
        // for a number that was never linked to an account shouldn't be
        // enough on its own.
        const user = await prisma.user.findFirst({
          where: { phone, phoneVerifiedAt: { not: null } },
        });
        if (!user) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    })
  );
}

// Google sign-in is optional — only wired up if credentials are present in .env
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: AuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      // For Google sign-ins, find-or-create the local user row so the
      // watchlist can key off a single, consistent user id.
      if (account?.provider === "google" && profile?.email) {
        const email = profile.email.toLowerCase();
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name: profile.name ?? email.split("@")[0],
              // Google users don't have a local password; store a random
              // unusable hash so the column stays non-null.
              password: await bcrypt.hash(randomUUID(), 10),
            },
          });
        }
        token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
