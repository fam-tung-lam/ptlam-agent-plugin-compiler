import type { ProjectPath } from "../identifiers.js";

/** Mutable-input form of factual write outcomes. */
export interface WriteResultInput {
  /** Owned paths whose contents or entry kinds changed. */
  readonly changedPaths: Iterable<ProjectPath>;
  /** Owned paths already equal to the write plan. */
  readonly unchangedPaths: Iterable<ProjectPath>;
}

/** Factual output paths observed as changed or already current after a write. */
export interface WriteResult {
  /** Immutable paths changed by the write. */
  readonly changedPaths: readonly ProjectPath[];
  /** Immutable paths that required no change. */
  readonly unchangedPaths: readonly ProjectPath[];
}

/**
 * Copy and freeze factual write outcomes.
 *
 * @param input - Changed and unchanged owned paths.
 * @returns An immutable write result.
 */
export function createWriteResult(input: WriteResultInput): WriteResult {
  return Object.freeze({
    changedPaths: Object.freeze([...input.changedPaths]),
    unchangedPaths: Object.freeze([...input.unchangedPaths]),
  });
}
