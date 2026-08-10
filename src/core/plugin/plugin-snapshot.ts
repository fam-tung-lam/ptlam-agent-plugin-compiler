import type { ProjectPath } from "../identifiers.js";
import type { PluginSource } from "./plugin-source.js";

/** Filesystem operation that produced a recoverable source diagnostic. */
export enum FilesystemDiagnosticOperation {
  /** Inspecting an entry's metadata failed. */
  Inspect = "inspect",
  /** Reading a file's bytes failed. */
  Read = "read",
}

/** Classification of a recoverable source filesystem failure. */
export enum FilesystemDiagnosticReason {
  /** Unclassified input/output failure. */
  Io = "io",
  /** Required source entry was absent. */
  Missing = "missing",
  /** Filesystem permissions denied the operation. */
  Permission = "permission",
  /** Source entry was a symbolic link. */
  Symlink = "symlink",
  /** Source entry had an unsupported filesystem kind. */
  UnsupportedKind = "unsupported-kind",
}

/** One recoverable failure observed while reading authored sources. */
export interface FilesystemDiagnostic {
  /** Repository-relative source path. */
  readonly path: ProjectPath;
  /** Filesystem operation that failed. */
  readonly operation: FilesystemDiagnosticOperation;
  /** Stable failure category. */
  readonly reason: FilesystemDiagnosticReason;
  /** Human-readable diagnostic message. */
  readonly message: string;
}

/** Mutable-input form combining successful source facts and diagnostics. */
export interface PluginSnapshotInput {
  /** Successfully read authored source facts. */
  readonly source: PluginSource;
  /** Recoverable per-entry read failures. */
  readonly diagnostics: Iterable<FilesystemDiagnostic>;
}

/** Immutable source facts and recoverable per-entry inspection failures. */
export interface PluginSnapshot {
  /** Successfully read authored source facts. */
  readonly source: PluginSource;
  /** Immutable recoverable per-entry read failures. */
  readonly diagnostics: readonly FilesystemDiagnostic[];
}

/**
 * Copy and freeze authored source facts and filesystem diagnostics.
 *
 * @param input - Successful facts and recoverable failures from one read.
 * @returns An immutable plugin snapshot.
 */
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
