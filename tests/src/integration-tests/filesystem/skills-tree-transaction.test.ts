import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, it } from "vitest";

import { createProjectPath } from "../../../../src/core/index.ts";
import { installStagedTree } from "../../../../src/filesystem/writers/skills-tree-transaction.ts";
import { createFilesystemRepository } from "./test-fixtures/filesystem-repository-fixture.ts";

describe("skills tree transaction", () => {
  it("restores the previous tree when staged-tree installation fails", async () => {
    // GIVEN: A prior managed tree exists but the staged replacement vanished.
    const rootDir = await createFilesystemRepository();
    const priorPath = path.join(rootDir, "skills", "prior.txt");
    await mkdir(path.dirname(priorPath), { recursive: true });
    await writeFile(priorPath, "prior bytes\n");
    const missingStage = path.join(rootDir, "missing-stage.tmp");

    // WHEN: Installation fails after preserving the previous tree.
    const installation = installStagedTree(
      rootDir,
      createProjectPath("skills"),
      missingStage,
    );

    // THEN: The previous tree is restored at its original path.
    await assert.rejects(installation, { code: "ENOENT" });
    assert.equal(await readFile(priorPath, "utf8"), "prior bytes\n");
  });
});
