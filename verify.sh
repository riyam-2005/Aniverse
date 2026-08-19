#!/usr/bin/env bash
# Run this after copying in all the files from tonight's session.
# Stops at the first real failure so you know exactly where things broke.
#
#   chmod +x verify.sh && ./verify.sh
#
set -e

step() { echo ""; echo "── $1 ──────────────────────────"; }

step "1/6  Installing deps + regenerating Prisma client"
npm install
# npm install already runs `prisma generate` via postinstall — this just
# confirms it explicitly and fails loudly if that step got skipped.
npx prisma generate

step "2/6  Applying schema changes to your dev database"
npx prisma db push

step "3/6  Typecheck"
npm run typecheck

step "4/6  Lint"
npm run lint

step "5/6  Unit tests"
npm test

step "6/6  Production build"
npm run build

echo ""
echo "✅ All checks passed. Start it with: npm run start"
echo "   Then confirm http://localhost:3000/api/health returns db: connected"
