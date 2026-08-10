import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface PackageManifest {
  readonly name?: unknown;
  readonly scripts?: unknown;
  readonly version?: unknown;
}

interface ProcessResult {
  readonly exitCode: number | null;
  readonly stderr: string;
  readonly stdout: string;
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeTypesDependency = "@types/node@22.20.1";

function fail(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function run(
  command: string,
  arguments_: readonly string[],
  cwd: string,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...arguments_], {
      cwd,
      shell: process.platform === "win32" && command.endsWith(".cmd"),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
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
    child.once("close", (exitCode) => resolve({ exitCode, stderr, stdout }));
  });
}

function requireSuccess(result: ProcessResult, operation: string): void {
  if (result.exitCode !== 0) {
    fail(
      `${operation} failed with exit code ${result.exitCode}\n${result.stdout}${result.stderr}`,
    );
  }
}

async function readManifest(filePath: string): Promise<PackageManifest> {
  const value: unknown = JSON.parse(await readFile(filePath, "utf8"));
  if (!isRecord(value)) fail(`${filePath} must contain a JSON object`);
  return value;
}

function requireIdentity(
  manifest: PackageManifest,
  label: string,
): { readonly name: string; readonly version: string } {
  if (
    typeof manifest.name !== "string" ||
    typeof manifest.version !== "string"
  ) {
    fail(`${label} must contain string name and version fields`);
  }
  return { name: manifest.name, version: manifest.version };
}

function rejectInstallScripts(manifest: PackageManifest): void {
  if (!isRecord(manifest.scripts)) return;
  for (const name of ["preinstall", "install", "postinstall"]) {
    if (manifest.scripts[name] !== undefined) {
      fail(`Packed package contains forbidden ${name} script`);
    }
  }
}

async function main(): Promise<void> {
  const [artifactArgument] = process.argv.slice(2);
  if (
    process.argv.length !== 3 ||
    artifactArgument === undefined ||
    !artifactArgument.endsWith(".tgz")
  ) {
    fail(
      "Usage: node --experimental-strip-types scripts/verify-packed-artifact.ts <artifact.tgz>",
    );
  }

  const artifactPath = path.resolve(artifactArgument);
  if (!(await stat(artifactPath)).isFile()) {
    fail(`Package artifact is not a file: ${artifactPath}`);
  }

  const sourceIdentity = requireIdentity(
    await readManifest(path.join(projectRoot, "package.json")),
    "Source package.json",
  );
  const consumerRoot = await mkdtemp(
    path.join(tmpdir(), "ptlam-agent-plugin-compiler-package-"),
  );

  try {
    await writeFile(
      path.join(consumerRoot, "package.json"),
      '{"private":true,"type":"module"}\n',
      "utf8",
    );
    const install = await run(
      npmExecutable,
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--no-package-lock",
        "--save-dev",
        artifactPath,
        nodeTypesDependency,
      ],
      consumerRoot,
    );
    requireSuccess(install, "Clean consumer installation");

    const installedRoot = path.join(
      consumerRoot,
      "node_modules",
      ...sourceIdentity.name.split("/"),
    );
    const installedManifest = await readManifest(
      path.join(installedRoot, "package.json"),
    );
    const installedIdentity = requireIdentity(
      installedManifest,
      "Installed package.json",
    );
    if (
      installedIdentity.name !== sourceIdentity.name ||
      installedIdentity.version !== sourceIdentity.version
    ) {
      fail(
        `Installed ${installedIdentity.name}@${installedIdentity.version}; expected ${sourceIdentity.name}@${sourceIdentity.version}`,
      );
    }
    rejectInstallScripts(installedManifest);

    const installedSchemaPath = path.join(
      installedRoot,
      "dist",
      "schemas",
      "v1",
      "plugin-manifest.schema.json",
    );
    if (!(await stat(installedSchemaPath)).isFile()) {
      fail(`Installed schema resource is not a file: ${installedSchemaPath}`);
    }
    const installedSchema: unknown = JSON.parse(
      await readFile(installedSchemaPath, "utf8"),
    );
    if (
      !isRecord(installedSchema) ||
      installedSchema["$id"] !==
        "https://raw.githubusercontent.com/fam-tung-lam/ptlam-agent-plugin-compiler/main/src/schemas/v1/plugin-manifest.schema.json"
    ) {
      fail("Installed manifest schema has an unexpected $id");
    }

    await writeFile(
      path.join(consumerRoot, "consumer.ts"),
      `import { AgentPluginCompiler, ArtifactKind, CLAUDE, CODEX, ClaudeProviderAdapter, CodexProviderAdapter, OwnershipKind, ProviderAdapterRegistry, createPlanFragment, createProjectPath, createProviderId, type Artifact, type CheckResult, type CompileResult, type CompilerOptionsInput, type Ownership, type PlanFragment, type PlanFragmentInput, type Plugin, type PluginManifest, type ProjectPath, type ProviderAdapter, type ProviderContext, type ProviderId, type ValidateResult } from ${JSON.stringify(sourceIdentity.name)};\n\n` +
        `const externalId: ProviderId = createProviderId("external");\n` +
        `const externalPath: ProjectPath = createProjectPath(".external-plugin/plugin.json");\n` +
        `const externalAdapter: ProviderAdapter = Object.freeze({\n` +
        `  id: externalId,\n` +
        `  compile(context: ProviderContext): PlanFragment {\n` +
        `    const input = { ownerId: externalId, ownership: { kind: OwnershipKind.ExactFiles, paths: [externalPath] }, artifacts: [{ kind: ArtifactKind.File, path: externalPath, content: new TextEncoder().encode(context.plugin.name) }] } satisfies PlanFragmentInput;\n` +
        `    return createPlanFragment(input);\n` +
        `  },\n` +
        `});\n` +
        `const registry = new ProviderAdapterRegistry().register(externalAdapter);\n` +
        `const options = { rootDir: ".", providers: [externalId] } satisfies CompilerOptionsInput;\n` +
        `const compiler = new AgentPluginCompiler(options, registry);\n` +
        `const validation: Promise<ValidateResult> = compiler.validate();\n` +
        `const check: Promise<CheckResult> = compiler.check();\n` +
        `const compilation: Promise<CompileResult> = compiler.compile();\n` +
        `const fragment: PlanFragment = externalAdapter.compile({ plugin: null as unknown as Plugin });\n` +
        `const artifact: Artifact | undefined = fragment.artifacts[0];\n` +
        `const ownership: Ownership = fragment.ownership;\n` +
        `const manifest = null as unknown as PluginManifest;\n` +
        `void [validation, check, compilation, artifact, ownership, manifest, CLAUDE, CODEX, ClaudeProviderAdapter, CodexProviderAdapter];\n`,
      "utf8",
    );
    await writeFile(
      path.join(consumerRoot, "tsconfig.json"),
      `${JSON.stringify(
        {
          compilerOptions: {
            module: "NodeNext",
            noEmit: true,
            strict: true,
            target: "ES2024",
            types: ["node"],
          },
          files: ["consumer.ts"],
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    const compileConsumer = await run(
      process.execPath,
      [
        path.join(projectRoot, "node_modules", "typescript", "bin", "tsc"),
        "--project",
        path.join(consumerRoot, "tsconfig.json"),
      ],
      consumerRoot,
    );
    requireSuccess(compileConsumer, "Installed TypeScript declarations");

    const importPackage = await run(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `const namespace = await import(${JSON.stringify(sourceIdentity.name)});\n` +
          `const names = Object.keys(namespace).sort();\n` +
          `if (JSON.stringify(names) !== '["AgentPluginCompiler","ArtifactKind","CLAUDE","CODEX","ClaudeProviderAdapter","CodexProviderAdapter","OwnershipKind","ProviderAdapterRegistry","createPlanFragment","createProjectPath","createProviderId"]') throw new Error(\`Unexpected exports: \${names.join(", ")}\`);\n` +
          `if (namespace.CLAUDE !== "claude" || namespace.CODEX !== "codex") throw new Error("Unexpected built-in provider IDs");\n` +
          `const externalId = namespace.createProviderId("external");\n` +
          `const externalPath = namespace.createProjectPath(".external-plugin/plugin.json");\n` +
          `const fragment = namespace.createPlanFragment({ ownerId: externalId, ownership: { kind: namespace.OwnershipKind.ExactFiles, paths: [externalPath] }, artifacts: [{ kind: namespace.ArtifactKind.File, path: externalPath, content: new TextEncoder().encode("external") }] });\n` +
          `const empty = new namespace.ProviderAdapterRegistry();\n` +
          `const registered = empty.register({ id: externalId, compile: () => fragment });\n` +
          `if (empty.list().length !== 0 || registered.resolve([externalId])[0]?.id !== externalId) throw new Error("Unexpected registry behavior");`,
      ],
      consumerRoot,
    );
    requireSuccess(importPackage, "Package root import");

    const binary = path.join(
      consumerRoot,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "plugin-compiler.cmd" : "plugin-compiler",
    );
    const help = await run(binary, ["--help"], consumerRoot);
    requireSuccess(help, "Installed plugin-compiler --help");
    if (!help.stdout.startsWith("Usage: plugin-compiler")) {
      fail(`Installed CLI returned unexpected help output:\n${help.stdout}`);
    }
    if (!help.stdout.includes("--provider <id>")) {
      fail(`Installed CLI help omits provider selection:\n${help.stdout}`);
    }

    process.stdout.write(
      `Verified ${sourceIdentity.name}@${sourceIdentity.version} from ${path.basename(artifactPath)} in a clean consumer.\n`,
    );
  } finally {
    await rm(consumerRoot, { force: true, recursive: true });
  }
}

await main();
