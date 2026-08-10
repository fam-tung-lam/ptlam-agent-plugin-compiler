import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const excludedDirectories = new Set([
  ".git",
  "coverage",
  "dist",
  "local",
  "node_modules",
]);

/**
 * Finds TypeScript tests that bypass the repository test root.
 *
 * @param directory - Absolute directory currently being inspected.
 * @param relativeDirectory - Directory path relative to the project root.
 * @returns Sorted test paths that are outside `tests/`.
 * @throws If a directory cannot be read.
 */
async function findMisplacedTests(
  directory: string,
  relativeDirectory = "",
): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const misplacedTests: string[] = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) {
        misplacedTests.push(
          ...(await findMisplacedTests(
            path.join(directory, entry.name),
            relativePath,
          )),
        );
      }
      continue;
    }

    if (
      /\.(?:spec|test)\.ts$/u.test(entry.name) &&
      !relativePath.startsWith(`tests${path.sep}`)
    ) {
      misplacedTests.push(relativePath);
    }
  }

  return misplacedTests.sort();
}

describe("test placement", () => {
  it("keeps every TypeScript test under the test root", async () => {
    // GIVEN: The repository contains every production and test source tree.
    const sourceTree = projectRoot;

    // WHEN: TypeScript test filenames are located recursively.
    const misplacedTests = await findMisplacedTests(sourceTree);

    // THEN: Every test belongs to the dedicated test root.
    assert.deepEqual(misplacedTests, []);
  });
});
