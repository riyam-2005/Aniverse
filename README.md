# AniVerse V1 — AI-Powered Personal Anime Companion

> **AniVerse** is a production-ready personal anime companion and discovery engine powered by Next.js 14 App Router, Supabase (PostgreSQL, Auth, RLS), and OpenAI (`gpt-4o-mini`).

---

## 🌟 Core Features

- **✨ Grounded AI Companion ("Ask AniVerse")**: Natural language conversational anime search, mood-based matching, and grounded recommendations using Jikan + OpenAI reasoning with deterministic heuristic fallback.
- **🧬 Anime DNA & Personality Profiling**: Live computation of user anime taste, archetype badges (e.g. *Shonen Vanguard*, *Psychological Thriller Seeker*), genre affinities, and streaming habit telemetry.
- **📚 Personal Library & Watch Tracking**: Comprehensive collection tracking across 5 states (*Watching, Completed, Plan to Watch, On Hold, Dropped*), favorite toggles, episode steppers, score ratings, and progress metrics.
- **⏱️ Playback Timeline & Watch History**: Real-time progress synchronization with append-only episode history.
- **📅 Airing Calendar & Episode Notifications**: Weekly broadcast schedules with automated episode alerts and SSE/polling live bell.
- **🛡️ Enterprise Security & RLS**: Fully protected PostgreSQL tables with Row Level Security (RLS), edge middleware auth routing, rate limiting, and origin validation.
- **📊 Admin Control Center**: Telemetry dashboard for user management, platform growth metrics, system health, and database connection checks.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components, Server Actions)
- **Database & Auth**: Supabase (PostgreSQL 16, Supabase SSR, Row Level Security)
- **AI Engine**: OpenAI API (`gpt-4o-mini`) + Jikan API retrieval pipeline
- **Styling**: Tailwind CSS with custom neon anime aesthetic, glassmorphism, and dark-first palette
- **Testing**: Vitest unit suite + Playwright end-to-end testing

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/riyam-2005/Aniverse.git
cd Aniverse
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

### 3. Apply Supabase Database Schema
Run the SQL migration located at `supabase/migrations/20260821000000_aniverse_v1_init.sql` in your Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`.

---

## 🧪 Testing & Verification

```bash
npm test          # Run Vitest unit & integration tests
npm run typecheck # Run TypeScript type checker
npm run lint      # Run ESLint
npm run build     # Test production build
```

---

## 📄 License
MIT License.
