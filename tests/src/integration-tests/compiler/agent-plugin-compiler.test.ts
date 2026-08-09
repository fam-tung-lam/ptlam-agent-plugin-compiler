import assert from "node:assert/strict";
import { lstat, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, it, vi } from "vitest";
import { AgentPluginCompiler } from "../../../../src/compiler/index.ts";
import {
  createOutputState,
  PluginValidationError,
} from "../../../../src/core/index.ts";
import * as filesystem from "../../../../src/filesystem/index.ts";
import { Provider } from "../../../../src/providers/index.ts";
import {
  createCompilerRepository,
  DISABLED_CLAUDE_BYTES,
  DISABLED_CLAUDE_MARKETPLACE_BYTES,
} from "./test-fixtures/compiler-repository-fixture.ts";

function codexCompiler(rootDir: string): AgentPluginCompiler {
  return new AgentPluginCompiler({ rootDir, providers: [Provider.Codex] });
}

describe("AgentPluginCompiler", () => {
  it("checks the common tree and enabled provider without writing", async () => {
    // GIVEN: Common and Codex outputs are absent while disabled Claude bytes exist.
    const rootDir = await createCompilerRepository();

    // WHEN: The selected output plan is checked.
    const result = await codexCompiler(rootDir).check();

    // THEN: Check is read-only and excludes every disabled-provider path.
    assert.equal(result.upToDate, false);
    await assert.rejects(lstat(path.join(rootDir, "skills")), {
      code: "ENOENT",
    });
    await assert.rejects(lstat(path.join(rootDir, ".codex-plugin")), {
      code: "ENOENT",
    });
    assert.equal(
      result.differences.some((difference) =>
        String(difference.path).startsWith("skills"),
      ),
      true,
    );
    assert.equal(
      result.differences.some(
        (difference) => difference.path === ".codex-plugin/plugin.json",
      ),
      true,
    );
    assert.equal(
      result.differences.some((difference) =>
        String(difference.path).startsWith(".claude-plugin"),
      ),
      false,
    );
    assert.equal(
      await readFile(
        path.join(rootDir, ".claude-plugin", "plugin.json"),
        "utf8",
      ),
      DISABLED_CLAUDE_BYTES,
    );
    assert.equal(
      await readFile(
        path.join(rootDir, ".claude-plugin", "marketplace.json"),
        "utf8",
      ),
      DISABLED_CLAUDE_MARKETPLACE_BYTES,
    );
    assert.equal(
      (await lstat(path.join(rootDir, "README.md"))).isSymbolicLink(),
      true,
    );
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.differences), true);
  });

  it("compiles and verifies only the common tree and enabled provider", async () => {
    // GIVEN: A valid repository has stale selected outputs and disabled Claude bytes.
    const rootDir = await createCompilerRepository();
    const compiler = codexCompiler(rootDir);

    // WHEN: The same selected plan is compiled twice and then checked.
    const first = await compiler.compile();
    const second = await compiler.compile();
    const checked = await compiler.check();

    // THEN: The first write changes exact selected ownership and later becomes current.
    assert.equal(first.verified, true);
    assert.deepEqual(first.writeResult.changedPaths, [
      ".codex-plugin/plugin.json",
      "skills",
    ]);
    assert.deepEqual(second.writeResult.changedPaths, []);
    assert.deepEqual(second.writeResult.unchangedPaths, [
      ".codex-plugin/plugin.json",
      "skills",
    ]);
    assert.equal(checked.upToDate, true);
    assert.equal(
      await readFile(
        path.join(rootDir, ".claude-plugin", "plugin.json"),
        "utf8",
      ),
      DISABLED_CLAUDE_BYTES,
    );
    assert.equal(
      await readFile(
        path.join(rootDir, ".claude-plugin", "marketplace.json"),
        "utf8",
      ),
      DISABLED_CLAUDE_MARKETPLACE_BYTES,
    );
    assert.equal(
      (await lstat(path.join(rootDir, "README.md"))).isSymbolicLink(),
      true,
    );
    assert.equal(Object.isFrozen(first.writeResult), true);
    assert.equal(Object.isFrozen(first.writeResult.changedPaths), true);
  });

  it("reports failed post-write verification from reread facts", async () => {
    // GIVEN: The writer is real but the post-write filesystem reread diverges.
    const rootDir = await createCompilerRepository();
    vi.spyOn(filesystem, "readOutputState").mockResolvedValue(
      createOutputState({ entries: [] }),
    );

    // WHEN: Compilation writes and then verifies the selected plan.
    const result = await codexCompiler(rootDir).compile();

    // THEN: Divergent reread facts make verified success unrepresentable.
    assert.equal(result.verified, false);
    assert.notEqual(result.differences.length, 0);
  });

  it("aggregates filesystem and core diagnostics before any write", async () => {
    // GIVEN: One source symlink and an independently invalid manifest exist.
    const rootDir = await createCompilerRepository();
    await symlink(
      path.join(rootDir, "outside-source"),
      path.join(rootDir, "plugin", "skills", "alpha-skill", "linked.md"),
      "file",
    );
    await writeFile(
      path.join(rootDir, "plugin", "plugin.yml"),
      '{"schema_version":1,"name":"broken"}\n',
      "utf8",
    );

    // WHEN: Compilation attempts to load and validate the authored snapshot.
    const compilation = codexCompiler(rootDir).compile();

    // THEN: One validation error contains both fact and semantic failures before writes.
    await assert.rejects(compilation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      assert.equal(
        error.errors.some((message) => message.includes("symbolic link")),
        true,
      );
      assert.equal(
        error.errors.some((message) => message.includes("required property")),
        true,
      );
      return true;
    });
    await assert.rejects(lstat(path.join(rootDir, "skills")), {
      code: "ENOENT",
    });
    await assert.rejects(lstat(path.join(rootDir, ".codex-plugin")), {
      code: "ENOENT",
    });
  });

  it("reports one canonical error when the manifest is unavailable", async () => {
    // GIVEN: The canonical manifest file is missing from an otherwise valid source tree.
    const rootDir = await createCompilerRepository();
    await rm(path.join(rootDir, "plugin", "plugin.yml"));

    // WHEN: Validation loads the filesystem snapshot.
    const validation = codexCompiler(rootDir).validate();

    // THEN: The filesystem fact is reported once without a redundant Core sentinel.
    await assert.rejects(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      assert.deepEqual(error.errors, [
        "plugin/plugin.yml: source file is missing",
      ]);
      return true;
    });
  });
});
