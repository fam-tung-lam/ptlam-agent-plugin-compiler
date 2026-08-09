import {
  compareProjectPaths,
  createOutputFragment,
  createProjectPath,
  OutputEntryKind,
  type OutputFragment,
  type OutputFragmentInput,
  OutputOwnershipKind,
  type ProjectPath,
} from "../core/index.js";
import {
  type CompilerProvider,
  createProviders,
  type ProviderContext,
} from "./models/provider.js";
import type { Provider } from "./provider.js";

export interface CompilerProviderDefinition {
  readonly id: Provider;
  readonly ownedPaths: Iterable<ProjectPath>;
  compile(context: ProviderContext): OutputFragmentInput;
}

/** A deterministic failure of the pure provider ownership contract. */
export class ProviderContractError extends Error {
  override readonly name = "ProviderContractError";
  readonly provider: Provider;
  readonly violations: readonly string[];

  constructor(provider: Provider, violations: Iterable<string>) {
    const normalized = Object.freeze(
      [...new Set(violations)].sort((left, right) =>
        left < right ? -1 : left > right ? 1 : 0,
      ),
    );
    super(
      `Provider ${JSON.stringify(provider)} violated its contract:\n${normalized
        .map((violation) => `- ${violation}`)
        .join("\n")}`,
    );
    this.provider = provider;
    this.violations = normalized;
    Object.freeze(this);
  }
}

function snapshotOwnedPaths(
  provider: Provider,
  values: Iterable<ProjectPath>,
): readonly ProjectPath[] {
  const paths = [...values]
    .map((value) => createProjectPath(String(value)))
    .sort(compareProjectPaths);
  const duplicate = paths.find((path, index) => path === paths[index - 1]);
  if (duplicate !== undefined) {
    throw new ProviderContractError(provider, [
      `declares duplicate owned path ${JSON.stringify(String(duplicate))}`,
    ]);
  }
  return Object.freeze(paths);
}

function validateFragment(
  provider: Provider,
  ownedPaths: readonly ProjectPath[],
  fragment: OutputFragment,
): void {
  const violations: string[] = [];
  if (fragment.ownerId !== provider) {
    violations.push(
      `returned owner ${JSON.stringify(fragment.ownerId)} instead of ${JSON.stringify(provider)}`,
    );
  }

  if (fragment.ownership.kind !== OutputOwnershipKind.ExactFiles) {
    violations.push("returned non-exact output ownership");
  } else {
    const fragmentPaths = [...fragment.ownership.paths].sort(
      compareProjectPaths,
    );
    if (
      fragmentPaths.length !== ownedPaths.length ||
      fragmentPaths.some((path, index) => path !== ownedPaths[index])
    ) {
      violations.push(
        `returned ownership [${fragmentPaths.map(String).join(", ")}] instead of [${ownedPaths.map(String).join(", ")}]`,
      );
    }
  }

  const artifactPaths = fragment.artifacts
    .map((artifact) => artifact.path)
    .sort(compareProjectPaths);
  const artifactPathSet = new Set<string>();
  for (const artifact of fragment.artifacts) {
    const artifactPath = String(artifact.path);
    if (artifact.kind !== OutputEntryKind.File) {
      violations.push(
        `returned non-file artifact ${JSON.stringify(artifactPath)}`,
      );
    }
    if (artifactPathSet.has(artifactPath)) {
      violations.push(
        `returned duplicate artifact ${JSON.stringify(artifactPath)}`,
      );
    }
    artifactPathSet.add(artifactPath);
  }
  if (
    artifactPaths.length !== ownedPaths.length ||
    artifactPaths.some((path, index) => path !== ownedPaths[index])
  ) {
    violations.push(
      `returned artifacts [${artifactPaths.map(String).join(", ")}] instead of [${ownedPaths.map(String).join(", ")}]`,
    );
  }

  if (violations.length > 0) {
    throw new ProviderContractError(provider, violations);
  }
}

/** Create one immutable provider whose compile result is ownership-checked. */
export function createCompilerProvider(
  definition: CompilerProviderDefinition,
): CompilerProvider {
  const provider = createProviders([definition.id])[0];
  if (provider === undefined) {
    throw new TypeError("Compiler provider must declare one provider");
  }
  const ownedPaths = snapshotOwnedPaths(provider, definition.ownedPaths);
  return Object.freeze({
    id: provider,
    ownedPaths,
    compile(context: ProviderContext): OutputFragment {
      const fragment = createOutputFragment(definition.compile(context));
      validateFragment(provider, ownedPaths, fragment);
      return fragment;
    },
  });
}
