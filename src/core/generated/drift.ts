import type { ProjectPath } from "../identifiers.js";

export enum DriftReason {
  ContentDiffers = "content-differs",
  KindDiffers = "kind-differs",
  Missing = "missing",
  Unexpected = "unexpected",
}

export interface DriftEntry {
  readonly path: ProjectPath;
  readonly reason: DriftReason;
}

export function createDriftEntry(entry: DriftEntry): DriftEntry {
  return Object.freeze({ ...entry });
}
