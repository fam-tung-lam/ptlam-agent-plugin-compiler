import type { ProjectPath } from "../identifiers.js";

export enum OwnershipKind {
  CompleteTree = "complete-tree",
  ExactFiles = "exact-files",
}

export type Ownership =
  | {
      readonly kind: OwnershipKind.CompleteTree;
      readonly root: ProjectPath;
    }
  | {
      readonly kind: OwnershipKind.ExactFiles;
      readonly paths: readonly ProjectPath[];
    };

export enum ArtifactKind {
  Directory = "directory",
  File = "file",
}

export interface DirectoryArtifact {
  readonly kind: ArtifactKind.Directory;
  readonly path: ProjectPath;
}

export interface FileArtifactInput {
  readonly kind: ArtifactKind.File;
  readonly path: ProjectPath;
  readonly content: Uint8Array;
}

export interface FileArtifact {
  readonly kind: ArtifactKind.File;
  readonly path: ProjectPath;
  readonly content: Buffer;
}

export type ArtifactInput = DirectoryArtifact | FileArtifactInput;
export type Artifact = DirectoryArtifact | FileArtifact;

export function createArtifact(input: ArtifactInput): Artifact {
  if (input.kind === ArtifactKind.Directory) {
    return Object.freeze({ ...input });
  }
  const bytes = Buffer.from(input.content);
  return Object.freeze({
    kind: ArtifactKind.File,
    path: input.path,
    get content(): Buffer {
      return Buffer.from(bytes);
    },
  });
}

export function createOwnership(ownership: Ownership): Ownership {
  return ownership.kind === OwnershipKind.ExactFiles
    ? Object.freeze({
        kind: ownership.kind,
        paths: Object.freeze([...ownership.paths]),
      })
    : Object.freeze({ ...ownership });
}
