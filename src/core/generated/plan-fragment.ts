import { compareProjectPaths } from "../identifiers.js";
import {
  type Artifact,
  type ArtifactInput,
  createArtifact,
  createOwnership,
  type Ownership,
} from "./artifact.js";

/**
 * Mutable-input form of one producer's generated output contribution.
 *
 * @example
 * ```ts
 * const input: PlanFragmentInput = {
 *   ownerId: "external",
 *   ownership: { kind: OwnershipKind.ExactFiles, paths: [] },
 *   artifacts: [],
 * };
 * ```
 */
export interface PlanFragmentInput {
  /** Stable identifier used to attribute validation errors and path ownership. */
  readonly ownerId: string;
  /** Generated paths controlled by this producer. */
  readonly ownership: Ownership;
  /** Generated entries contributed by this producer. */
  readonly artifacts: Iterable<ArtifactInput>;
}

/**
 * Immutable output contribution returned by a renderer or provider adapter.
 *
 * @example
 * ```ts
 * const fragment: PlanFragment = createPlanFragment({
 *   ownerId: "external",
 *   ownership: {
 *     kind: OwnershipKind.ExactFiles,
 *     paths: [createProjectPath(".external-plugin/plugin.json")],
 *   },
 *   artifacts: [],
 * });
 * ```
 */
export interface PlanFragment {
  /** Stable identifier of the producer that owns the fragment. */
  readonly ownerId: string;
  /** Immutable declaration of the generated paths controlled by the producer. */
  readonly ownership: Ownership;
  /** Immutable artifacts sorted by repository-relative path. */
  readonly artifacts: readonly Artifact[];
}

/**
 * Snapshot a producer's output contribution in deterministic path order.
 *
 * @param input - Producer identity, ownership, and generated artifacts.
 * @returns An immutable fragment with copied ownership and artifact bytes.
 *
 * @example
 * ```ts
 * const fragment = createPlanFragment({
 *   ownerId: "external",
 *   ownership: {
 *     kind: OwnershipKind.ExactFiles,
 *     paths: [createProjectPath(".external-plugin/plugin.json")],
 *   },
 *   artifacts: [{
 *     kind: ArtifactKind.File,
 *     path: createProjectPath(".external-plugin/plugin.json"),
 *     content: new TextEncoder().encode("{}\n"),
 *   }],
 * });
 * ```
 */
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
