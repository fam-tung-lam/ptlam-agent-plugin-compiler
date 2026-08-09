import { mkdir } from "node:fs/promises";
import path from "node:path";

import { compareSemVer } from "./compare-semver.ts";
import {
  type CommandRunner,
  requireEnvironment,
  requireSuccess,
  runScript,
  sleep,
  systemCommandRunner,
} from "./run-script.ts";

const EXPECTED_PROVENANCE_TYPE = "https://slsa.dev/provenance/v1";

export interface RegistryRelease {
  readonly distTagVersion: string;
  readonly integrity: string;
  readonly provenanceType: string;
  readonly shasum: string;
  readonly version: string;
}

export interface PackageReleaseReader {
  readRelease(
    packageName: string,
    packageVersion: string,
    npmTag: string,
  ): Promise<RegistryRelease | undefined>;
  verifyConsumer(packageSpec: string): Promise<void>;
}

export interface ExpectedPackageRelease {
  readonly integrity: string;
  readonly npmTag: string;
  readonly packageName: string;
  readonly packageVersion: string;
  readonly publishedNow: boolean;
  readonly shasum: string;
}

export async function verifyPackageRelease(
  expected: ExpectedPackageRelease,
  reader: PackageReleaseReader,
  options: {
    readonly delay?: (milliseconds: number) => Promise<void>;
    readonly intervalMilliseconds?: number;
    readonly maximumAttempts?: number;
  } = {},
): Promise<void> {
  const delay = options.delay ?? sleep;
  const intervalMilliseconds = options.intervalMilliseconds ?? 5_000;
  const maximumAttempts = options.maximumAttempts ?? 12;
  let release: RegistryRelease | undefined;
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    release = await reader.readRelease(
      expected.packageName,
      expected.packageVersion,
      expected.npmTag,
    );
    if (release !== undefined) break;
    if (attempt < maximumAttempts) await delay(intervalMilliseconds);
  }
  if (release === undefined) {
    throw new Error("npm did not return the published version in time.");
  }
  if (release.version !== expected.packageVersion) {
    throw new Error(`npm returned unexpected version ${release.version}.`);
  }
  if (
    release.integrity !== expected.integrity ||
    release.shasum !== expected.shasum
  ) {
    throw new Error("npm returned different package bytes.");
  }
  if (release.provenanceType !== EXPECTED_PROVENANCE_TYPE) {
    throw new Error(
      `npm returned unexpected provenance ${release.provenanceType}.`,
    );
  }
  if (expected.publishedNow) {
    if (release.distTagVersion !== expected.packageVersion) {
      throw new Error(
        `${expected.npmTag} does not point to the published version.`,
      );
    }
  } else if (
    compareSemVer(release.distTagVersion, expected.packageVersion) < 0
  ) {
    throw new Error(
      `${expected.npmTag} is behind released version ${expected.packageVersion}.`,
    );
  }
  await reader.verifyConsumer(
    `${expected.packageName}@${expected.packageVersion}`,
  );
}

async function npmView(
  runner: CommandRunner,
  packageSpec: string,
  field: string,
): Promise<string | undefined> {
  const result = await runner.run("npm", ["view", packageSpec, field]);
  if (result.exitCode === 0) return result.stdout.trim();
  if (result.stderr.includes("E404")) return undefined;
  requireSuccess(result, `Read ${field} for ${packageSpec}`);
  throw new Error("Unreachable npm lookup state.");
}

function commandReader(
  runner: CommandRunner,
  consumerDirectory: string,
): PackageReleaseReader {
  return {
    async readRelease(packageName, packageVersion, npmTag) {
      const packageSpec = `${packageName}@${packageVersion}`;
      const version = await npmView(runner, packageSpec, "version");
      if (version === undefined) return undefined;
      const [integrity, shasum, distTagVersion, provenanceType] =
        await Promise.all([
          npmView(runner, packageSpec, "dist.integrity"),
          npmView(runner, packageSpec, "dist.shasum"),
          npmView(runner, packageName, `dist-tags.${npmTag}`),
          npmView(
            runner,
            packageSpec,
            "dist.attestations.provenance.predicateType",
          ),
        ]);
      if (
        integrity === undefined ||
        shasum === undefined ||
        distTagVersion === undefined ||
        provenanceType === undefined
      ) {
        throw new Error("npm returned incomplete release metadata.");
      }
      return { distTagVersion, integrity, provenanceType, shasum, version };
    },
    async verifyConsumer(packageSpec) {
      await mkdir(consumerDirectory, { recursive: true });
      requireSuccess(
        await runner.run("npm", ["init", "--yes"], { cwd: consumerDirectory }),
        "Initialize registry consumer",
      );
      requireSuccess(
        await runner.run(
          "npm",
          ["install", packageSpec, "--save-exact", "--ignore-scripts"],
          { cwd: consumerDirectory },
        ),
        "Install registry package",
      );
      requireSuccess(
        await runner.run("npm", ["audit", "signatures"], {
          cwd: consumerDirectory,
        }),
        "Verify registry signatures",
      );
    },
  };
}

runScript(import.meta.url, async () => {
  const publishedNow = requireEnvironment(process.env, "PUBLISHED_NOW");
  if (publishedNow !== "true" && publishedNow !== "false") {
    throw new Error("PUBLISHED_NOW must be true or false.");
  }
  const runnerTemp = requireEnvironment(process.env, "RUNNER_TEMP");
  await verifyPackageRelease(
    {
      integrity: requireEnvironment(process.env, "TARBALL_INTEGRITY"),
      npmTag: requireEnvironment(process.env, "NPM_TAG"),
      packageName: requireEnvironment(process.env, "PACKAGE_NAME"),
      packageVersion: requireEnvironment(process.env, "PACKAGE_VERSION"),
      publishedNow: publishedNow === "true",
      shasum: requireEnvironment(process.env, "TARBALL_SHASUM"),
    },
    commandReader(
      systemCommandRunner,
      path.join(runnerTemp, "registry-consumer"),
    ),
  );
});
