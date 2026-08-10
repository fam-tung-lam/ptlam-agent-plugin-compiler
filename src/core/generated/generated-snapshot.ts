import { compareProjectPaths } from "../identifiers.js";
import {
  type Artifact,
  type ArtifactInput,
  createArtifact,
} from "./artifact.js";

export interface GeneratedSnapshotInput {
  readonly entries: Iterable<ArtifactInput>;
}

export interface GeneratedSnapshot {
  readonly entries: readonly Artifact[];
}

export function createGeneratedSnapshot(
  input: GeneratedSnapshotInput,
): GeneratedSnapshot {
  const entries = [...input.entries]
    .sort((left, right) => compareProjectPaths(left.path, right.path))
    .map(createArtifact);
  return Object.freeze({ entries: Object.freeze(entries) });
}
