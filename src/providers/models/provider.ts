import type {
  OutputFragment,
  ProjectPath,
  ValidatedPlugin,
} from "../../core/index.js";

export const PROVIDER_IDS = Object.freeze(["claude", "codex"] as const);
export type ProviderId = (typeof PROVIDER_IDS)[number];

export enum ProviderSelectionErrorReason {
  Duplicate = "duplicate",
  Unknown = "unknown",
}

export class ProviderSelectionError extends Error {
  override readonly name = "ProviderSelectionError";

  constructor(
    readonly providerId: string,
    readonly reason: ProviderSelectionErrorReason,
  ) {
    super(`${reason} provider id ${JSON.stringify(providerId)}`);
    Object.freeze(this);
  }
}

export interface ProviderContext {
  readonly plugin: ValidatedPlugin;
}

/** Pure provider seam. Owned paths are exact files, never directory prefixes. */
export interface CompilerProvider {
  readonly id: ProviderId;
  readonly ownedPaths: readonly ProjectPath[];
  compile(context: ProviderContext): OutputFragment;
}

export function createProviderIds(
  values: Iterable<string>,
): readonly ProviderId[] {
  const selected: ProviderId[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!(PROVIDER_IDS as readonly string[]).includes(value)) {
      throw new ProviderSelectionError(
        value,
        ProviderSelectionErrorReason.Unknown,
      );
    }
    if (seen.has(value)) {
      throw new ProviderSelectionError(
        value,
        ProviderSelectionErrorReason.Duplicate,
      );
    }
    seen.add(value);
    selected.push(value as ProviderId);
  }
  return Object.freeze(selected);
}

export function createProviderContext(
  plugin: ValidatedPlugin,
): ProviderContext {
  return Object.freeze({ plugin });
}
