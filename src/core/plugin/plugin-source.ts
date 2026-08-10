import { compareProjectPaths, type ProjectPath } from "../identifiers.js";

/** Filesystem entry kind observed in authored plugin sources. */
export enum SourceEntryKind {
  /** An authored directory entry. */
  Directory = "directory",
  /** An authored file entry. */
  File = "file",
}

/** One successfully inspected authored directory. */
export interface SourceDirectory {
  /** Discriminates directory entries. */
  readonly kind: SourceEntryKind.Directory;
  /** Repository-relative source path. */
  readonly path: ProjectPath;
}

/** Mutable-input form of one authored source file. */
export interface SourceFileInput {
  /** Discriminates file entries. */
  readonly kind: SourceEntryKind.File;
  /** Repository-relative source path. */
  readonly path: ProjectPath;
  /** File bytes copied into the immutable source model. */
  readonly content: Uint8Array;
}

/** A source file whose bytes cannot be mutated through either input or output aliases. */
export interface SourceFile {
  /** Discriminates file entries. */
  readonly kind: SourceEntryKind.File;
  /** Repository-relative source path. */
  readonly path: ProjectPath;
  /** A fresh copy of source bytes on every read. */
  readonly content: Buffer;
}

/** One immutable authored source directory or file. */
export type SourceEntry = SourceDirectory | SourceFile;
/** Input accepted when constructing an authored source entry. */
export type SourceEntryInput = SourceDirectory | SourceFileInput;

/** Mutable-input form of successfully read authored source facts. */
export interface PluginSourceInput {
  /** Canonical manifest file, or `null` when it could not be read. */
  readonly manifest: SourceFileInput | null;
  /** Successfully inspected entries below `plugin/skills/`. */
  readonly skillEntries: Iterable<SourceEntryInput>;
}

/** Filesystem facts supplied to pure parsing and validation. */
export interface PluginSource {
  /** Canonical manifest file, or `null` when unavailable. */
  readonly manifest: SourceFile | null;
  /** Immutable successful skill entries in deterministic path order. */
  readonly skillEntries: readonly SourceEntry[];
}

/**
 * Copy and freeze one authored source file.
 *
 * @param input - Source path and bytes to snapshot.
 * @returns An immutable source file with defensively copied bytes.
 */
export function createSourceFile(input: SourceFileInput): SourceFile {
  const bytes = Buffer.from(input.content);
  return Object.freeze({
    kind: SourceEntryKind.File,
    path: input.path,
    get content(): Buffer {
      return Buffer.from(bytes);
    },
  });
}

function createSourceEntry(input: SourceEntryInput): SourceEntry {
  return input.kind === SourceEntryKind.File
    ? createSourceFile(input)
    : Object.freeze({ ...input });
}

/**
 * Snapshot successful source facts in deterministic path order.
 *
 * @param input - Manifest and successfully inspected skill entries.
 * @returns Immutable authored source facts with copied file bytes.
 */
export function createPluginSource(input: PluginSourceInput): PluginSource {
  const skillEntries = [...input.skillEntries]
    .sort((left, right) => compareProjectPaths(left.path, right.path))
    .map(createSourceEntry);
  return Object.freeze({
    manifest: input.manifest === null ? null : createSourceFile(input.manifest),
    skillEntries: Object.freeze(skillEntries),
  });
}
