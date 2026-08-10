import type { ProjectPath } from "../identifiers.js";

export interface WriteResultInput {
  readonly changedPaths: Iterable<ProjectPath>;
  readonly unchangedPaths: Iterable<ProjectPath>;
}

/** Factual output paths observed as changed or already current after a write. */
export interface WriteResult {
  readonly changedPaths: readonly ProjectPath[];
  readonly unchangedPaths: readonly ProjectPath[];
}

export function createWriteResult(input: WriteResultInput): WriteResult {
  return Object.freeze({
    changedPaths: Object.freeze([...input.changedPaths]),
    unchangedPaths: Object.freeze([...input.unchangedPaths]),
  });
}
