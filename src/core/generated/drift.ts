import type { ProjectPath } from "../identifiers.js";

/** The observed mismatch between a write plan and generated filesystem state. */
export enum DriftReason {
  /** File bytes differ from the planned bytes. */
  ContentDiffers = "content-differs",
  /** A path has a different filesystem entry kind than planned. */
  KindDiffers = "kind-differs",
  /** A planned path does not exist. */
  Missing = "missing",
  /** An owned path exists but is not present in the plan. */
  Unexpected = "unexpected",
}

/** One immutable mismatch between planned and observed generated output. */
export interface DriftEntry {
  /** Repository-relative path where drift was observed. */
  readonly path: ProjectPath;
  /** Category of mismatch at the path. */
  readonly reason: DriftReason;
}

/**
 * Copy and freeze one drift entry.
 *
 * @param entry - Observed path and mismatch reason.
 * @returns An immutable drift entry.
 */
export function createDriftEntry(entry: DriftEntry): DriftEntry {
  return Object.freeze({ ...entry });
}
