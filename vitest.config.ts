import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Simulated mock latency is disabled in setup, so the default timeout is plenty.
    setupFiles: ["./src/test/setup.ts"],
  },
});
