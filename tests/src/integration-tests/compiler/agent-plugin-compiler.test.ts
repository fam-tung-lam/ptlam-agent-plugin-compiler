import assert from "node:assert/strict";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { describe, it, vi } from "vitest";
import {
  AgentPluginCompiler,
  HookDiagnosticReason,
  HookDiagnosticStatus,
} from "../../../../src/compiler/index.ts";
import { PluginValidationError } from "../../../../src/compiler/validation/index.ts";
import {
  ArtifactKind,
  createGeneratedSnapshot,
  createPlanFragment,
  createProjectPath,
  createProviderId,
  DriftReason,
  OwnershipKind,
  type ProviderAdapter,
} from "../../../../src/core/index.ts";
import * as filesystem from "../../../../src/filesystem/index.ts";
import {
  CODEX,
  ProviderAdapterRegistry,
} from "../../../../src/providers/index.ts";
import {
  addAdaptiveHook,
  createCompilerRepository,
  DISABLED_CLAUDE_BYTES,
  DISABLED_CLAUDE_MARKETPLACE_BYTES,
  removeAdaptiveHook,
} from "./test-fixtures/compiler-repository-fixture.ts";

function codexCompiler(rootDir: string): AgentPluginCompiler {
  return new AgentPluginCompiler({ rootDir, providers: [CODEX] });
}

describe("AgentPluginCompiler", () => {
  it("compiles shared hook resources and native configuration with drift detection", async () => {
    // GIVEN: A valid plugin declares one two-stage adaptive hook for Codex.
    const rootDir = await createCompilerRepository();
    await addAdaptiveHook(rootDir);
    const compiler = codexCompiler(rootDir);

    // WHEN: The public facade compiles and a generated handler is then changed.
    const compiled = await compiler.compile();
    const generatedRequest = path.join(
      rootDir,
      "hooks",
      "handlers",
      "adaptive-interaction",
      "request.mjs",
    );
    await writeFile(generatedRequest, "externally changed\n");
    const checked = await compiler.check();

    // THEN: One shared handler tree, one native config, and structured status are observable.
    assert.equal(compiled.verified, true);
    assert.deepEqual(compiled.hookDiagnostics, [
      {
        provider: CODEX,
        hook: "adaptive-interaction",
        status: HookDiagnosticStatus.Generated,
      },
    ]);
    assert.equal(
      (await lstat(path.join(rootDir, "hooks", "codex-hooks.json"))).isFile(),
      true,
    );
    assert.match(
      await readFile(
        path.join(rootDir, ".codex-plugin", "plugin.json"),
        "utf8",
      ),
      /hooks\/codex-hooks\.json/u,
    );
    assert.deepEqual(checked.drift, [
      {
        path: "hooks/handlers/adaptive-interaction/request.mjs",
        reason: DriftReason.ContentDiffers,
      },
    ]);
  });

  it("removes stale v2 hook output after the declaration is removed", async () => {
    // GIVEN: A v2 plugin has compiled one portable hook for Codex.
    const rootDir = await createCompilerRepository();
    await addAdaptiveHook(rootDir);
    const compiler = codexCompiler(rootDir);
    await compiler.compile();
    await removeAdaptiveHook(rootDir);

    // WHEN: The current desired state is checked and reconciled.
    const checked = await compiler.check();
    const compiled = await compiler.compile();

    // THEN: The config and resources are diagnosed, removed, and left verified.
    assert.equal(
      checked.drift.some(
        (entry) => String(entry.path) === "hooks/codex-hooks.json",
      ),
      true,
    );
    assert.equal(
      checked.drift.some((entry) =>
        String(entry.path).startsWith("hooks/handlers/"),
      ),
      true,
    );
    assert.equal(compiled.verified, true);
    await assert.rejects(
      lstat(path.join(rootDir, "hooks", "codex-hooks.json")),
      {
        code: "ENOENT",
      },
    );
    assert.deepEqual(
      await readdir(path.join(rootDir, "hooks", "handlers")),
      [],
    );
  });

  it("skips hooks non-fatally for an incompatible provider without fallback output", async () => {
    // GIVEN: A valid hooked plugin selects an external adapter with no hook capability.
    const rootDir = await createCompilerRepository();
    await addAdaptiveHook(rootDir);
    const providerId = createProviderId("external");
    const outputPath = createProjectPath(".external-plugin/plugin.json");
    const adapter = Object.freeze({
      id: providerId,
      compile: () =>
        createPlanFragment({
          ownerId: providerId,
          ownership: {
            kind: OwnershipKind.ExactFiles,
            paths: [outputPath],
          },
          artifacts: [
            {
              kind: ArtifactKind.File,
              path: outputPath,
              content: Buffer.from("external\n"),
            },
          ],
        }),
    }) satisfies ProviderAdapter;
    const compiler = new AgentPluginCompiler(
      { rootDir, providers: [providerId] },
      new ProviderAdapterRegistry([adapter]),
    );

    // WHEN: Compilation resolves compatibility and writes all other output.
    const result = await compiler.compile();

    // THEN: Provider output succeeds, the hook is skipped, and no emulation is installed.
    assert.equal(result.verified, true);
    assert.deepEqual(result.hookDiagnostics, [
      {
        provider: providerId,
        hook: "adaptive-interaction",
        status: HookDiagnosticStatus.Skipped,
        reason: HookDiagnosticReason.ProviderDoesNotSupportHooks,
      },
    ]);
    assert.equal(
      await readFile(path.join(rootDir, outputPath), "utf8"),
      "external\n",
    );
    assert.equal(
      (await lstat(path.join(rootDir, "hooks", "handlers"))).isDirectory(),
      true,
    );
    await assert.rejects(
      lstat(
        path.join(
          rootDir,
          "hooks",
          "handlers",
          ".runtime",
          "portable-hook-dispatcher.mjs",
        ),
      ),
      { code: "ENOENT" },
    );
    await assert.rejects(lstat(path.join(rootDir, "AGENTS.md")), {
      code: "ENOENT",
    });
    const generatedSkills = await readFile(
      path.join(rootDir, "skills", "README.md"),
      "utf8",
    );
    assert.doesNotMatch(generatedSkills, /adaptive-interaction/u);
  });
  it("compiles only the shared skills tree for an empty provider selection", async () => {
    // GIVEN: A valid repository explicitly overrides its manifest with no providers.
    const rootDir = await createCompilerRepository();
    const compiler = new AgentPluginCompiler({ rootDir, providers: [] });

    // WHEN: The public facade compiles and verifies the selected plan.
    const result = await compiler.compile();

    // THEN: Shared skills are written and every registered provider manifest is absent.
    assert.equal(result.verified, true);
    assert.deepEqual(result.providers, []);
    assert.equal(result.providerSelectionSource, "override");
    assert.deepEqual(result.writeResult.changedPaths, [
      ".claude-plugin/marketplace.json",
      ".claude-plugin/plugin.json",
      "skills",
    ]);
    assert.equal(
      (await lstat(path.join(rootDir, "skills"))).isDirectory(),
      true,
    );
    await assert.rejects(
      lstat(path.join(rootDir, ".claude-plugin", "plugin.json")),
      { code: "ENOENT" },
    );
    await assert.rejects(
      lstat(path.join(rootDir, ".claude-plugin", "marketplace.json")),
      { code: "ENOENT" },
    );
    await assert.rejects(lstat(path.join(rootDir, ".codex-plugin")), {
      code: "ENOENT",
    });
  });

  it("uses the authored provider selection when no override is supplied", async () => {
    // GIVEN: A valid manifest selects Codex and the compiler receives only a root directory.
    const rootDir = await createCompilerRepository();
    const compiler = new AgentPluginCompiler({ rootDir });

    // WHEN: The public facade compiles without an explicit provider override.
    const result = await compiler.compile();

    // THEN: The manifest selection is reported and becomes the complete provider state.
    assert.deepEqual(result.providers, [CODEX]);
    assert.equal(result.providerSelectionSource, "manifest");
    assert.equal(
      (
        await lstat(path.join(rootDir, ".codex-plugin", "plugin.json"))
      ).isFile(),
      true,
    );
    await assert.rejects(
      lstat(path.join(rootDir, ".claude-plugin", "plugin.json")),
      { code: "ENOENT" },
    );
  });

  it("rejects an unknown authored provider through the instance registry", async () => {
    // GIVEN: A valid manifest names a provider that the built-in registry does not contain.
    const rootDir = await createCompilerRepository();
    const manifestPath = path.join(rootDir, "plugin", "plugin.yml");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      providers: string[];
    };
    manifest.providers = ["future"];
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    // WHEN: Validation resolves the manifest-owned selection.
    const validation = new AgentPluginCompiler({ rootDir }).validate();

    // THEN: The existing registry error identifies the unavailable provider.
    await assert.rejects(validation, /unknown provider "future"/u);
  });

  it("uses an injected registry for an external provider", async () => {
    // GIVEN: One compiler instance receives a registry containing only an external adapter.
    const rootDir = await createCompilerRepository();
    const providerId = createProviderId("external");
    const outputPath = createProjectPath(".external-plugin/plugin.json");
    const adapter = Object.freeze({
      id: providerId,
      compile: () =>
        createPlanFragment({
          ownerId: providerId,
          ownership: {
            kind: OwnershipKind.ExactFiles,
            paths: [outputPath],
          },
          artifacts: [
            {
              kind: ArtifactKind.File,
              path: outputPath,
              content: Buffer.from("external\n", "utf8"),
            },
          ],
        }),
    }) satisfies ProviderAdapter;
    const registry = new ProviderAdapterRegistry([adapter]);
    const compiler = new AgentPluginCompiler(
      { rootDir, providers: [providerId] },
      registry,
    );

    // WHEN: The public facade compiles the selected provider.
    const result = await compiler.compile();

    // THEN: The external artifact is verified without enabling either built-in.
    assert.equal(result.verified, true);
    assert.deepEqual(result.providers, [providerId]);
    assert.equal(result.providerSelectionSource, "override");
    assert.equal(
      await readFile(path.join(rootDir, outputPath), "utf8"),
      "external\n",
    );
    await assert.rejects(lstat(path.join(rootDir, ".codex-plugin")), {
      code: "ENOENT",
    });
  });

  it("reconciles an unselected custom adapter's stable exact file", async () => {
    // GIVEN: A custom provider owns one stale exact file beside an unrelated sibling.
    const rootDir = await createCompilerRepository();
    const providerId = createProviderId("external");
    const outputPath = createProjectPath(".external-plugin/plugin.json");
    const adapter = Object.freeze({
      id: providerId,
      compile: () =>
        createPlanFragment({
          ownerId: providerId,
          ownership: {
            kind: OwnershipKind.ExactFiles,
            paths: [outputPath],
          },
          artifacts: [
            {
              kind: ArtifactKind.File,
              path: outputPath,
              content: Buffer.from("external\n", "utf8"),
            },
          ],
        }),
    }) satisfies ProviderAdapter;
    const providerRoot = path.join(rootDir, ".external-plugin");
    await mkdir(providerRoot);
    await writeFile(path.join(rootDir, outputPath), "stale\n");
    const siblingPath = path.join(providerRoot, "notes.txt");
    await writeFile(siblingPath, "preserve\n");
    const compiler = new AgentPluginCompiler(
      { rootDir, providers: [] },
      new ProviderAdapterRegistry([adapter]),
    );

    // WHEN: Compilation reconciles the registry with the explicit empty override.
    const result = await compiler.compile();

    // THEN: The custom exact file is removed while its unowned sibling survives.
    assert.equal(result.verified, true);
    assert.equal(
      result.writeResult.changedPaths.some(
        (entry) => String(entry) === outputPath,
      ),
      true,
    );
    await assert.rejects(lstat(path.join(rootDir, outputPath)), {
      code: "ENOENT",
    });
    assert.equal(await readFile(siblingPath, "utf8"), "preserve\n");
  });

  it("rejects complete-tree ownership from a provider adapter", async () => {
    // GIVEN: A custom adapter violates the stable exact-file provider contract.
    const rootDir = await createCompilerRepository();
    const providerId = createProviderId("external");
    const outputRoot = createProjectPath("external-output");
    const adapter = Object.freeze({
      id: providerId,
      compile: () =>
        createPlanFragment({
          ownerId: providerId,
          ownership: {
            kind: OwnershipKind.CompleteTree,
            root: outputRoot,
          },
          artifacts: [
            {
              kind: ArtifactKind.Directory,
              path: outputRoot,
            },
          ],
        }),
    }) satisfies ProviderAdapter;
    const compiler = new AgentPluginCompiler(
      { rootDir, providers: [providerId] },
      new ProviderAdapterRegistry([adapter]),
    );

    // WHEN: The provider contribution is planned.
    const compilation = compiler.compile();

    // THEN: The public contract fails before any generated output is mutated.
    await assert.rejects(
      compilation,
      /Provider adapter "external" must declare exact-file ownership/u,
    );
    await assert.rejects(lstat(path.join(rootDir, "skills")), {
      code: "ENOENT",
    });
  });

  it("checks the complete desired provider state without writing", async () => {
    // GIVEN: Common and Codex outputs are absent while unselected Claude bytes exist.
    const rootDir = await createCompilerRepository();

    // WHEN: The selected write plan is checked.
    const result = await codexCompiler(rootDir).check();

    // THEN: Check is read-only and reports both missing selected and stale unselected paths.
    assert.equal(result.upToDate, false);
    assert.deepEqual(result.providers, [CODEX]);
    assert.equal(result.providerSelectionSource, "override");
    await assert.rejects(lstat(path.join(rootDir, "skills")), {
      code: "ENOENT",
    });
    await assert.rejects(lstat(path.join(rootDir, ".codex-plugin")), {
      code: "ENOENT",
    });
    assert.equal(
      result.drift.some((entry) => String(entry.path).startsWith("skills")),
      true,
    );
    assert.equal(
      result.drift.some((entry) => entry.path === ".codex-plugin/plugin.json"),
      true,
    );
    assert.equal(
      result.drift.some((entry) =>
        String(entry.path).startsWith(".claude-plugin"),
      ),
      true,
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
    assert.equal(Object.isFrozen(result.drift), true);
  });

  it("compiles and verifies the complete effective provider state", async () => {
    // GIVEN: A valid repository has a missing selected output and stale unselected Claude bytes.
    const rootDir = await createCompilerRepository();
    const compiler = codexCompiler(rootDir);

    // WHEN: The same selected plan is compiled twice and then checked.
    const first = await compiler.compile();
    const second = await compiler.compile();
    const checked = await compiler.check();

    // THEN: The first write creates selected output, removes stale output, and becomes current.
    assert.equal(first.verified, true);
    assert.deepEqual(first.writeResult.changedPaths, [
      ".claude-plugin/marketplace.json",
      ".claude-plugin/plugin.json",
      ".codex-plugin/plugin.json",
      "skills",
    ]);
    assert.deepEqual(second.writeResult.changedPaths, []);
    assert.equal(
      second.writeResult.unchangedPaths.some(
        (entry) => String(entry) === ".codex-plugin/plugin.json",
      ),
      true,
    );
    assert.equal(
      second.writeResult.unchangedPaths.some(
        (entry) => String(entry) === "skills",
      ),
      true,
    );
    assert.equal(checked.upToDate, true);
    await assert.rejects(
      lstat(path.join(rootDir, ".claude-plugin", "plugin.json")),
      { code: "ENOENT" },
    );
    await assert.rejects(
      lstat(path.join(rootDir, ".claude-plugin", "marketplace.json")),
      { code: "ENOENT" },
    );
    assert.equal(
      (await lstat(path.join(rootDir, "README.md"))).isSymbolicLink(),
      true,
    );
    assert.equal(Object.isFrozen(first.writeResult), true);
    assert.equal(Object.isFrozen(first.writeResult.changedPaths), true);
    assert.equal(Object.isFrozen(first.providers), true);
  });

  it("reports a wrong-kind managed path as drift", async () => {
    // GIVEN: Verified outputs are externally changed from a file into a directory.
    const rootDir = await createCompilerRepository();
    const compiler = codexCompiler(rootDir);
    await compiler.compile();
    const codexManifest = path.join(rootDir, ".codex-plugin", "plugin.json");
    await rm(codexManifest);
    await mkdir(codexManifest);

    // WHEN: The public read-only check compares the generated snapshot.
    const result = await compiler.check();

    // THEN: The terminal kind mismatch is reported instead of aborting the check.
    assert.equal(result.upToDate, false);
    assert.deepEqual(result.drift, [
      {
        path: ".codex-plugin/plugin.json",
        reason: DriftReason.KindDiffers,
      },
    ]);
  });

  it("reports failed post-write verification from reread facts", async () => {
    // GIVEN: The writer is real but the post-write filesystem reread diverges.
    const rootDir = await createCompilerRepository();
    vi.spyOn(filesystem, "readGeneratedSnapshot").mockResolvedValue(
      createGeneratedSnapshot({ entries: [] }),
    );

    // WHEN: Compilation writes and then verifies the selected plan.
    const result = await codexCompiler(rootDir).compile();

    // THEN: Divergent reread facts make verified success unrepresentable.
    assert.equal(result.verified, false);
    assert.notEqual(result.drift.length, 0);
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
