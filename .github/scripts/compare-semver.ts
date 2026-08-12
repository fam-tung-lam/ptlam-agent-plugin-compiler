import { runScript } from "./run-script.ts";

export interface SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly (number | string)[];
}

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function parseSemVer(value: string): SemanticVersion {
  const match = SEMVER_PATTERN.exec(value);
  if (match === null) throw new Error(`${value} is not valid SemVer.`);
  const prerelease = match[4]?.split(".").map((identifier) => {
    return /^\d+$/.test(identifier) ? Number(identifier) : identifier;
  });
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: prerelease ?? [],
  };
}

function compareIdentifier(
  left: number | string,
  right: number | string,
): number {
  if (left === right) return 0;
  if (typeof left === "number" && typeof right === "string") return -1;
  if (typeof left === "string" && typeof right === "number") return 1;
  return left < right ? -1 : 1;
}

export function compareSemVer(leftValue: string, rightValue: string): number {
  const left = parseSemVer(leftValue);
  const right = parseSemVer(rightValue);
  for (const part of ["major", "minor", "patch"] as const) {
    if (left[part] !== right[part]) return left[part] < right[part] ? -1 : 1;
  }
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    if (left.prerelease.length === right.prerelease.length) return 0;
    return left.prerelease.length === 0 ? 1 : -1;
  }
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftIdentifier = left.prerelease[index];
    const rightIdentifier = right.prerelease[index];
    if (leftIdentifier === undefined) return -1;
    if (rightIdentifier === undefined) return 1;
    const comparison = compareIdentifier(leftIdentifier, rightIdentifier);
    if (comparison !== 0) return comparison;
  }
  return 0;
}

export function isPrereleaseOf(
  prereleaseVersion: string,
  stableVersion: string,
): boolean {
  const prerelease = parseSemVer(prereleaseVersion);
  const stable = parseSemVer(stableVersion);
  return (
    prerelease.prerelease.length > 0 &&
    stable.prerelease.length === 0 &&
    prerelease.major === stable.major &&
    prerelease.minor === stable.minor &&
    prerelease.patch === stable.patch
  );
}

export function requireGreaterSemVer(next: string, previous: string): void {
  if (compareSemVer(next, previous) <= 0) {
    throw new Error(
      `${next} must be valid SemVer and greater than ${previous}.`,
    );
  }
}

runScript(import.meta.url, async () => {
  const [left, right] = process.argv.slice(2);
  if (left === undefined || right === undefined) {
    throw new Error("Usage: compare-semver.ts <left> <right>");
  }
  process.stdout.write(`${compareSemVer(left, right)}\n`);
});
