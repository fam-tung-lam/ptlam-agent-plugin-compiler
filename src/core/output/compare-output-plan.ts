import {
  createOutputDifference,
  type OutputDifference,
  OutputDifferenceReason,
  OutputEntryKind,
  OutputOwnershipKind,
  type OutputPlan,
  type OutputState,
  type PlannedArtifact,
} from "../models/output.js";
import type { ProjectPath } from "../models/project-path.js";

export class OutputComparisonError extends Error {
  override readonly name = "OutputComparisonError";
}

function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isOwnedByPlan(path: string, plan: OutputPlan): boolean {
  return plan.fragments.some((fragment) =>
    fragment.ownership.kind === OutputOwnershipKind.CompleteTree
      ? path === String(fragment.ownership.root) ||
        path.startsWith(`${String(fragment.ownership.root)}/`)
      : fragment.ownership.paths.some(
          (ownedPath) => String(ownedPath) === path,
        ),
  );
}

function indexEntries(
  entries: readonly PlannedArtifact[],
  label: string,
): Map<string, PlannedArtifact> {
  const indexed = new Map<string, PlannedArtifact>();
  for (const entry of entries) {
    const entryPath = String(entry.path);
    if (indexed.has(entryPath)) {
      throw new OutputComparisonError(
        `${label} contains duplicate ${entryPath}`,
      );
    }
    indexed.set(entryPath, entry);
  }
  return indexed;
}

/** Compare expected plan artifacts with immutable factual output state. */
export function compareOutputPlan({
  plan,
  state,
}: {
  readonly plan: OutputPlan;
  readonly state: OutputState;
}): readonly OutputDifference[] {
  const expected = indexEntries(
    plan.fragments.flatMap((fragment) => fragment.artifacts),
    "output plan",
  );
  const actual = indexEntries(
    state.entries.filter((entry) => isOwnedByPlan(String(entry.path), plan)),
    "output state",
  );
  const allPaths = [...new Set([...expected.keys(), ...actual.keys()])].sort(
    compareCodePoints,
  );
  const differences: OutputDifference[] = [];

  for (const outputPath of allPaths) {
    const expectedEntry = expected.get(outputPath);
    const actualEntry = actual.get(outputPath);
    let reason: OutputDifferenceReason | null = null;
    if (expectedEntry === undefined) {
      reason = OutputDifferenceReason.Unexpected;
    } else if (actualEntry === undefined) {
      reason = OutputDifferenceReason.Missing;
    } else if (expectedEntry.kind !== actualEntry.kind) {
      reason = OutputDifferenceReason.KindDiffers;
    } else if (
      expectedEntry.kind === OutputEntryKind.File &&
      actualEntry.kind === OutputEntryKind.File &&
      !expectedEntry.content.equals(actualEntry.content)
    ) {
      reason = OutputDifferenceReason.ContentDiffers;
    }

    if (reason !== null) {
      differences.push(
        createOutputDifference({
          path: outputPath as ProjectPath,
          reason,
        }),
      );
    }
  }
  return Object.freeze(differences);
}
