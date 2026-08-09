import type {
  OutputFragment,
  ProjectPath,
  ValidatedPlugin,
} from "../../core/index.js";
import { Provider } from "../provider.js";

export const PROVIDERS: readonly Provider[] = Object.freeze([
  Provider.Claude,
  Provider.Codex,
]);

export enum ProviderSelectionErrorReason {
  Duplicate = "duplicate",
  Unknown = "unknown",
}

export class ProviderSelectionError extends Error {
  override readonly name = "ProviderSelectionError";

  constructor(
    readonly provider: string,
    readonly reason: ProviderSelectionErrorReason,
  ) {
    super(`${reason} provider ${JSON.stringify(provider)}`);
    Object.freeze(this);
  }
}

export interface ProviderContext {
  readonly plugin: ValidatedPlugin;
}

/** Pure provider seam. Owned paths are exact files, never directory prefixes. */
export interface CompilerProvider {
  readonly id: Provider;
  readonly ownedPaths: readonly ProjectPath[];
  compile(context: ProviderContext): OutputFragment;
}

export function createProviders(
  values: Iterable<Provider>,
): readonly Provider[] {
  const selected: Provider[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!(PROVIDERS as readonly string[]).includes(value)) {
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
    selected.push(value);
  }
  return Object.freeze(selected);
}

export function createProviderContext(
  plugin: ValidatedPlugin,
): ProviderContext {
  return Object.freeze({ plugin });
}
