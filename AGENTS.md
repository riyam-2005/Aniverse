
# AniVerse Project Agent Guidelines & Reference Ecosystem

Welcome to **AniVerse** (`c:\aniverse`).

## Active Customizations & Architecture References
- **GitHub Reference Catalog**: Detailed directory of 27 reference repositories covering MCP tooling, autonomous AI agents, and 3D/creative web design benchmarks. See [.agents/rules/github_reference_ecosystem.md](file:///c:/aniverse/.agents/rules/github_reference_ecosystem.md).
- **MCP Operational Runbook**: Guide for verifying and configuring Model Context Protocol servers (Playwright, Supabase, Figma, Magic UI, Inspector). See [.agents/skills/mcp-ecosystem/SKILL.md](file:///c:/aniverse/.agents/skills/mcp-ecosystem/SKILL.md).

## Core Project Rules
1. **Next.js 14 App Router**: Use Server Components where possible; reserve `'use client'` for interactive state, animation loops, and forms.
2. **Supabase & RLS**: Maintain row-level security integrity across all migrations and queries.
3. **Design Standard**: Deliver a high-polish, dark-first neon anime aesthetic with glassmorphism and subtle micro-animations. Refer to the 3D and frontend showcase repositories in the reference catalog.
4. **Testing**: Run Vitest (`npm test`) and Playwright (`npx playwright test`) to ensure regression-free releases.
