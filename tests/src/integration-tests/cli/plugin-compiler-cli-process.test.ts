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

import { CliCommand, CliExitCode } from "../../../../src/cli/index.ts";

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
  providers = ["claude", "codex"],
}: {
  readonly invalidManifest?: boolean;
  readonly providers?: readonly string[];
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
${providers.length === 0 ? "providers: []" : `providers:\n${providers.map((provider) => `  - ${provider}`).join("\n")}`}
name: fixture-skills
description: Fixture plugin.
version: "0.1.0"
author:
  name: Fixture Owner
homepage: https://example.test/readme
repository: https://example.test/repository
license: MIT
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

async function useDependencyDepthViolation(rootDir: string): Promise<void> {
  const manifestPath = path.join(rootDir, "plugin", "plugin.yml");
  const skillIds = ["skill-a", "skill-b", "skill-c", "skill-d"];
  const manifest = {
    schema_version: 2,
    providers: ["claude", "codex"],
    config: { skill_dependency_depth_limit: 3 },
    name: "fixture-skills",
    description: "Fixture plugin.",
    version: "0.1.0",
    author: { name: "Fixture Owner" },
    homepage: "https://example.test/readme",
    repository: "https://example.test/repository",
    license: "MIT",
    keywords: ["agent-skills"],
    categories: [
      {
        id: "engineering",
        name: "Engineering",
        description: "Engineering skills.",
      },
    ],
    skills: [
      {
        id: "fixture-skill",
        description: "Existing fixture source.",
        category_id: "engineering",
        visibility: "public",
        status: "active",
        required_skills: [],
      },
      ...skillIds.map((skillId, index) => ({
        id: skillId,
        description: `Fixture ${skillId}.`,
        category_id: "engineering",
        visibility: index === 0 ? "public" : "internal",
        status: "active",
        required_skills:
          index === skillIds.length - 1
            ? []
            : [
                {
                  skill_id: skillIds[index + 1],
                  reason: "Provides the next dependency layer.",
                  instructions: "Read the next layer first.",
                },
              ],
      })),
    ],
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  for (const skill of manifest.skills) {
    const skillId = String(skill["id"]);
    const skillDirectory = path.join(rootDir, "plugin", "skills", skillId);
    await mkdir(skillDirectory, { recursive: true });
    await writeFile(
      path.join(skillDirectory, "SKILL.md"),
      `# ${skillId}\n\n<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->\n`,
    );
  }
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
    const compilation = await runCli(["compile"], rootDir);
    await writeFile(manifestPath, "user-owned: true\n", "utf8");
    const second = await runCli(["init"], rootDir);

    // THEN: The starter is documented, immediately usable, and never replaces user content.
    assert.equal(first.exitCode, CliExitCode.Success);
    assert.match(first.stdout, /Plugin source initialized/u);
    assert.match(initialManifest, /# TODO: Replace this example identifier/u);
    assert.match(initialManifest, /providers: \[\]/u);
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
    assert.match(
      validation.stdout,
      /providers: none; provider source: manifest/u,
    );
    assert.match(validation.stdout, /Validated example-agent-plugin@0\.1\.0/u);
    assert.match(validation.stdout, /3 skills in 2 categories/u);
    assert.equal(compilation.exitCode, CliExitCode.Success);
    assert.match(
      compilation.stdout,
      /providers: none; provider source: manifest/u,
    );
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
    for (const providerManifest of [
      ".claude-plugin/marketplace.json",
      ".claude-plugin/plugin.json",
      ".codex-plugin/plugin.json",
      "gemini-extension.json",
      "kimi.plugin.json",
      "plugin.json",
    ]) {
      await assert.rejects(lstat(path.join(rootDir, providerManifest)), {
        code: "ENOENT",
      });
    }
    assert.equal(second.exitCode, CliExitCode.Success);
    assert.match(second.stdout, /already initialized/u);
    assert.equal(await readFile(manifestPath, "utf8"), "user-owned: true\n");
    assert.equal(first.stderr, "");
    assert.equal(validation.stderr, "");
    assert.equal(compilation.stderr, "");
    assert.equal(second.stderr, "");
  });

  it.each(["--help", "-h"])(
    "renders the command overview through the executable entrypoint with %s",
    async (helpFlag) => {
      // GIVEN: The built executable is available without any plugin repository input.

      // WHEN: A child process requests root help with either supported flag.
      const result = await runCli([helpFlag]);

      // THEN: Help succeeds on stdout with all commands and no compiler diagnostic.
      assert.equal(result.exitCode, CliExitCode.Success);
      assert.match(
        result.stdout,
        /Usage: plugin-compiler \[OPTIONS\] <COMMAND>/u,
      );
      assert.match(result.stdout, /Commands:\n {2}init\s/u);
      assert.match(result.stdout, /\n {2}validate\s/u);
      assert.match(result.stdout, /\n {2}check\s/u);
      assert.match(result.stdout, /\n {2}compile\s/u);
      assert.doesNotMatch(result.stdout, /\n {2}generate\s/u);
      assert.match(
        result.stdout,
        /Possible values: claude, codex, copilot, gemini, kimi/u,
      );
      assert.match(result.stdout, /plugin\/plugin\.yml providers/u);
      assert.match(result.stdout, /--no-providers/u);
      assert.equal(result.stderr, "");
    },
  );

  it.each(
    Object.values(CliCommand).flatMap((command) =>
      ["--help", "-h"].map((helpFlag) => ({ command, helpFlag })),
    ),
  )(
    "renders only $command help through the executable entrypoint with $helpFlag",
    async ({ command, helpFlag }) => {
      // GIVEN: One recognized command and either supported help flag.

      // WHEN: A child process requests focused command help.
      const result = await runCli([command, helpFlag]);

      // THEN: Help succeeds with the command's options and without the root command list.
      assert.equal(result.exitCode, CliExitCode.Success);
      assert.match(
        result.stdout,
        new RegExp(`Usage: plugin-compiler ${command} \\[OPTIONS\\]`, "u"),
      );
      assert.match(result.stdout, /--root <path>/u);
      if (command === CliCommand.Init) {
        assert.doesNotMatch(result.stdout, /--provider <id>/u);
        assert.doesNotMatch(result.stdout, /--no-providers/u);
      } else {
        assert.match(result.stdout, /--provider <id>/u);
        assert.match(result.stdout, /--no-providers/u);
        assert.match(
          result.stdout,
          /possible values: claude, codex, copilot, gemini, kimi/u,
        );
        assert.match(result.stdout, /default: plugin\/plugin\.yml providers/u);
      }
      assert.match(result.stdout, /-h, --help/u);
      assert.doesNotMatch(result.stdout, /Commands:/u);
      assert.equal(result.stderr, "");
    },
  );

  it("validates a real fixture through the executable entrypoint", async () => {
    // GIVEN: A valid authored plugin repository and the real compiler composition.
    const rootDir = await createFixtureRepository();

    // WHEN: A child Node process runs validate through the emitted executable entrypoint.
    const result = await runCli(["validate", "--root", rootDir]);

    // THEN: The process succeeds with the manifest provider scope and plugin result.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(result.stdout, /providers: claude, codex/u);
    assert.match(result.stdout, /provider source: manifest/u);
    assert.match(result.stdout, /Validated fixture-skills@0\.1\.0/u);
    assert.equal(result.stderr, "");
  });

  it("accepts comma-separated providers through the executable entrypoint", async () => {
    // GIVEN: A valid authored plugin repository and both built-in provider IDs.
    const rootDir = await createFixtureRepository();

    // WHEN: A child process validates with one comma-separated provider flag.
    const result = await runCli([
      "validate",
      "--root",
      rootDir,
      "--provider",
      "codex,claude",
    ]);

    // THEN: The process succeeds and reports both providers in stable order.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(result.stdout, /providers: claude, codex/u);
    assert.match(result.stdout, /provider source: override/u);
    assert.match(result.stdout, /Validated fixture-skills@0\.1\.0/u);
    assert.equal(result.stderr, "");
  });

  it("returns failure when a real read-only check observes drift", async () => {
    // GIVEN: A valid source repository has no generated skills or provider outputs.
    const rootDir = await createFixtureRepository();

    // WHEN: A child process checks the selected output plan.
    const result = await runCli(["check", "--root", rootDir]);

    // THEN: Drift is a process failure and identifies managed shared and provider output.
    assert.equal(result.exitCode, CliExitCode.Failure);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Output check found \d+ drift entries/u);
    assert.match(result.stderr, /skills\/README\.md/u);
    assert.match(result.stderr, /\.claude-plugin\/plugin\.json/u);
    assert.match(result.stderr, /\.codex-plugin\/plugin\.json/u);
    assert.match(result.stderr, /provider source: manifest/u);
  });

  it("compiles the manifest-selected providers by default", async () => {
    // GIVEN: A valid authored repository selects Claude and Codex in its manifest.
    const rootDir = await createFixtureRepository();

    // WHEN: Compilation omits every CLI provider option.
    const result = await runCli(["compile", "--root", rootDir]);

    // THEN: The manifest selection is effective and only its provider files exist.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(result.stdout, /providers: claude, codex/u);
    assert.match(result.stdout, /provider source: manifest/u);
    assert.equal(result.stderr, "");
    for (const manifestPath of [
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json",
      ".codex-plugin/plugin.json",
    ]) {
      assert.equal(
        (await lstat(path.join(rootDir, manifestPath))).isFile(),
        true,
      );
    }
    for (const manifestPath of [
      "plugin.json",
      "gemini-extension.json",
      "kimi.plugin.json",
    ]) {
      await assert.rejects(lstat(path.join(rootDir, manifestPath)), {
        code: "ENOENT",
      });
    }
  });

  it("compiles only the shared tree for an explicit empty override without changing root README", async () => {
    // GIVEN: A valid authored repository contains ordinary human-owned project documentation.
    const rootDir = await createFixtureRepository();
    const readmePath = path.join(rootDir, "README.md");
    const readmeBefore = await readFile(readmePath);

    // WHEN: Compilation explicitly overrides the manifest selection with none.
    const result = await runCli([
      "compile",
      "--root",
      rootDir,
      "--no-providers",
    ]);

    // THEN: Shared skills exist while all provider manifests remain absent.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(result.stdout, /providers: none/u);
    assert.match(result.stdout, /provider source: override/u);
    assert.equal(result.stderr, "");
    const [catalog, readmeAfter] = await Promise.all([
      readFile(path.join(rootDir, "skills", "README.md"), "utf8"),
      readFile(readmePath),
    ]);
    assert.match(catalog, /`fixture-skill`/u);
    assert.deepEqual(readmeAfter, readmeBefore);
    for (const manifestPath of [
      ".claude-plugin/plugin.json",
      ".codex-plugin/plugin.json",
      "plugin.json",
      "gemini-extension.json",
      "kimi.plugin.json",
    ]) {
      await assert.rejects(lstat(path.join(rootDir, manifestPath)), {
        code: "ENOENT",
      });
    }
  });

  it("compiles every explicitly selected provider manifest", async () => {
    // GIVEN: A valid repository has no generated provider artifacts.
    const rootDir = await createFixtureRepository();

    // WHEN: Compilation selects all public provider IDs in reverse order.
    const result = await runCli([
      "compile",
      "--root",
      rootDir,
      "--provider",
      "kimi,gemini,copilot,codex,claude",
    ]);

    // THEN: The shared tree and all provider manifests are generated in stable order.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(
      result.stdout,
      /providers: claude, codex, copilot, gemini, kimi/u,
    );
    assert.match(result.stdout, /provider source: override/u);
    assert.equal(result.stderr, "");
    const manifestPaths = [
      ".claude-plugin/plugin.json",
      ".codex-plugin/plugin.json",
      "plugin.json",
      "gemini-extension.json",
      "kimi.plugin.json",
    ];
    for (const manifestPath of manifestPaths) {
      assert.equal(
        (await lstat(path.join(rootDir, manifestPath))).isFile(),
        true,
      );
    }
  });

  it("compiles only the explicitly selected provider surface", async () => {
    // GIVEN: A valid repository has no generated provider artifacts.
    const rootDir = await createFixtureRepository();

    // WHEN: Compilation selects only Codex through one provider flag.
    const result = await runCli([
      "compile",
      "--root",
      rootDir,
      "--provider",
      "codex",
    ]);

    // THEN: Shared and Codex output exist while Claude remains untouched.
    assert.equal(result.exitCode, CliExitCode.Success);
    assert.match(result.stdout, /providers: codex/u);
    assert.match(result.stdout, /provider source: override/u);
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

  it.each(["validate", "check", "compile"])(
    "returns validation failure for dependency depth through CLI %s",
    async (command) => {
      // GIVEN: A schema-v2 repository reaches its exclusive depth limit.
      const rootDir = await createFixtureRepository();
      await useDependencyDepthViolation(rootDir);

      // WHEN: The executable runs one validating operation.
      const result = await runCli([command, "--root", rootDir]);

      // THEN: Every command exits one with the same actionable diagnostic.
      assert.equal(result.exitCode, CliExitCode.Failure);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /Plugin validation failed/u);
      assert.match(
        result.stderr,
        /skill "skill-a" reaches configured dependency depth limit 3 through skill-a -> skill-b -> skill-c -> skill-d/u,
      );
      assert.match(
        result.stderr,
        /plugin\/plugin\.yml#\/config\/skill_dependency_depth_limit/u,
      );
    },
  );

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
      providerArguments: ["--provider", "claude", "--provider", "codex"],
      expected: /--provider may be specified only once/u,
    },
    {
      providerArguments: ["--provider", "claude", "--no-providers"],
      expected: /mutually exclusive/u,
    },
    {
      providerArguments: ["--no-providers", "--provider", "claude"],
      expected: /mutually exclusive/u,
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
