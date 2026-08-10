import {
  type Artifact,
  ArtifactKind,
  createDriftEntry,
  type DriftEntry,
  DriftReason,
  type GeneratedSnapshot,
  OwnershipKind,
  type ProjectPath,
  type WritePlan,
} from "../../core/index.js";

export class WritePlanComparisonError extends Error {
  override readonly name = "WritePlanComparisonError";
}

function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isOwnedByPlan(path: string, plan: WritePlan): boolean {
  return plan.fragments.some((fragment) =>
    fragment.ownership.kind === OwnershipKind.CompleteTree
      ? path === String(fragment.ownership.root) ||
        path.startsWith(`${String(fragment.ownership.root)}/`)
      : fragment.ownership.paths.some(
          (ownedPath) => String(ownedPath) === path,
        ),
  );
}

function indexEntries(
  entries: readonly Artifact[],
  label: string,
): Map<string, Artifact> {
  const indexed = new Map<string, Artifact>();
  for (const entry of entries) {
    const entryPath = String(entry.path);
    if (indexed.has(entryPath)) {
      throw new WritePlanComparisonError(
        `${label} contains duplicate ${entryPath}`,
      );
    }
    indexed.set(entryPath, entry);
  }
  return indexed;
}

/** Compare expected plan artifacts with an immutable generated snapshot. */
export function compareWritePlan({
  plan,
  snapshot,
}: {
  readonly plan: WritePlan;
  readonly snapshot: GeneratedSnapshot;
}): readonly DriftEntry[] {
  const expected = indexEntries(
    plan.fragments.flatMap((fragment) => fragment.artifacts),
    "write plan",
  );
  const actual = indexEntries(
    snapshot.entries.filter((entry) => isOwnedByPlan(String(entry.path), plan)),
    "generated snapshot",
  );
  const allPaths = [...new Set([...expected.keys(), ...actual.keys()])].sort(
    compareCodePoints,
  );
  const drift: DriftEntry[] = [];

  for (const artifactPath of allPaths) {
    const expectedEntry = expected.get(artifactPath);
    const actualEntry = actual.get(artifactPath);
    let reason: DriftReason | null = null;
    if (expectedEntry === undefined) {
      reason = DriftReason.Unexpected;
    } else if (actualEntry === undefined) {
      reason = DriftReason.Missing;
    } else if (expectedEntry.kind !== actualEntry.kind) {
      reason = DriftReason.KindDiffers;
    } else if (
      expectedEntry.kind === ArtifactKind.File &&
      actualEntry.kind === ArtifactKind.File &&
      !expectedEntry.content.equals(actualEntry.content)
    ) {
      reason = DriftReason.ContentDiffers;
    }

    if (reason !== null) {
      drift.push(
        createDriftEntry({
          path: artifactPath as ProjectPath,
          reason,
        }),
      );
    }
  }
  return Object.freeze(drift);
}
