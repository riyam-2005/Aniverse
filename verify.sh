#!/usr/bin/env bash
# Aniverse V1 Production Verification Script
set -e

step() { echo ""; echo "── $1 ──────────────────────────"; }

step "1/5  Installing dependencies"
npm install

step "2/5  TypeScript Typecheck"
npm run typecheck

step "3/5  ESLint Verification"
npm run lint

step "4/5  Unit & Integration Tests"
npm test

step "5/5  Production Next.js Build"
npm run build

echo ""
echo "✅ All Aniverse V1 checks passed cleanly."
echo "   Start in production mode: npm run start"
