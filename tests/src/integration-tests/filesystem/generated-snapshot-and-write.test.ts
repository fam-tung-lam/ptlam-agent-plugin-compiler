import assert from "node:assert/strict";
import { mkdir, readdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  OwnershipKind,
} from "../../../../src/core/generated/artifact.ts";
import {
  createWritePlan,
  type WritePlan,
} from "../../../../src/core/generated/write-plan.ts";
import { createProjectPath } from "../../../../src/core/index.ts";
import {
  readGeneratedSnapshot,
  writePlan,
} from "../../../../src/filesystem/index.ts";
import { createFilesystemRepository } from "./test-fixtures/filesystem-repository-fixture.ts";

const skillsRoot = createProjectPath("skills");
const skillDirectory = createProjectPath("skills/alpha-skill");
const skillFile = createProjectPath("skills/alpha-skill/SKILL.md");
const codexManifest = createProjectPath(".codex-plugin/plugin.json");
const claudeManifest = createProjectPath(".claude-plugin/plugin.json");

function createPlan(options: { longTreePath?: boolean } = {}): WritePlan {
  const treeFile = options.longTreePath
    ? createProjectPath(`skills/alpha-skill/${"x".repeat(300)}`)
    : skillFile;
  return createWritePlan({
    fragments: [
      {
        ownerId: "shared-skills",
        ownership: {
          kind: OwnershipKind.CompleteTree,
          root: skillsRoot,
        },
        artifacts: [
          { kind: ArtifactKind.Directory, path: skillsRoot },
          { kind: ArtifactKind.Directory, path: skillDirectory },
          {
            kind: ArtifactKind.File,
            path: treeFile,
            content: Buffer.from("# Generated alpha\n"),
          },
        ],
      },
      {
        ownerId: "codex",
        ownership: {
          kind: OwnershipKind.ExactFiles,
          paths: [codexManifest],
        },
        artifacts: [
          {
            kind: ArtifactKind.File,
            path: codexManifest,
            content: Buffer.from('{"name":"fixture"}\n'),
          },
        ],
      },
      {
        ownerId: "claude",
        ownership: {
          kind: OwnershipKind.ExactFiles,
          paths: [claudeManifest],
        },
        artifacts: [],
      },
    ],
  });
}

describe("filesystem generated snapshots and writes", () => {
  it("reads only plan-owned state including desired-absent exact files", async () => {
    // GIVEN: Selected, desired-absent, and shared outputs coexist with unowned and root artifacts.
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
      "desired-absent-provider",
    );
    await mkdir(path.join(rootDir, ".unowned-plugin"), { recursive: true });
    await writeFile(
      path.join(rootDir, ".unowned-plugin", "plugin.json"),
      "unowned-provider",
    );
    await symlink(
      path.join(rootDir, "missing-readme-target"),
      path.join(rootDir, "README.md"),
      "file",
    );

    // WHEN: Factual output state is read for the subset plan.
    const snapshot = await readGeneratedSnapshot(rootDir, createPlan());

    // THEN: Both exact-owned files and the complete tree are visible, but unowned/root paths are absent.
    assert.deepEqual(
      snapshot.entries.map((entry) => entry.path),
      [
        ".claude-plugin/plugin.json",
        ".codex-plugin/plugin.json",
        "skills",
        "skills/unexpected",
        "skills/unexpected/empty",
      ],
    );
  });

  it("records a complete-tree root file as observed wrong-kind state", async () => {
    // GIVEN: The generated skills root is a file instead of the planned tree.
    const rootDir = await createFilesystemRepository();
    await writeFile(path.join(rootDir, "skills"), "wrong-kind");

    // WHEN: The generated snapshot reads only plan-owned paths.
    const snapshot = await readGeneratedSnapshot(rootDir, createPlan());

    // THEN: Planning can compare the observed file kind instead of the reader throwing.
    assert.deepEqual(snapshot.entries, [
      {
        kind: ArtifactKind.File,
        path: skillsRoot,
        content: Buffer.from("wrong-kind"),
      },
    ]);
  });

  it("writes, deletes, and idempotently reconciles exact files while preserving unowned paths", async () => {
    // GIVEN: Stale selected and desired-absent outputs coexist with unowned sibling and root paths.
    const rootDir = await createFilesystemRepository();
    await mkdir(path.join(rootDir, "skills"), { recursive: true });
    await writeFile(path.join(rootDir, "skills", "stale.txt"), "stale");
    await mkdir(path.join(rootDir, ".codex-plugin"), { recursive: true });
    await writeFile(path.join(rootDir, ".codex-plugin", "plugin.json"), "old");
    await mkdir(path.join(rootDir, ".claude-plugin"), { recursive: true });
    const claudePath = path.join(rootDir, ".claude-plugin", "plugin.json");
    const unownedSibling = path.join(rootDir, ".claude-plugin", "notes.txt");
    await writeFile(claudePath, "stale-provider");
    await writeFile(unownedSibling, "preserve sibling");
    await symlink(
      path.join(rootDir, "missing-readme-target"),
      path.join(rootDir, "README.md"),
      "file",
    );
    const plan = createPlan();

    // WHEN: The plan is written twice.
    const first = await writePlan(rootDir, plan);
    const second = await writePlan(rootDir, plan);

    // THEN: Selected writes, desired-absent deletion, and the shared tree converge without touching siblings.
    assert.deepEqual(first.changedPaths, [
      claudeManifest,
      codexManifest,
      skillsRoot,
    ]);
    assert.deepEqual(second.changedPaths, []);
    assert.deepEqual(second.unchangedPaths, [
      claudeManifest,
      codexManifest,
      skillsRoot,
    ]);
    assert.equal(
      await readFile(path.join(rootDir, skillFile), "utf8"),
      "# Generated alpha\n",
    );
    await assert.rejects(readFile(claudePath, "utf8"), /ENOENT/u);
    assert.equal(await readFile(unownedSibling, "utf8"), "preserve sibling");
    assert.deepEqual(
      (await readdir(rootDir)).filter((name) =>
        name.startsWith(".plugin-compiler-"),
      ),
      [],
    );
  });

  it("finishes tree staging before changing exact provider files", async () => {
    // GIVEN: Exact write and deletion changes are paired with a tree artifact that cannot be staged.
    const rootDir = await createFilesystemRepository();
    await mkdir(path.join(rootDir, ".codex-plugin"), { recursive: true });
    const codexPath = path.join(rootDir, ".codex-plugin", "plugin.json");
    await writeFile(codexPath, "preserved");
    await mkdir(path.join(rootDir, ".claude-plugin"), { recursive: true });
    const claudePath = path.join(rootDir, ".claude-plugin", "plugin.json");
    await writeFile(claudePath, "also-preserved");

    // WHEN: Writing the plan fails during tree staging.
    const write = writePlan(rootDir, createPlan({ longTreePath: true }));

    // THEN: Neither exact write nor deletion occurs and no staging residue remains.
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
    assert.equal(await readFile(claudePath, "utf8"), "also-preserved");
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
    const write = writePlan(rootDir, createPlan());

    // THEN: Physical path safety rejects the plan before an external write.
    await assert.rejects(write, /contains symbolic link/u);
    assert.equal((await readdir(externalRoot)).includes("plugin.json"), false);
  });

  it("preflights an unsafe exact deletion before mutating another exact file", async () => {
    // GIVEN: A desired-absent parent points outside while a selected file needs replacement.
    const rootDir = await createFilesystemRepository();
    const externalRoot = await createFilesystemRepository();
    const externalManifest = path.join(externalRoot, "plugin.json");
    await writeFile(externalManifest, "must remain");
    await symlink(externalRoot, path.join(rootDir, ".claude-plugin"), "dir");
    await mkdir(path.join(rootDir, ".codex-plugin"), { recursive: true });
    const codexPath = path.join(rootDir, ".codex-plugin", "plugin.json");
    await writeFile(codexPath, "preserved before preflight failure");

    // WHEN: The mixed exact-file plan is written.
    const write = writePlan(rootDir, createPlan());

    // THEN: Symlink safety rejects deletion before either exact target changes.
    await assert.rejects(write, /contains symbolic link/u);
    assert.equal(await readFile(externalManifest, "utf8"), "must remain");
    assert.equal(
      await readFile(codexPath, "utf8"),
      "preserved before preflight failure",
    );
  });
});
