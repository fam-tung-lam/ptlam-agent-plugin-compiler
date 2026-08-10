import {
  type ArtifactInput,
  ArtifactKind,
  compareProjectPaths,
  createProjectPath,
  OwnershipKind,
  type PlanFragmentInput,
  type ProjectPath,
  createWritePlan as snapshotWritePlan,
  type WritePlan,
  type WritePlanInput,
} from "../../core/index.js";

const ROOT_README = "README.md";
const SHARED_SKILLS_ROOT = "skills";
const SKILLS_CATALOG = "skills/README.md";

/** Reports every ownership, artifact, and shared-tree invariant rejected by planning. */
export class WritePlanValidationError extends Error {
  /** Stable error class name. */
  override readonly name = "WritePlanValidationError";
  /** Deduplicated diagnostics in deterministic order. */
  readonly errors: readonly string[];

  /**
   * @param errors - Planning diagnostics to normalize and snapshot.
   */
  constructor(errors: Iterable<string>) {
    const normalized = Object.freeze(
      [...new Set(errors)].filter(Boolean).sort(compareCodePoints),
    );
    super(
      `Write plan validation failed:\n${normalized
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
    this.errors = normalized;
  }
}

interface MaterializedFragment {
  readonly ownerId: string;
  readonly ownership: PlanFragmentInput["ownership"];
  readonly artifacts: readonly ArtifactInput[];
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

function materializeFragments(input: WritePlanInput): MaterializedFragment[] {
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
        left.ownership.kind === OwnershipKind.CompleteTree
          ? String(left.ownership.root)
          : left.ownership.paths.map(String).sort(compareCodePoints).join("\0");
      const rightPath =
        right.ownership.kind === OwnershipKind.CompleteTree
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
    errors.push("plan fragment ownerId must not be empty");
  }
  const artifactByPath = new Map<string, ArtifactInput>();
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
    if (artifact.kind !== ArtifactKind.File) continue;
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

  if (fragment.ownership.kind === OwnershipKind.CompleteTree) {
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
    if (rootArtifact?.kind !== ArtifactKind.Directory) {
      errors.push(
        `fragment ${JSON.stringify(fragment.ownerId)} must declare complete-tree root directory ${root}`,
      );
    }
    return;
  }

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
    if (artifact.kind !== ArtifactKind.File) {
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
}

function ownershipPaths(fragment: MaterializedFragment): readonly string[] {
  return fragment.ownership.kind === OwnershipKind.CompleteTree
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
          `duplicate plan fragment owner ${JSON.stringify(left.ownerId)}`,
        );
      }
      for (const leftPath of ownershipPaths(left)) {
        for (const rightPath of ownershipPaths(right)) {
          const collides =
            isAtOrBelow(leftPath, rightPath) ||
            isAtOrBelow(rightPath, leftPath);
          if (collides) {
            errors.push(
              `ownership collision between ${JSON.stringify(left.ownerId)}:${leftPath} and ${JSON.stringify(right.ownerId)}:${rightPath}`,
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
      fragment.ownership.kind === OwnershipKind.CompleteTree &&
      String(fragment.ownership.root) === SHARED_SKILLS_ROOT,
  );
  if (shared.length !== 1) {
    errors.push(
      `write plan must contain exactly one complete shared skills tree, found ${shared.length}`,
    );
    return;
  }
  const catalog = shared[0]?.artifacts.find(
    (artifact) => String(artifact.path) === SKILLS_CATALOG,
  );
  if (catalog?.kind !== ArtifactKind.File) {
    errors.push(`shared skills tree must contain generated ${SKILLS_CATALOG}`);
  }
}

/**
 * Validates fragments and combines them into the canonical write plan.
 *
 * @param input - Shared and provider plan fragments to validate and combine.
 * @returns An immutable plan with deterministic fragment, ownership, and artifact order.
 * @throws {WritePlanValidationError} If ownership overlaps, paths or artifacts are invalid, owners repeat, or the shared skills tree contract is incomplete.
 */
export function buildWritePlan(input: WritePlanInput): WritePlan {
  const fragments = materializeFragments(input);
  const errors: string[] = [];
  for (const fragment of fragments) validateFragment(fragment, errors);
  validateCrossFragmentCollisions(fragments, errors);
  validateSharedSkillsFragment(fragments, errors);
  if (errors.length > 0) throw new WritePlanValidationError(errors);

  return snapshotWritePlan({
    fragments: fragments.map((fragment) => ({
      ownerId: fragment.ownerId,
      ownership:
        fragment.ownership.kind === OwnershipKind.ExactFiles
          ? {
              kind: fragment.ownership.kind,
              paths: [...fragment.ownership.paths].sort(compareProjectPaths),
            }
          : fragment.ownership,
      artifacts: fragment.artifacts,
    })),
  });
}
