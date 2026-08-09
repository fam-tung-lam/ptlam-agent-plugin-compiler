import { claudeProvider } from "./claude-provider.js";
import { codexProvider } from "./codex-provider.js";
import {
  type CompilerProvider,
  createProviderIds,
  PROVIDER_IDS,
} from "./models/provider.js";

const providersById: ReadonlyMap<string, CompilerProvider> = new Map([
  [claudeProvider.id, claudeProvider],
  [codexProvider.id, codexProvider],
]);

/** All built-in providers in stable provider-ID order. */
export const availableProviders: readonly CompilerProvider[] = Object.freeze(
  PROVIDER_IDS.map((providerId) => {
    const provider = providersById.get(providerId);
    if (provider === undefined) {
      throw new Error(
        `Missing built-in provider ${JSON.stringify(providerId)}`,
      );
    }
    return provider;
  }),
);

/** Resolve an explicit subset in stable order, rejecting unknown or duplicate IDs. */
export function resolveProviders(
  values: Iterable<string>,
): readonly CompilerProvider[] {
  const selectedIds = new Set(createProviderIds(values));
  return Object.freeze(
    availableProviders.filter((provider) => selectedIds.has(provider.id)),
  );
}
