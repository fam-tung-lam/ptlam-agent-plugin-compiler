import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, it, onTestFinished } from "vitest";

import {
  FilesystemDiagnosticReason,
  SourceEntryKind,
} from "../../../../src/core/index.ts";
import { readPluginSource } from "../../../../src/filesystem/index.ts";
import { createFilesystemRepository } from "./test-fixtures/filesystem-repository-fixture.ts";

describe("readPluginSource", () => {
  it("reads flat, grouped, and empty skill directories in project-path order", async () => {
    // GIVEN: Authored skills use mixed source depths beside an empty grouping directory.
    const rootDir = await createFilesystemRepository();
    const nestedParent = path.join(
      rootDir,
      "plugin",
      "skills",
      "projects",
      "health-connector",
    );
    await mkdir(nestedParent, { recursive: true });
    await rename(
      path.join(rootDir, "plugin", "skills", "alpha-skill"),
      path.join(nestedParent, "alpha-skill"),
    );
    await mkdir(path.join(rootDir, "plugin", "skills", "beta-skill"));
    await writeFile(
      path.join(rootDir, "plugin", "skills", "beta-skill", "SKILL.md"),
      "# Beta\n",
    );
    await mkdir(path.join(rootDir, "plugin", "skills", "empty-group"));

    // WHEN: The bounded authored tree is read recursively.
    const snapshot = await readPluginSource(rootDir);

    // THEN: Group directories and all skill entries are preserved in deterministic order.
    assert.deepEqual(
      snapshot.source.skillEntries.map((entry) => entry.path),
      [
        "plugin/skills/beta-skill",
        "plugin/skills/beta-skill/SKILL.md",
        "plugin/skills/empty-group",
        "plugin/skills/projects",
        "plugin/skills/projects/health-connector",
        "plugin/skills/projects/health-connector/alpha-skill",
        "plugin/skills/projects/health-connector/alpha-skill/SKILL.md",
        "plugin/skills/projects/health-connector/alpha-skill/references",
        "plugin/skills/projects/health-connector/alpha-skill/references/data.bin",
      ],
    );
    assert.deepEqual(snapshot.diagnostics, []);
  });

  it("returns deterministic defensive source facts and aggregated path diagnostics", async () => {
    // GIVEN: Valid source files coexist with a source symlink and an unrelated root README link.
    const rootDir = await createFilesystemRepository();
    await symlink(
      path.join(rootDir, "missing-readme-target"),
      path.join(rootDir, "README.md"),
      "file",
    );
    await symlink(
      path.join(rootDir, "outside.md"),
      path.join(
        rootDir,
        "plugin",
        "skills",
        "alpha-skill",
        "references",
        "linked.md",
      ),
      "file",
    );

    // WHEN: The bounded authored tree is read.
    const snapshot = await readPluginSource(rootDir);

    // THEN: Successful entries are ordered and immutable while the symlink is a recoverable fact.
    assert.deepEqual(
      snapshot.source.skillEntries.map((entry) => entry.path),
      [
        "plugin/skills/alpha-skill",
        "plugin/skills/alpha-skill/SKILL.md",
        "plugin/skills/alpha-skill/references",
        "plugin/skills/alpha-skill/references/data.bin",
      ],
    );
    assert.equal(snapshot.diagnostics.length, 1);
    assert.equal(
      snapshot.diagnostics[0]?.reason,
      FilesystemDiagnosticReason.Symlink,
    );
    assert.equal(Object.isFrozen(snapshot), true);
    assert.equal(Object.isFrozen(snapshot.diagnostics), true);
    const resource = snapshot.source.skillEntries.find(
      (entry) =>
        entry.kind === SourceEntryKind.File && entry.path.endsWith("data.bin"),
    );
    assert.ok(resource?.kind === SourceEntryKind.File);
    resource.content.fill(7);
    assert.deepEqual(resource.content, Buffer.from([0, 255, 1]));
  });

  it("rejects a linked repository root before following it", async () => {
    // GIVEN: The supplied repository root is a link to a valid repository.
    const realRoot = await createFilesystemRepository();
    const parent = await mkdtemp(
      path.join(tmpdir(), "plugin-linked-root-test-"),
    );
    onTestFinished(() => rm(parent, { force: true, recursive: true }));
    const linkedRoot = path.join(parent, "repository");
    await symlink(realRoot, linkedRoot, "dir");

    // WHEN: Source inspection starts from the linked root.
    const inspection = readPluginSource(linkedRoot);

    // THEN: The root fails closed before any authored path is traversed.
    await assert.rejects(inspection, /root must be a real directory/u);
  });

  it("reports both missing authored roots without inspecting project documentation", async () => {
    // GIVEN: A real repository directory has neither manifest nor authored skills.
    const rootDir = await mkdtemp(
      path.join(tmpdir(), "plugin-missing-source-test-"),
    );
    onTestFinished(() => rm(rootDir, { force: true, recursive: true }));
    await symlink(
      path.join(rootDir, "missing-readme-target"),
      path.join(rootDir, "README.md"),
      "file",
    );

    // WHEN: The bounded source reader inspects the repository.
    const snapshot = await readPluginSource(rootDir);

    // THEN: Only the two authored compiler inputs produce diagnostics.
    assert.deepEqual(
      snapshot.diagnostics.map(({ path: diagnosticPath, reason }) => ({
        path: diagnosticPath,
        reason,
      })),
      [
        {
          path: "plugin/plugin.yml",
          reason: FilesystemDiagnosticReason.Missing,
        },
        {
          path: "plugin/skills",
          reason: FilesystemDiagnosticReason.Missing,
        },
      ],
    );
  });

  it("reports wrong source kinds as recoverable diagnostics", async () => {
    // GIVEN: The manifest is a directory and the skills root is a regular file.
    const rootDir = await mkdtemp(
      path.join(tmpdir(), "plugin-wrong-source-kind-test-"),
    );
    onTestFinished(() => rm(rootDir, { force: true, recursive: true }));
    await mkdir(path.join(rootDir, "plugin", "plugin.yml"), {
      recursive: true,
    });
    await writeFile(path.join(rootDir, "plugin", "skills"), "not a tree\n");

    // WHEN: The bounded source reader inspects both authored paths.
    const snapshot = await readPluginSource(rootDir);

    // THEN: Both kind failures are aggregated instead of aborting the read.
    assert.deepEqual(
      snapshot.diagnostics.map(({ path: diagnosticPath, reason }) => ({
        path: diagnosticPath,
        reason,
      })),
      [
        {
          path: "plugin/plugin.yml",
          reason: FilesystemDiagnosticReason.UnsupportedKind,
        },
        {
          path: "plugin/skills",
          reason: FilesystemDiagnosticReason.UnsupportedKind,
        },
      ],
    );
  });
});
