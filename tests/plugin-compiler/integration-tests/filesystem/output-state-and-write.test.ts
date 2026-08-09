import assert from "node:assert/strict";
import { mkdir, readdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, it } from "vitest";

import {
  createOutputPlan,
  createProjectPath,
  OutputEntryKind,
  OutputOwnershipKind,
  type OutputPlan,
} from "../../../../src/core/index.ts";
import {
  readOutputState,
  writeOutputPlan,
} from "../../../../src/filesystem/index.ts";
import { createFilesystemRepository } from "./test-fixtures/filesystem-repository-fixture.ts";

const skillsRoot = createProjectPath("skills");
const skillDirectory = createProjectPath("skills/alpha-skill");
const skillFile = createProjectPath("skills/alpha-skill/SKILL.md");
const codexManifest = createProjectPath(".codex-plugin/plugin.json");

function createPlan(options: { longTreePath?: boolean } = {}): OutputPlan {
  const treeFile = options.longTreePath
    ? createProjectPath(`skills/alpha-skill/${"x".repeat(300)}`)
    : skillFile;
  return createOutputPlan({
    fragments: [
      {
        ownerId: "shared-skills",
        ownership: {
          kind: OutputOwnershipKind.CompleteTree,
          root: skillsRoot,
        },
        artifacts: [
          { kind: OutputEntryKind.Directory, path: skillsRoot },
          { kind: OutputEntryKind.Directory, path: skillDirectory },
          {
            kind: OutputEntryKind.File,
            path: treeFile,
            content: Buffer.from("# Generated alpha\n"),
          },
        ],
      },
      {
        ownerId: "codex",
        ownership: {
          kind: OutputOwnershipKind.ExactFiles,
          paths: [codexManifest],
        },
        artifacts: [
          {
            kind: OutputEntryKind.File,
            path: codexManifest,
            content: Buffer.from('{"name":"fixture"}\n'),
          },
        ],
      },
    ],
  });
}

describe("filesystem output state and writes", () => {
  it("reads only plan-owned state including unexpected empty tree directories", async () => {
    // GIVEN: Enabled Codex and shared outputs coexist with disabled Claude and root README artifacts.
    const rootDir = await createFilesystemRepository();
    await mkdir(path.join(rootDir, "skills", "unexpected", "empty"), {
      recursive: true,
    });
    await mkdir(path.join(rootDir, ".codex-plugin"), { recursive: true });
    await writeFile(
      path.join(rootDir, ".codex-plugin", "plugin.json"),
      "codex-current",
    );
    await mkdir(path.join(rootDir, ".claude-plugin"), { recursive: true });
    await writeFile(
      path.join(rootDir, ".claude-plugin", "plugin.json"),
      "disabled-provider",
    );
    await symlink(
      path.join(rootDir, "missing-readme-target"),
      path.join(rootDir, "README.md"),
      "file",
    );

    // WHEN: Factual output state is read for the subset plan.
    const state = await readOutputState(rootDir, createPlan());

    // THEN: Exact Codex and the complete skills tree are visible, but disabled/root paths are absent.
    assert.deepEqual(
      state.entries.map((entry) => entry.path),
      [
        ".codex-plugin/plugin.json",
        "skills",
        "skills/unexpected",
        "skills/unexpected/empty",
      ],
    );
  });

  it("atomically writes exact files and recoverably replaces the complete tree", async () => {
    // GIVEN: Stale owned outputs coexist with disabled-provider bytes and an unreadable root README link.
    const rootDir = await createFilesystemRepository();
    await mkdir(path.join(rootDir, "skills"), { recursive: true });
    await writeFile(path.join(rootDir, "skills", "stale.txt"), "stale");
    await mkdir(path.join(rootDir, ".codex-plugin"), { recursive: true });
    await writeFile(path.join(rootDir, ".codex-plugin", "plugin.json"), "old");
    await mkdir(path.join(rootDir, ".claude-plugin"), { recursive: true });
    const claudePath = path.join(rootDir, ".claude-plugin", "plugin.json");
    await writeFile(claudePath, "disabled-provider");
    await symlink(
      path.join(rootDir, "missing-readme-target"),
      path.join(rootDir, "README.md"),
      "file",
    );
    const plan = createPlan();

    // WHEN: The plan is written twice.
    const first = await writeOutputPlan(rootDir, plan);
    const second = await writeOutputPlan(rootDir, plan);

    // THEN: Only enabled exact paths and the complete shared tree change, then become current.
    assert.deepEqual(first.changedPaths, [codexManifest, skillsRoot]);
    assert.deepEqual(second.changedPaths, []);
    assert.deepEqual(second.unchangedPaths, [codexManifest, skillsRoot]);
    assert.equal(
      await readFile(path.join(rootDir, skillFile), "utf8"),
      "# Generated alpha\n",
    );
    assert.equal(await readFile(claudePath, "utf8"), "disabled-provider");
    assert.deepEqual(
      (await readdir(rootDir)).filter((name) =>
        name.startsWith(".plugin-compiler-"),
      ),
      [],
    );
  });

  it("finishes tree staging before changing an exact provider file", async () => {
    // GIVEN: A valid exact output is paired with a tree artifact that cannot be staged.
    const rootDir = await createFilesystemRepository();
    await mkdir(path.join(rootDir, ".codex-plugin"), { recursive: true });
    const codexPath = path.join(rootDir, ".codex-plugin", "plugin.json");
    await writeFile(codexPath, "preserved");

    // WHEN: Writing the plan fails during tree staging.
    const write = writeOutputPlan(rootDir, createPlan({ longTreePath: true }));

    // THEN: No standalone output changes and no staging residue remains.
    await assert.rejects(write, (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(
        error.message,
        process.platform === "win32"
          ? /ENOENT|no such file|ENAMETOOLONG|name too long/iu
          : /ENAMETOOLONG|name too long/iu,
      );
      return true;
    });
    assert.equal(await readFile(codexPath, "utf8"), "preserved");
    assert.deepEqual(
      (await readdir(rootDir)).filter((name) =>
        name.startsWith(".plugin-compiler-"),
      ),
      [],
    );
  });

  it("rejects an exact output parent symlink without writing outside the repository", async () => {
    // GIVEN: An enabled provider parent points outside the repository.
    const rootDir = await createFilesystemRepository();
    const externalRoot = await createFilesystemRepository();
    await symlink(externalRoot, path.join(rootDir, ".codex-plugin"), "dir");

    // WHEN: The provider output plan is written.
    const write = writeOutputPlan(rootDir, createPlan());

    // THEN: Physical path safety rejects the plan before an external write.
    await assert.rejects(write, /contains symbolic link/u);
    assert.equal((await readdir(externalRoot)).includes("plugin.json"), false);
  });
});
