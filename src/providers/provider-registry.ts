import { claudeProvider } from "./claude-provider.js";
import { codexProvider } from "./codex-provider.js";
import {
  type CompilerProvider,
  createProviders,
  PROVIDERS,
} from "./models/provider.js";
import type { Provider } from "./provider.js";

const providersById: ReadonlyMap<Provider, CompilerProvider> = new Map([
  [claudeProvider.id, claudeProvider],
  [codexProvider.id, codexProvider],
]);

/** All built-in providers in stable provider order. */
export const availableProviders: readonly CompilerProvider[] = Object.freeze(
  PROVIDERS.map((providerTarget) => {
    const provider = providersById.get(providerTarget);
    if (provider === undefined) {
      throw new Error(
        `Missing built-in provider ${JSON.stringify(providerTarget)}`,
      );
    }
    return provider;
  }),
);

/** Resolve an explicit subset in stable order, rejecting unknown or duplicates. */
export function resolveProviders(
  values: Iterable<Provider>,
): readonly CompilerProvider[] {
  const selectedIds = new Set(createProviders(values));
  return Object.freeze(
    availableProviders.filter((provider) => selectedIds.has(provider.id)),
  );
}
