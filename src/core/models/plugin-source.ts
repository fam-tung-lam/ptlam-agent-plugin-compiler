import { compareProjectPaths, type ProjectPath } from "./project-path.js";

export enum SourceEntryKind {
  Directory = "directory",
  File = "file",
}

export interface SourceDirectory {
  readonly kind: SourceEntryKind.Directory;
  readonly path: ProjectPath;
}

export interface SourceFileInput {
  readonly kind: SourceEntryKind.File;
  readonly path: ProjectPath;
  readonly content: Uint8Array;
}

/** A source file whose bytes cannot be mutated through either input or output aliases. */
export interface SourceFile {
  readonly kind: SourceEntryKind.File;
  readonly path: ProjectPath;
  readonly content: Buffer;
}

export type SourceEntry = SourceDirectory | SourceFile;
export type SourceEntryInput = SourceDirectory | SourceFileInput;

export interface PluginSourceInput {
  readonly manifest: SourceFileInput | null;
  readonly skillEntries: Iterable<SourceEntryInput>;
}

/** Filesystem facts supplied to pure parsing and validation. */
export interface PluginSource {
  readonly manifest: SourceFile | null;
  readonly skillEntries: readonly SourceEntry[];
}

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

/** Snapshot successful source facts in deterministic path order. */
export function createPluginSource(input: PluginSourceInput): PluginSource {
  const skillEntries = [...input.skillEntries]
    .sort((left, right) => compareProjectPaths(left.path, right.path))
    .map(createSourceEntry);
  return Object.freeze({
    manifest: input.manifest === null ? null : createSourceFile(input.manifest),
    skillEntries: Object.freeze(skillEntries),
  });
}
