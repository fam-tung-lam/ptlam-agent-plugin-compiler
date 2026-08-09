import { compareProjectPaths, type ProjectPath } from "./project-path.js";

export enum OutputOwnershipKind {
  CompleteTree = "complete-tree",
  ExactFiles = "exact-files",
}

export type OutputOwnership =
  | {
      readonly kind: OutputOwnershipKind.CompleteTree;
      readonly root: ProjectPath;
    }
  | {
      readonly kind: OutputOwnershipKind.ExactFiles;
      readonly paths: readonly ProjectPath[];
    };

export enum OutputEntryKind {
  Directory = "directory",
  File = "file",
}

export interface OutputDirectory {
  readonly kind: OutputEntryKind.Directory;
  readonly path: ProjectPath;
}

export interface OutputFileInput {
  readonly kind: OutputEntryKind.File;
  readonly path: ProjectPath;
  readonly content: Uint8Array;
}

export interface OutputFile {
  readonly kind: OutputEntryKind.File;
  readonly path: ProjectPath;
  readonly content: Buffer;
}

export type PlannedArtifact = OutputDirectory | OutputFile;
export type PlannedArtifactInput = OutputDirectory | OutputFileInput;
export type OutputStateEntry = PlannedArtifact;
export type OutputStateEntryInput = PlannedArtifactInput;

export interface OutputFragmentInput {
  readonly ownerId: string;
  readonly ownership: OutputOwnership;
  readonly artifacts: Iterable<PlannedArtifactInput>;
}

export interface OutputFragment {
  readonly ownerId: string;
  readonly ownership: OutputOwnership;
  readonly artifacts: readonly PlannedArtifact[];
}

export interface OutputPlanInput {
  readonly fragments: Iterable<OutputFragmentInput>;
}

export interface OutputPlan {
  readonly fragments: readonly OutputFragment[];
}

export interface OutputStateInput {
  readonly entries: Iterable<OutputStateEntryInput>;
}

export interface OutputState {
  readonly entries: readonly OutputStateEntry[];
}

export enum OutputDifferenceReason {
  ContentDiffers = "content-differs",
  KindDiffers = "kind-differs",
  Missing = "missing",
  Unexpected = "unexpected",
}

export interface OutputDifference {
  readonly path: ProjectPath;
  readonly reason: OutputDifferenceReason;
}

function createOutputFile(input: OutputFileInput): OutputFile {
  const bytes = Buffer.from(input.content);
  return Object.freeze({
    kind: OutputEntryKind.File,
    path: input.path,
    get content(): Buffer {
      return Buffer.from(bytes);
    },
  });
}

function createArtifact(input: PlannedArtifactInput): PlannedArtifact {
  return input.kind === OutputEntryKind.File
    ? createOutputFile(input)
    : Object.freeze({ ...input });
}

function freezeOwnership(ownership: OutputOwnership): OutputOwnership {
  return ownership.kind === OutputOwnershipKind.ExactFiles
    ? Object.freeze({
        kind: ownership.kind,
        paths: Object.freeze([...ownership.paths]),
      })
    : Object.freeze({ ...ownership });
}

export function createOutputFragment(
  input: OutputFragmentInput,
): OutputFragment {
  const artifacts = [...input.artifacts]
    .sort((left, right) => compareProjectPaths(left.path, right.path))
    .map(createArtifact);
  return Object.freeze({
    ownerId: input.ownerId,
    ownership: freezeOwnership(input.ownership),
    artifacts: Object.freeze(artifacts),
  });
}

export function createOutputPlan(input: OutputPlanInput): OutputPlan {
  return Object.freeze({
    fragments: Object.freeze([...input.fragments].map(createOutputFragment)),
  });
}

export function createOutputState(input: OutputStateInput): OutputState {
  const entries = [...input.entries]
    .sort((left, right) => compareProjectPaths(left.path, right.path))
    .map(createArtifact);
  return Object.freeze({ entries: Object.freeze(entries) });
}

export function createOutputDifference(
  difference: OutputDifference,
): OutputDifference {
  return Object.freeze({ ...difference });
}
