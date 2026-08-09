import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { requireGreaterSemVer } from "./compare-semver.ts";
import {
  type CommandRunner,
  requireEnvironment,
  requireSuccess,
  runScript,
  systemCommandRunner,
} from "./run-script.ts";

interface PackageManifest {
  readonly name?: unknown;
  readonly version?: unknown;
}

export interface ReleaseCandidateMetadata {
  readonly integrity: string;
  readonly npmTag: string;
  readonly packageName: string;
  readonly packageVersion: string;
  readonly prerelease: boolean;
  readonly releaseSha: string;
  readonly shasum: string;
  readonly shouldRelease: boolean;
  readonly tarballName: string;
}

export interface CandidateRepository {
  fetch(commitSha: string): Promise<void>;
  findTag(tagName: string): Promise<boolean>;
  readPackageJsonAt(commitSha: string): Promise<PackageManifest>;
  readRegistryIntegrity(packageSpec: string): Promise<"absent" | string>;
}

function requireIdentity(manifest: PackageManifest, label: string) {
  if (
    typeof manifest.name !== "string" ||
    typeof manifest.version !== "string"
  ) {
    throw new Error(`${label} must contain string name and version fields.`);
  }
  return { name: manifest.name, version: manifest.version };
}

export async function prepareReleaseCandidate(
  input: {
    readonly currentManifest: PackageManifest;
    readonly integrity: string;
    readonly previousSha: string;
    readonly releaseSha: string;
    readonly shasum: string;
    readonly tarballName: string;
  },
  repository: CandidateRepository,
): Promise<ReleaseCandidateMetadata> {
  const current = requireIdentity(input.currentManifest, "package.json");
  await repository.fetch(input.previousSha);
  const previous = requireIdentity(
    await repository.readPackageJsonAt(input.previousSha),
    `${input.previousSha}:package.json`,
  );
  const shouldRelease = current.version !== previous.version;
  let npmTag = "";
  let prerelease = false;

  if (shouldRelease) {
    requireGreaterSemVer(current.version, previous.version);
    const registryIntegrity = await repository.readRegistryIntegrity(
      `${current.name}@${current.version}`,
    );
    if (
      registryIntegrity !== "absent" &&
      registryIntegrity !== input.integrity
    ) {
      throw new Error("The existing npm version has different bytes.");
    }
    if (registryIntegrity !== "absent") {
      process.stdout.write(
        "The exact npm version already exists; preparing a safe resume.\n",
      );
    }
    if (await repository.findTag(`v${current.version}`)) {
      process.stdout.write(
        "The Git tag already exists; the release workflow will verify it.\n",
      );
    }
    prerelease = current.version.includes("-");
    npmTag = prerelease ? "next" : "latest";
  }

  return {
    integrity: input.integrity,
    npmTag,
    packageName: current.name,
    packageVersion: current.version,
    prerelease,
    releaseSha: input.releaseSha,
    shasum: input.shasum,
    shouldRelease,
    tarballName: input.tarballName,
  };
}

function commandRepository(runner: CommandRunner): CandidateRepository {
  return {
    async fetch(commitSha) {
      requireSuccess(
        await runner.run("git", [
          "fetch",
          "--no-tags",
          "--depth=1",
          "origin",
          commitSha,
        ]),
        `Fetch ${commitSha}`,
      );
    },
    async findTag(tagName) {
      const result = requireSuccess(
        await runner.run("git", [
          "ls-remote",
          "--tags",
          "origin",
          `refs/tags/${tagName}`,
        ]),
        `Look up ${tagName}`,
      );
      return result.stdout.trim().length > 0;
    },
    async readPackageJsonAt(commitSha) {
      const result = requireSuccess(
        await runner.run("git", ["show", `${commitSha}:package.json`]),
        `Read package.json at ${commitSha}`,
      );
      return JSON.parse(result.stdout) as PackageManifest;
    },
    async readRegistryIntegrity(packageSpec) {
      const result = await runner.run("npm", [
        "view",
        packageSpec,
        "dist.integrity",
      ]);
      if (result.exitCode === 0) return result.stdout.trim();
      if (result.stderr.includes("E404")) return "absent";
      requireSuccess(result, `Look up ${packageSpec} on npm`);
      throw new Error("Unreachable npm lookup state.");
    },
  };
}

runScript(import.meta.url, async () => {
  const runnerTemp = requireEnvironment(process.env, "RUNNER_TEMP");
  const candidateDirectory = path.join(runnerTemp, "release-candidate");
  const manifest = JSON.parse(
    await readFile("package.json", "utf8"),
  ) as PackageManifest;
  const metadata = await prepareReleaseCandidate(
    {
      currentManifest: manifest,
      integrity: requireEnvironment(process.env, "TARBALL_INTEGRITY"),
      previousSha: requireEnvironment(process.env, "PREVIOUS_SHA"),
      releaseSha: requireEnvironment(process.env, "GITHUB_SHA"),
      shasum: requireEnvironment(process.env, "TARBALL_SHASUM"),
      tarballName: requireEnvironment(process.env, "TARBALL_NAME"),
    },
    commandRepository(systemCommandRunner),
  );
  await mkdir(candidateDirectory, { recursive: true });
  await writeFile(
    path.join(candidateDirectory, "release-candidate.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );
});
