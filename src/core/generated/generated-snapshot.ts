import { compareProjectPaths } from "../identifiers.js";
import {
  type Artifact,
  type ArtifactInput,
  createArtifact,
} from "./artifact.js";

/** Input facts collected from generated filesystem state. */
export interface GeneratedSnapshotInput {
  /** Observed generated entries. */
  readonly entries: Iterable<ArtifactInput>;
}

/** Immutable generated filesystem facts in deterministic path order. */
export interface GeneratedSnapshot {
  /** Observed entries sorted by repository-relative path. */
  readonly entries: readonly Artifact[];
}

/**
 * Snapshot generated filesystem facts in deterministic path order.
 *
 * @param input - Observed generated entries.
 * @returns An immutable snapshot with copied file bytes.
 */
export function createGeneratedSnapshot(
  input: GeneratedSnapshotInput,
): GeneratedSnapshot {
  const entries = [...input.entries]
    .sort((left, right) => compareProjectPaths(left.path, right.path))
    .map(createArtifact);
  return Object.freeze({ entries: Object.freeze(entries) });
}
