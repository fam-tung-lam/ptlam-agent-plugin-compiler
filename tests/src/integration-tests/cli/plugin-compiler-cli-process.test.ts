import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, onTestFinished } from "vitest";

import { CliExitCode } from "../../../../src/cli/index.ts";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);
const cliPath = path.join(repositoryRoot, "dist/bin.js");

interface ProcessResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function runCli(
  argv: readonly string[],
  currentWorkingDirectory = repositoryRoot,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...argv], {
      cwd: currentWorkingDirectory,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}

async function createFixtureRepository({
  invalidManifest = false,
}: {
  readonly invalidManifest?: boolean;
} = {}): Promise<string> {
  const rootDir = await mkdtemp(
    path.join(tmpdir(), "ptlam-plugin-cli-process-"),
  );
  onTestFinished(() => rm(rootDir, { recursive: true, force: true }));
  const skillDirectory = path.join(
    rootDir,
    "plugin",
    "skills",
    "fixture-skill",
  );
  await mkdir(skillDirectory, { recursive: true });
  await writeFile(
    path.join(rootDir, "plugin", "plugin.yml"),
    `schema_version: 1
name: fixture-skills
description: Fixture plugin.
version: "0.1.0"
author:
  name: Fixture Owner
homepage: https://example.test/readme
repository: https://example.test/repository
license: MIT
keywords: [agent-skills]
marketplace:
  name: fixture
  description: Fixture marketplace.
  plugin_description: Fixture listing.
  category: development
  keywords: [agent-skills]
categories:
  - id: engineering
    name: Engineering
    description: Engineering skills.
skills:
  - id: fixture-skill
    description: Exercise the compiler process.
    category_id: engineering
    visibility: public
    status: active
    required_skills: []
${invalidManifest ? "unexpected: true\n" : ""}`,
    "utf8",
  );
  await writeFile(
    path.join(skillDirectory, "SKILL.md"),
    "# Fixture skill\n\n<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->\n",
    "utf8",
  );
  await writeFile(
    path.join(rootDir, "README.md"),
    "# Human-owned project documentation\n",
    "utf8",
  );
  return rootDir;
}

describe("plugin compiler CLI process", () => {
  it("initializes missing source paths and preserves them on repeated runs", async () => {
    // GIVEN: An empty real directory will become an authored plugin repository.
    const rootDir = await mkdtemp(
      path.join(tmpdir(), "ptlam-plugin-cli-init-"),
    );
    onTestFinished(() => rm(rootDir, { recursive: true, force: true }));

    // WHEN: Init targets the directory through --root before the default-root commands run there.
    const first = await runCli(["init", "--root", rootDir]);
    const manifestPath = path.join(rootDir, "plugin", "plugin.yml");
    const initialManifest = await readFile(manifestPath, "utf8");
    const validation = await runCli(["validate"], rootDir);
    const generation = await runCli(["generate"], rootDir);
    await writeFile(manifestPath, "user-owned: true\n", "utf8");
    const second = await runCli(["init"], rootDir);

    // THEN: The starter is documented, immediately usable, and never replaces user content.
    assert.equal(first.exitCode, CliExitCode.Success);
    assert.match(first.stdout, /Plugin source initialized/u);
    assert.match(initialManifest, /# TODO: Replace this example identifier/u);
    assert.match(
      initialManifest,
      /visibility: public # Possible values: internal, public\./u,
    );
    assert.match(
      initialManifest,
      /status: active # Possible values: draft, active, deprecated, archived\./u,
    );
    assert.match(initialManifest, /# Standalone public skill example/u);
    assert.match(initialManifest, /# Required\/internal skill example/u);
    assert.match(initialManifest, /skill_id: inspect-repository/u);
    assert.equal(
      (await lstat(path.join(rootDir, "plugin"))).isDirectory(),
      true,
    );
    assert.equal(
      (await lstat(path.join(rootDir, "plugin", "skills"))).isDirectory(),
      true,
    );
    assert.equal(validation.exitCode, CliExitCode.Success);
    assert.match(validation.stdout, /Validated example-agent-plugin@0\.1\.0/u);
    assert.match(validation.stdout, /3 skills in 2 categories/u);
    assert.equal(generation.exitCode, CliExitCode.Success);
    assert.equal(
      (
        await lstat(
          path.join(
            rootDir,
            "skills",
            "prepare-change-plan",
            "skills",
            "inspect-repository",
            "SKILL.md",
          ),
        )
      ).isFile(),
      true,
    );
    assert.equal(second.exitCode, CliExitCode.Success);
    assert.match(second.stdout, /already initialized/u);
    assert.equal(await readFile(manifestPath, "utf8"), "user-owned: true\n");
    assert.equal(first.stderr, "");
    assert.equal(validation.stderr, "");
    assert.equal(generation.stderr, "");
    assert.equal(second.stderr, "");
  });

  it("validates a real fixture through the executable entrypoint", async () => {
    // GIVEN: A valid authored plugin repository and the real compiler composition.
    const rootDir = await createFixtureRepository();

    // WHEN: A child Node process runs validate through the emitted executable entrypoint.
    const result = await runCli(["validate", "--root", rootDir]);

    // THEN: The process succeeds and communicates both provider scope and plugin result.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(result.stdout, /providers: claude, codex/u);
    assert.match(result.stdout, /Validated fixture-skills@0\.1\.0/u);
    assert.equal(result.stderr, "");
  });

  it("returns failure when a real read-only check observes drift", async () => {
    // GIVEN: A valid source repository has no generated skills or provider outputs.
    const rootDir = await createFixtureRepository();

    // WHEN: A child process checks the selected output plan.
    const result = await runCli(["check", "--root", rootDir]);

    // THEN: Drift is a process failure and identifies compiler-owned output paths.
    assert.equal(result.exitCode, CliExitCode.Failure);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Output check found \d+ drift entries/u);
    assert.match(result.stderr, /skills\/README\.md/u);
    assert.match(result.stderr, /\.codex-plugin\/plugin\.json/u);
  });

  it("generates the shared catalog and both provider surfaces without changing root README", async () => {
    // GIVEN: A valid authored repository contains ordinary human-owned project documentation.
    const rootDir = await createFixtureRepository();
    const readmePath = path.join(rootDir, "README.md");
    const readmeBefore = await readFile(readmePath);

    // WHEN: The repository-default generate command runs without provider flags.
    const result = await runCli(["generate", "--root", rootDir]);

    // THEN: Shared skills and every default provider artifact coexist after one run.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(result.stdout, /providers: claude, codex/u);
    assert.equal(result.stderr, "");
    const [catalog, claudePlugin, claudeMarketplace, codexPlugin, readmeAfter] =
      await Promise.all([
        readFile(path.join(rootDir, "skills", "README.md"), "utf8"),
        readFile(path.join(rootDir, ".claude-plugin", "plugin.json"), "utf8"),
        readFile(
          path.join(rootDir, ".claude-plugin", "marketplace.json"),
          "utf8",
        ),
        readFile(path.join(rootDir, ".codex-plugin", "plugin.json"), "utf8"),
        readFile(readmePath),
      ]);
    assert.match(catalog, /`fixture-skill`/u);
    assert.deepEqual(JSON.parse(claudePlugin).skills, [
      "./skills/fixture-skill",
    ]);
    assert.equal(JSON.parse(claudeMarketplace).plugins[0]?.source, "./");
    assert.equal(JSON.parse(codexPlugin).skills, "./skills/");
    assert.deepEqual(readmeAfter, readmeBefore);
  });

  it("generates only the explicitly selected provider surface", async () => {
    // GIVEN: A valid repository has no generated provider artifacts.
    const rootDir = await createFixtureRepository();

    // WHEN: Generation selects only Codex through a repeated-capable provider flag.
    const result = await runCli([
      "generate",
      "--root",
      rootDir,
      "--provider",
      "codex",
    ]);

    // THEN: Shared and Codex output exist while Claude remains untouched.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(result.stdout, /providers: codex/u);
    assert.doesNotMatch(result.stdout, /providers: claude/u);
    assert.equal(
      JSON.parse(
        await readFile(
          path.join(rootDir, ".codex-plugin", "plugin.json"),
          "utf8",
        ),
      ).skills,
      "./skills/",
    );
    await assert.rejects(lstat(path.join(rootDir, ".claude-plugin")), {
      code: "ENOENT",
    });
  });

  it("returns failure for invalid authored manifest data", async () => {
    // GIVEN: A fixture repository violates the closed manifest schema.
    const rootDir = await createFixtureRepository({ invalidManifest: true });

    // WHEN: The executable validates the repository.
    const result = await runCli(["validate", "--root", rootDir]);

    // THEN: Validation fails with an aggregated compiler diagnostic.
    assert.equal(result.exitCode, CliExitCode.Failure);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Plugin validation failed/u);
    assert.match(result.stderr, /unexpected/u);
  });

  it.each([
    {
      providerArguments: ["--provider", "Claude!"],
      expected: /Invalid provider identifier/u,
    },
    {
      providerArguments: ["--provider", "future"],
      expected: /unknown provider/u,
    },
    {
      providerArguments: ["--provider", "codex", "--provider", "codex"],
      expected: /duplicate provider/u,
    },
  ])(
    "returns usage exit semantics for invalid provider selection: $providerArguments",
    async ({ providerArguments, expected }) => {
      // GIVEN: The executable receives one malformed, unknown, or duplicate provider.

      // WHEN: The child process parses the provider selection.
      const result = await runCli(["validate", ...providerArguments]);

      // THEN: Provider misuse is reported before compiler construction.
      assert.equal(result.exitCode, CliExitCode.Usage);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, expected);
      assert.match(result.stderr, /Usage: plugin-compiler/u);
    },
  );

  it("returns usage exit semantics without constructing the compiler", async () => {
    // GIVEN: The executable receives no command.

    // WHEN: A child process runs the CLI entrypoint without arguments.
    const result = await runCli([]);

    // THEN: Usage is printed to stderr with process exit code two.
    assert.equal(result.exitCode, CliExitCode.Usage);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Usage: plugin-compiler/u);
  });
});
