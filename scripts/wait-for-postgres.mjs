// Polls the docker-compose.test.yml Postgres instance until it's ready to
// accept connections, so the migrate step doesn't race the container.

import { execSync } from "node:child_process";

const MAX_ATTEMPTS = 30;
const DELAY_MS = 1000;

function isReady() {
  try {
    execSync(
      "docker compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U aniverse -d aniverse_test",
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const main = async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (isReady()) {
      console.log("Postgres is ready.");
      return;
    }
    process.stdout.write(".");
    await sleep(DELAY_MS);
  }
  console.error(
    `\nPostgres did not become ready after ${MAX_ATTEMPTS} attempts. Check "docker compose -f docker-compose.test.yml logs".`
  );
  process.exit(1);
};

main();
