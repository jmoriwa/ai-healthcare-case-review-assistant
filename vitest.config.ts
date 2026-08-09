import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Mock services simulate network latency, so multi-step business-rule
    // tests need more headroom than the default 5s.
    testTimeout: 30_000,
  },
});
