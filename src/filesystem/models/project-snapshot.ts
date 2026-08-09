import type { PluginSource, ProjectPath } from "../../core/index.js";

export enum FilesystemDiagnosticOperation {
  Inspect = "inspect",
  Read = "read",
}

export enum FilesystemDiagnosticReason {
  Io = "io",
  Missing = "missing",
  Permission = "permission",
  Symlink = "symlink",
  UnsupportedKind = "unsupported-kind",
}

export interface FilesystemDiagnostic {
  readonly path: ProjectPath;
  readonly operation: FilesystemDiagnosticOperation;
  readonly reason: FilesystemDiagnosticReason;
  readonly message: string;
}

export interface ProjectSnapshotInput {
  readonly source: PluginSource;
  readonly diagnostics: Iterable<FilesystemDiagnostic>;
}

/** Immutable source facts and recoverable per-entry inspection failures. */
export interface ProjectSnapshot {
  readonly source: PluginSource;
  readonly diagnostics: readonly FilesystemDiagnostic[];
}

export function createProjectSnapshot(
  input: ProjectSnapshotInput,
): ProjectSnapshot {
  return Object.freeze({
    source: input.source,
    diagnostics: Object.freeze(
      [...input.diagnostics].map((diagnostic) =>
        Object.freeze({ ...diagnostic }),
      ),
    ),
  });
}
