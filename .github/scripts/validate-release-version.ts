import { readFile } from "node:fs/promises";

import { requireGreaterSemVer } from "./compare-semver.ts";
import { validateReleaseChangelog } from "./release-notes.ts";
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

export interface ReleaseVersionRepository {
  fetch(commitSha: string): Promise<void>;
  readPackageJsonAt(commitSha: string): Promise<PackageManifest>;
  findTag(tagName: string): Promise<string | undefined>;
  readPublishedVersion(packageSpec: string): Promise<"absent" | "present">;
}

function packageIdentity(manifest: PackageManifest, label: string) {
  if (
    typeof manifest.name !== "string" ||
    typeof manifest.version !== "string"
  ) {
    throw new Error(`${label} must contain string name and version fields.`);
  }
  return { name: manifest.name, version: manifest.version };
}

export async function validateReleaseVersion(
  currentManifest: PackageManifest,
  currentChangelog: string,
  baseSha: string,
  repository: ReleaseVersionRepository,
): Promise<boolean> {
  const current = packageIdentity(currentManifest, "package.json");
  await repository.fetch(baseSha);
  const previous = packageIdentity(
    await repository.readPackageJsonAt(baseSha),
    `${baseSha}:package.json`,
  );
  if (current.version === previous.version) return false;

  requireGreaterSemVer(current.version, previous.version);
  const packageSpec = `${current.name}@${current.version}`;
  if ((await repository.readPublishedVersion(packageSpec)) === "present") {
    throw new Error(`${packageSpec} already exists on npm.`);
  }
  if ((await repository.findTag(`v${current.version}`)) !== undefined) {
    throw new Error(`v${current.version} already exists in Git.`);
  }
  validateReleaseChangelog(currentChangelog, previous.version, current.version);
  return true;
}

function commandRepository(runner: CommandRunner): ReleaseVersionRepository {
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
    async readPackageJsonAt(commitSha) {
      const result = requireSuccess(
        await runner.run("git", ["show", `${commitSha}:package.json`]),
        `Read package.json at ${commitSha}`,
      );
      return JSON.parse(result.stdout) as PackageManifest;
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
      return result.stdout.trim() || undefined;
    },
    async readPublishedVersion(packageSpec) {
      const result = await runner.run("npm", ["view", packageSpec, "version"]);
      if (result.exitCode === 0) return "present";
      if (result.stderr.includes("E404")) return "absent";
      requireSuccess(result, `Look up ${packageSpec} on npm`);
      throw new Error("Unreachable npm lookup state.");
    },
  };
}

runScript(import.meta.url, async () => {
  const baseSha = requireEnvironment(process.env, "BASE_SHA");
  const manifest = JSON.parse(
    await readFile("package.json", "utf8"),
  ) as PackageManifest;
  const changed = await validateReleaseVersion(
    manifest,
    await readFile("CHANGELOG.md", "utf8"),
    baseSha,
    commandRepository(systemCommandRunner),
  );
  process.stdout.write(
    changed
      ? "The package version is available for release.\n"
      : "The package version did not change.\n",
  );
});
