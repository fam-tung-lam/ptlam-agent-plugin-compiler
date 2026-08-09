import { readFile } from "node:fs/promises";
import path from "node:path";

import { runScript } from "./run-script.ts";

export const EXPECTED_PACKAGE_NAME =
  "@fam-tung-lam/ptlam-agent-plugin-compiler";

interface PackageMetadata {
  readonly name?: unknown;
  readonly version?: unknown;
}

interface PackageLockMetadata extends PackageMetadata {
  readonly packages?: unknown;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validatePackageMetadata(
  manifest: PackageMetadata,
  lockfile: PackageLockMetadata,
): { readonly name: string; readonly version: string } {
  if (manifest.name !== EXPECTED_PACKAGE_NAME) {
    throw new Error(`Unexpected package name: ${String(manifest.name)}`);
  }
  if (typeof manifest.version !== "string") {
    throw new Error("package.json must contain a string version.");
  }
  const packages = isRecord(lockfile.packages) ? lockfile.packages : undefined;
  const root = packages?.[""];
  if (!isRecord(root)) {
    throw new Error("package-lock.json is missing its root package metadata.");
  }
  if (lockfile.name !== manifest.name || root["name"] !== manifest.name) {
    throw new Error("package-lock.json has a different package name.");
  }
  if (
    lockfile.version !== manifest.version ||
    root["version"] !== manifest.version
  ) {
    throw new Error(
      "package.json and package-lock.json have different versions.",
    );
  }
  return { name: manifest.name, version: manifest.version };
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function validatePackageMetadataFiles(
  projectRoot: string,
): Promise<{ readonly name: string; readonly version: string }> {
  const manifest = await readJson(path.join(projectRoot, "package.json"));
  const lockfile = await readJson(path.join(projectRoot, "package-lock.json"));
  if (!isRecord(manifest) || !isRecord(lockfile)) {
    throw new Error("Package metadata files must contain JSON objects.");
  }
  return validatePackageMetadata(manifest, lockfile);
}

runScript(import.meta.url, async () => {
  await validatePackageMetadataFiles(process.cwd());
});
