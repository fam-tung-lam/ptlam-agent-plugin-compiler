import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { parseSemVer } from "./compare-semver.ts";
import {
  appendGitHubOutput,
  appendGitHubSummary,
  type CommandRunner,
  requireEnvironment,
  requireSuccess,
  runScript,
  systemCommandRunner,
} from "./run-script.ts";
import { EXPECTED_PACKAGE_NAME } from "./validate-package-metadata.ts";

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

export interface InspectedTarball {
  readonly integrity: string;
  readonly packageName: string;
  readonly packageVersion: string;
  readonly shasum: string;
}

export interface ReleaseCandidateDependencies {
  inspectTarball(tarballPath: string): Promise<InspectedTarball>;
  readRegistryIntegrity(packageSpec: string): Promise<"absent" | string>;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  record: Readonly<Record<string, unknown>>,
  name: string,
): string {
  const value = record[name];
  if (typeof value !== "string") throw new Error(`${name} must be a string.`);
  return value;
}

export function parseReleaseCandidateMetadata(
  value: unknown,
  expectedSha: string,
): ReleaseCandidateMetadata {
  if (!isRecord(value))
    throw new Error("Release candidate metadata must be an object.");
  if (typeof value["shouldRelease"] !== "boolean") {
    throw new Error("shouldRelease must be a boolean.");
  }
  const packageName = requireString(value, "packageName");
  const releaseSha = requireString(value, "releaseSha");
  if (packageName !== EXPECTED_PACKAGE_NAME) {
    throw new Error(`Unexpected package name: ${packageName}`);
  }
  if (releaseSha !== expectedSha) {
    throw new Error(
      `Release candidate belongs to ${releaseSha}, not ${expectedSha}.`,
    );
  }

  const metadata: ReleaseCandidateMetadata = {
    integrity: requireString(value, "integrity"),
    npmTag: requireString(value, "npmTag"),
    packageName,
    packageVersion: requireString(value, "packageVersion"),
    prerelease:
      typeof value["prerelease"] === "boolean"
        ? value["prerelease"]
        : (() => {
            throw new Error("prerelease must be a boolean.");
          })(),
    releaseSha,
    shasum: requireString(value, "shasum"),
    shouldRelease: value["shouldRelease"],
    tarballName: requireString(value, "tarballName"),
  };
  if (!metadata.shouldRelease) return metadata;

  parseSemVer(metadata.packageVersion);
  if (!/^[0-9a-f]{40}$/.test(metadata.releaseSha)) {
    throw new Error("releaseSha must be a 40-character lowercase Git SHA.");
  }
  if (!/^[0-9A-Za-z._-]+\.tgz$/.test(metadata.tarballName)) {
    throw new Error("tarballName must be a safe .tgz filename.");
  }
  if (!/^sha512-[A-Za-z0-9+/=]+$/.test(metadata.integrity)) {
    throw new Error("integrity must be a sha512 Subresource Integrity value.");
  }
  if (!/^[0-9a-f]{40}$/.test(metadata.shasum)) {
    throw new Error("shasum must be a lowercase SHA-1 value.");
  }
  const expectedPrerelease = metadata.packageVersion.includes("-");
  if (
    metadata.prerelease !== expectedPrerelease ||
    metadata.npmTag !== (expectedPrerelease ? "next" : "latest")
  ) {
    throw new Error(
      "npm tag and prerelease metadata do not match the version.",
    );
  }
  return metadata;
}

export async function validateReleaseCandidate(
  metadata: ReleaseCandidateMetadata,
  candidateDirectory: string,
  dependencies: ReleaseCandidateDependencies,
): Promise<{
  readonly metadata: ReleaseCandidateMetadata;
  readonly needsPublish: boolean;
}> {
  if (!metadata.shouldRelease) return { metadata, needsPublish: false };
  const tarballPath = path.join(candidateDirectory, metadata.tarballName);
  const inspected = await dependencies.inspectTarball(tarballPath);
  if (
    inspected.integrity !== metadata.integrity ||
    inspected.shasum !== metadata.shasum
  ) {
    throw new Error("The tested tarball bytes do not match release metadata.");
  }
  if (
    inspected.packageName !== metadata.packageName ||
    inspected.packageVersion !== metadata.packageVersion
  ) {
    throw new Error(
      "The tarball package identity does not match release metadata.",
    );
  }
  const registryIntegrity = await dependencies.readRegistryIntegrity(
    `${metadata.packageName}@${metadata.packageVersion}`,
  );
  if (
    registryIntegrity !== "absent" &&
    registryIntegrity !== metadata.integrity
  ) {
    throw new Error("The published version has different bytes.");
  }
  return { metadata, needsPublish: registryIntegrity === "absent" };
}

function commandDependencies(
  runner: CommandRunner,
): ReleaseCandidateDependencies {
  return {
    async inspectTarball(tarballPath) {
      const bytes = await readFile(tarballPath);
      if (!(await stat(tarballPath)).isFile()) {
        throw new Error(`Release candidate is not a file: ${tarballPath}`);
      }
      const manifestResult = requireSuccess(
        await runner.run("tar", ["-xOf", tarballPath, "package/package.json"]),
        "Read packed package metadata",
      );
      const manifest = JSON.parse(manifestResult.stdout) as {
        readonly name?: unknown;
        readonly version?: unknown;
      };
      if (
        typeof manifest.name !== "string" ||
        typeof manifest.version !== "string"
      ) {
        throw new Error(
          "Packed package metadata has no string name and version.",
        );
      }
      return {
        integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
        packageName: manifest.name,
        packageVersion: manifest.version,
        shasum: createHash("sha1").update(bytes).digest("hex"),
      };
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
  const candidateDirectory = requireEnvironment(process.env, "CANDIDATE_DIR");
  const expectedSha = requireEnvironment(process.env, "EXPECTED_SHA");
  const outputPath = requireEnvironment(process.env, "GITHUB_OUTPUT");
  const metadataValue = JSON.parse(
    await readFile(
      path.join(candidateDirectory, "release-candidate.json"),
      "utf8",
    ),
  ) as unknown;
  const metadata = parseReleaseCandidateMetadata(metadataValue, expectedSha);
  const result = await validateReleaseCandidate(
    metadata,
    candidateDirectory,
    commandDependencies(systemCommandRunner),
  );
  if (!metadata.shouldRelease) {
    process.stdout.write(
      "No version change was found in the tested main push.\n",
    );
    await appendGitHubOutput(outputPath, { should_release: false });
    return;
  }
  await appendGitHubOutput(outputPath, {
    integrity: metadata.integrity,
    needs_publish: result.needsPublish,
    npm_tag: metadata.npmTag,
    package_name: metadata.packageName,
    package_version: metadata.packageVersion,
    prerelease: metadata.prerelease,
    release_sha: metadata.releaseSha,
    shasum: metadata.shasum,
    should_release: true,
    tarball_name: metadata.tarballName,
  });
  const summaryPath = requireEnvironment(process.env, "GITHUB_STEP_SUMMARY");
  const sourceRun = requireEnvironment(process.env, "SOURCE_CI_RUN_ID");
  const cdRun = requireEnvironment(process.env, "GITHUB_RUN_ID");
  await appendGitHubSummary(
    summaryPath,
    `## Release candidate\n\n- Package: \`${metadata.packageName}\`\n- Version: \`${metadata.packageVersion}\`\n- npm tag: \`${metadata.npmTag}\`\n- Commit: \`${metadata.releaseSha}\`\n- Source CI run: \`${sourceRun}\`\n- CD run: \`${cdRun}\`\n`,
  );
});
