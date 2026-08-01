// Exercises the parts of the schema that are easy to get subtly wrong when
// moving from SQLite to Postgres — enum columns, the @@unique composite
// constraint, and ON DELETE CASCADE — against a real Postgres instance.
//
// This is deliberately NOT a Prisma-based test: it uses the `pg` driver
// directly against the tables `prisma db push` just created, so it's
// checking what Postgres itself enforces, independent of Prisma's client
// layer. Run via `npm run db:test:postgres`.

import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://aniverse:aniverse@localhost:55432/aniverse_test";

const client = new pg.Client({ connectionString });

function assert(condition, message) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`  ok: ${message}`);
}

async function main() {
  await client.connect();
  console.log("Connected to Postgres test instance.\n");

  // Clean slate in case a previous run left rows behind.
  await client.query('DELETE FROM "WatchlistItem"');
  await client.query('DELETE FROM "User"');

  console.log("Checking basic insert + enum column...");
  const userRes = await client.query(
    `INSERT INTO "User" (id, name, email, password, "createdAt")
     VALUES ('test-user-1', 'Test User', 'test@example.com', 'hashed', now())
     RETURNING id`
  );
  assert(userRes.rows.length === 1, "user row inserted");

  await client.query(
    `INSERT INTO "WatchlistItem"
       (id, "userId", "malId", title, "imageUrl", "totalEpisodes", status, progress, "createdAt", "updatedAt")
     VALUES
       ('test-item-1', 'test-user-1', 1, 'Cowboy Bebop', 'https://example.com/x.jpg', 26, 'WATCHING', 3, now(), now())`
  );
  const enumCheck = await client.query(
    `SELECT status FROM "WatchlistItem" WHERE id = 'test-item-1'`
  );
  assert(enumCheck.rows[0].status === "WATCHING", "WatchStatus enum round-trips correctly");

  console.log("\nChecking @@unique([userId, malId])...");
  let uniqueViolation = false;
  try {
    await client.query(
      `INSERT INTO "WatchlistItem"
         (id, "userId", "malId", title, "imageUrl", status, progress, "createdAt", "updatedAt")
       VALUES
         ('test-item-2', 'test-user-1', 1, 'Cowboy Bebop (dup)', 'https://example.com/x.jpg', 'PLANNING', 0, now(), now())`
    );
  } catch (err) {
    uniqueViolation = err.code === "23505"; // unique_violation
  }
  assert(uniqueViolation, "duplicate (userId, malId) is rejected by the DB");

  console.log("\nChecking onDelete: Cascade...");
  await client.query(`DELETE FROM "User" WHERE id = 'test-user-1'`);
  const orphanCheck = await client.query(
    `SELECT count(*)::int AS count FROM "WatchlistItem" WHERE "userId" = 'test-user-1'`
  );
  assert(orphanCheck.rows[0].count === 0, "deleting a user cascades to their watchlist items");

  console.log("\nAll Postgres schema checks passed.");
}

main()
  .catch((err) => {
    console.error("\n" + err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
