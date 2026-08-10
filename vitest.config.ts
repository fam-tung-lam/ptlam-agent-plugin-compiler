import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        branches: 80,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/.github/scripts/**/*.test.ts"],
    restoreMocks: true,
  },
});
