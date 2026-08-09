import {
  OutputEntryKind,
  type OutputFragmentInput,
  OutputOwnershipKind,
  type OutputPlan,
  type OutputPlanInput,
  type PlannedArtifactInput,
  createOutputPlan as snapshotOutputPlan,
} from "../models/output.js";
import {
  compareProjectPaths,
  createProjectPath,
  type ProjectPath,
} from "../models/project-path.js";

const ROOT_README = "README.md";
const SHARED_SKILLS_ROOT = "skills";
const SKILLS_CATALOG = "skills/README.md";

export class OutputPlanValidationError extends Error {
  override readonly name = "OutputPlanValidationError";
  readonly errors: readonly string[];

  constructor(errors: Iterable<string>) {
    const normalized = Object.freeze(
      [...new Set(errors)].filter(Boolean).sort(compareCodePoints),
    );
    super(
      `Output plan validation failed:\n${normalized
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
    this.errors = normalized;
  }
}

interface MaterializedFragment {
  readonly ownerId: string;
  readonly ownership: OutputFragmentInput["ownership"];
  readonly artifacts: readonly PlannedArtifactInput[];
}

function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isAtOrBelow(candidate: string, root: string): boolean {
  return candidate === root || candidate.startsWith(`${root}/`);
}

function validateLogicalPath(
  path: ProjectPath,
  label: string,
  errors: string[],
): void {
  try {
    createProjectPath(String(path));
  } catch {
    errors.push(
      `${label}: unsafe logical path ${JSON.stringify(String(path))}`,
    );
  }
  if (String(path) === ROOT_README) {
    errors.push(`${label}: root README.md is never compiler-owned`);
  }
}

function materializeFragments(input: OutputPlanInput): MaterializedFragment[] {
  return [...input.fragments]
    .map((fragment) => ({
      ownerId: fragment.ownerId,
      ownership: fragment.ownership,
      artifacts: [...fragment.artifacts],
    }))
    .sort((left, right) => {
      const ownerOrder = compareCodePoints(left.ownerId, right.ownerId);
      if (ownerOrder !== 0) return ownerOrder;
      const leftPath =
        left.ownership.kind === OutputOwnershipKind.CompleteTree
          ? String(left.ownership.root)
          : left.ownership.paths.map(String).sort(compareCodePoints).join("\0");
      const rightPath =
        right.ownership.kind === OutputOwnershipKind.CompleteTree
          ? String(right.ownership.root)
          : right.ownership.paths
              .map(String)
              .sort(compareCodePoints)
              .join("\0");
      return compareCodePoints(leftPath, rightPath);
    });
}

function validateFragment(
  fragment: MaterializedFragment,
  errors: string[],
): void {
  if (fragment.ownerId.trim() === "") {
    errors.push("output fragment ownerId must not be empty");
  }
  const artifactByPath = new Map<string, PlannedArtifactInput>();
  for (const artifact of fragment.artifacts) {
    const artifactPath = String(artifact.path);
    validateLogicalPath(
      artifact.path,
      `fragment ${JSON.stringify(fragment.ownerId)} artifact`,
      errors,
    );
    if (artifactByPath.has(artifactPath)) {
      errors.push(
        `fragment ${JSON.stringify(fragment.ownerId)} contains duplicate artifact ${artifactPath}`,
      );
    } else {
      artifactByPath.set(artifactPath, artifact);
    }
  }

  const artifacts = [...artifactByPath.values()];
  for (const artifact of artifacts) {
    if (artifact.kind !== OutputEntryKind.File) continue;
    const prefix = `${String(artifact.path)}/`;
    const descendant = artifacts.find((candidate) =>
      String(candidate.path).startsWith(prefix),
    );
    if (descendant !== undefined) {
      errors.push(
        `fragment ${JSON.stringify(fragment.ownerId)} file ${String(artifact.path)} is an ancestor of ${String(descendant.path)}`,
      );
    }
  }

  if (fragment.ownership.kind === OutputOwnershipKind.CompleteTree) {
    const root = String(fragment.ownership.root);
    validateLogicalPath(
      fragment.ownership.root,
      `fragment ${JSON.stringify(fragment.ownerId)} complete-tree root`,
      errors,
    );
    for (const artifact of artifacts) {
      if (!isAtOrBelow(String(artifact.path), root)) {
        errors.push(
          `fragment ${JSON.stringify(fragment.ownerId)} emits ${String(artifact.path)} outside complete tree ${root}`,
        );
      }
    }
    const rootArtifact = artifactByPath.get(root);
    if (rootArtifact?.kind !== OutputEntryKind.Directory) {
      errors.push(
        `fragment ${JSON.stringify(fragment.ownerId)} must declare complete-tree root directory ${root}`,
      );
    }
    return;
  }

  const ownedPaths = [...fragment.ownership.paths]
    .sort(compareProjectPaths)
    .map(String);
  const ownedPathSet = new Set<string>();
  for (const ownedPath of fragment.ownership.paths) {
    validateLogicalPath(
      ownedPath,
      `fragment ${JSON.stringify(fragment.ownerId)} exact ownership`,
      errors,
    );
    if (ownedPathSet.has(String(ownedPath))) {
      errors.push(
        `fragment ${JSON.stringify(fragment.ownerId)} declares duplicate exact path ${String(ownedPath)}`,
      );
    }
    ownedPathSet.add(String(ownedPath));
  }
  for (const artifact of artifacts) {
    if (artifact.kind !== OutputEntryKind.File) {
      errors.push(
        `fragment ${JSON.stringify(fragment.ownerId)} exact ownership may emit only files, found directory ${String(artifact.path)}`,
      );
    }
    if (!ownedPathSet.has(String(artifact.path))) {
      errors.push(
        `fragment ${JSON.stringify(fragment.ownerId)} emits undeclared exact path ${String(artifact.path)}`,
      );
    }
  }
  for (const ownedPath of ownedPaths) {
    if (!artifactByPath.has(ownedPath)) {
      errors.push(
        `fragment ${JSON.stringify(fragment.ownerId)} does not emit owned exact path ${ownedPath}`,
      );
    }
  }
}

function ownershipPaths(fragment: MaterializedFragment): readonly string[] {
  return fragment.ownership.kind === OutputOwnershipKind.CompleteTree
    ? [String(fragment.ownership.root)]
    : fragment.ownership.paths.map(String).sort(compareCodePoints);
}

function validateCrossFragmentCollisions(
  fragments: readonly MaterializedFragment[],
  errors: string[],
): void {
  for (const [index, left] of fragments.entries()) {
    for (const right of fragments.slice(index + 1)) {
      if (left.ownerId === right.ownerId) {
        errors.push(
          `duplicate output fragment owner ${JSON.stringify(left.ownerId)}`,
        );
      }
      for (const leftPath of ownershipPaths(left)) {
        for (const rightPath of ownershipPaths(right)) {
          const collides =
            isAtOrBelow(leftPath, rightPath) ||
            isAtOrBelow(rightPath, leftPath);
          if (collides) {
            errors.push(
              `output ownership collision between ${JSON.stringify(left.ownerId)}:${leftPath} and ${JSON.stringify(right.ownerId)}:${rightPath}`,
            );
          }
        }
      }
    }
  }

  const artifactOwners = new Map<string, string>();
  for (const fragment of fragments) {
    for (const artifact of fragment.artifacts) {
      const artifactPath = String(artifact.path);
      const priorOwner = artifactOwners.get(artifactPath);
      if (priorOwner !== undefined && priorOwner !== fragment.ownerId) {
        errors.push(
          `artifact collision at ${artifactPath} between ${JSON.stringify(priorOwner)} and ${JSON.stringify(fragment.ownerId)}`,
        );
      } else {
        artifactOwners.set(artifactPath, fragment.ownerId);
      }
    }
  }
}

function validateSharedSkillsFragment(
  fragments: readonly MaterializedFragment[],
  errors: string[],
): void {
  const shared = fragments.filter(
    (fragment) =>
      fragment.ownership.kind === OutputOwnershipKind.CompleteTree &&
      String(fragment.ownership.root) === SHARED_SKILLS_ROOT,
  );
  if (shared.length !== 1) {
    errors.push(
      `output plan must contain exactly one complete shared skills tree, found ${shared.length}`,
    );
    return;
  }
  const catalog = shared[0]?.artifacts.find(
    (artifact) => String(artifact.path) === SKILLS_CATALOG,
  );
  if (catalog?.kind !== OutputEntryKind.File) {
    errors.push(`shared skills tree must contain generated ${SKILLS_CATALOG}`);
  }
}

/** Validate ownership and collisions, then build one canonical output plan. */
export function buildOutputPlan(input: OutputPlanInput): OutputPlan {
  const fragments = materializeFragments(input);
  const errors: string[] = [];
  for (const fragment of fragments) validateFragment(fragment, errors);
  validateCrossFragmentCollisions(fragments, errors);
  validateSharedSkillsFragment(fragments, errors);
  if (errors.length > 0) throw new OutputPlanValidationError(errors);

  return snapshotOutputPlan({
    fragments: fragments.map((fragment) => ({
      ownerId: fragment.ownerId,
      ownership:
        fragment.ownership.kind === OutputOwnershipKind.ExactFiles
          ? {
              kind: fragment.ownership.kind,
              paths: [...fragment.ownership.paths].sort(compareProjectPaths),
            }
          : fragment.ownership,
      artifacts: fragment.artifacts,
    })),
  });
}
