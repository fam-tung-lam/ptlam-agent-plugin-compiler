import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import {
  appendGitHubOutput,
  type CommandRunner,
  requireEnvironment,
  requireSuccess,
  runScript,
  systemCommandRunner,
} from "./run-script.ts";

export interface PackedReleaseCandidate {
  readonly integrity: string;
  readonly name: string;
  readonly path: string;
  readonly shasum: string;
}

interface NpmPackResult {
  readonly filename?: unknown;
  readonly integrity?: unknown;
  readonly shasum?: unknown;
}

export interface PackReleaseCandidateDependencies {
  pack(packageDirectory: string): Promise<{
    readonly integrity: string;
    readonly shasum: string;
  }>;
  exercise(tarballPath: string): Promise<void>;
  listTarballs(packageDirectory: string): Promise<readonly string[]>;
}

export async function packReleaseCandidate(
  packageDirectory: string,
  dependencies: PackReleaseCandidateDependencies,
): Promise<PackedReleaseCandidate> {
  await mkdir(packageDirectory, { recursive: true });
  const packed = await dependencies.pack(packageDirectory);
  const tarballs = await dependencies.listTarballs(packageDirectory);
  if (tarballs.length !== 1) {
    throw new Error(
      `Expected exactly one package tarball in ${packageDirectory}; found ${tarballs.length}.`,
    );
  }
  const tarballPath = path.join(packageDirectory, tarballs[0] as string);
  await dependencies.exercise(tarballPath);
  return {
    integrity: packed.integrity,
    name: path.basename(tarballPath),
    path: tarballPath,
    shasum: packed.shasum,
  };
}

function commandDependencies(
  runner: CommandRunner,
): PackReleaseCandidateDependencies {
  return {
    async pack(packageDirectory) {
      const result = requireSuccess(
        await runner.run("npm", [
          "pack",
          "--json",
          "--ignore-scripts",
          "--pack-destination",
          packageDirectory,
        ]),
        "Pack release candidate",
      );
      const values = JSON.parse(result.stdout) as readonly NpmPackResult[];
      const value = values[0];
      if (
        values.length !== 1 ||
        value === undefined ||
        typeof value.integrity !== "string" ||
        typeof value.shasum !== "string"
      ) {
        throw new Error("npm pack returned invalid package metadata.");
      }
      return { integrity: value.integrity, shasum: value.shasum };
    },
    async exercise(tarballPath) {
      requireSuccess(
        await runner.run("npm", ["run", "test:package", "--", tarballPath]),
        "Exercise release candidate",
      );
    },
    async listTarballs(packageDirectory) {
      return (await readdir(packageDirectory)).filter((name) =>
        name.endsWith(".tgz"),
      );
    },
  };
}

runScript(import.meta.url, async () => {
  const packageDirectory = requireEnvironment(process.env, "PACKAGE_DIR");
  const outputPath = requireEnvironment(process.env, "GITHUB_OUTPUT");
  const candidate = await packReleaseCandidate(
    packageDirectory,
    commandDependencies(systemCommandRunner),
  );
  await appendGitHubOutput(outputPath, {
    integrity: candidate.integrity,
    name: candidate.name,
    path: candidate.path,
    shasum: candidate.shasum,
  });
});
