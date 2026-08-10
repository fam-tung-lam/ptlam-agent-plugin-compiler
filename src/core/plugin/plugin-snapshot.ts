import type { ProjectPath } from "../identifiers.js";
import type { PluginSource } from "./plugin-source.js";

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

export interface PluginSnapshotInput {
  readonly source: PluginSource;
  readonly diagnostics: Iterable<FilesystemDiagnostic>;
}

/** Immutable source facts and recoverable per-entry inspection failures. */
export interface PluginSnapshot {
  readonly source: PluginSource;
  readonly diagnostics: readonly FilesystemDiagnostic[];
}

export function createPluginSnapshot(
  input: PluginSnapshotInput,
): PluginSnapshot {
  return Object.freeze({
    source: input.source,
    diagnostics: Object.freeze(
      [...input.diagnostics].map((diagnostic) =>
        Object.freeze({ ...diagnostic }),
      ),
    ),
  });
}
