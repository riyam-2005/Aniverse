import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Existing lib/*.test.ts files are plain logic tests and stay fast on
    // "node". Component tests (*.test.tsx) need a DOM and opt into it
    // individually via a `// @vitest-environment jsdom` pragma at the top
    // of the file, rather than paying the jsdom cost for every test file.
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

