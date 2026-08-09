import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    environment: "node",
    include: [
      "scripts/**/*.test.ts",
      "tests/**/*.test.ts",
      "tests/.github/scripts/**/*.test.ts",
    ],
    restoreMocks: true,
  },
});
