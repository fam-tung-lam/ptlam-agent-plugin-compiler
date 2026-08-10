import { compareProjectPaths } from "../identifiers.js";
import {
  type Artifact,
  type ArtifactInput,
  createArtifact,
  createOwnership,
  type Ownership,
} from "./artifact.js";

export interface PlanFragmentInput {
  readonly ownerId: string;
  readonly ownership: Ownership;
  readonly artifacts: Iterable<ArtifactInput>;
}

export interface PlanFragment {
  readonly ownerId: string;
  readonly ownership: Ownership;
  readonly artifacts: readonly Artifact[];
}

export function createPlanFragment(input: PlanFragmentInput): PlanFragment {
  const artifacts = [...input.artifacts]
    .sort((left, right) => compareProjectPaths(left.path, right.path))
    .map(createArtifact);
  return Object.freeze({
    ownerId: input.ownerId,
    ownership: createOwnership(input.ownership),
    artifacts: Object.freeze(artifacts),
  });
}
