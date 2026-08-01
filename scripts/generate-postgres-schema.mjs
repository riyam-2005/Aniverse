// Generates prisma/schema.postgres.prisma from prisma/schema.prisma.
//
// We keep ONE hand-maintained schema (schema.prisma, provider = "sqlite")
// as the source of truth for local dev, and derive the Postgres variant
// from it automatically. This means the "swap to Postgres" story can't
// silently drift out of date the way a hand-copied second file would —
// whatever models/fields exist in schema.prisma are exactly what gets
// tested against real Postgres in `npm run db:test:postgres`.
//
// Run automatically before db:test:postgres:migrate; safe to run manually.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(__dirname, "..", "prisma", "schema.prisma");
const targetPath = path.join(__dirname, "..", "prisma", "schema.postgres.prisma");

const source = readFileSync(sourcePath, "utf8");

if (!source.includes('provider = "sqlite"')) {
  console.error(
    `Expected to find provider = "sqlite" in ${sourcePath} — the source schema may have already been changed. Aborting to avoid writing a bad file.`
  );
  process.exit(1);
}

const generated = source.replace('provider = "sqlite"', 'provider = "postgresql"');

const banner = `// AUTO-GENERATED from schema.prisma by scripts/generate-postgres-schema.mjs
// Do not edit by hand — edit schema.prisma and re-run the script instead.

`;

writeFileSync(targetPath, banner + generated);
console.log(`Wrote ${path.relative(process.cwd(), targetPath)}`);
