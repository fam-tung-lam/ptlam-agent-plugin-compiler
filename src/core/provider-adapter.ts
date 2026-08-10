import type { PlanFragment } from "./generated/plan-fragment.js";
import type { ProviderId } from "./identifiers.js";
import type { Plugin } from "./plugin/plugin.js";

/**
 * Immutable input supplied to a provider adapter.
 *
 * @example
 * ```ts
 * const adapter: ProviderAdapter = {
 *   id: createProviderId("external"),
 *   compile: ({ plugin }) => createPlanFragment({
 *     ownerId: "external",
 *     ownership: { kind: OwnershipKind.ExactFiles, paths: [] },
 *     artifacts: [],
 *   }),
 * };
 * ```
 */
export interface ProviderContext {
  /** Fully validated plugin domain model to render for one host. */
  readonly plugin: Plugin;
}

/**
 * Pure in-process seam for one host-specific renderer.
 *
 * Implementations should derive deterministic artifacts only from the supplied
 * context and declare stable, metadata-independent exact-file ownership through
 * the returned fragment. Provider adapters cannot own complete trees because an
 * unselected provider expresses desired absence by retaining that exact ownership
 * without artifacts.
 *
 * @example
 * ```ts
 * const externalId = createProviderId("external");
 * const adapter: ProviderAdapter = {
 *   id: externalId,
 *   compile: () => createPlanFragment({
 *     ownerId: externalId,
 *     ownership: { kind: OwnershipKind.ExactFiles, paths: [] },
 *     artifacts: [],
 *   }),
 * };
 * ```
 */
export interface ProviderAdapter {
  /** Stable identifier selected through compiler options. */
  readonly id: ProviderId;
  /**
   * Render this provider's generated contribution.
   *
   * @param context - Validated plugin data shared with provider adapters.
   * @returns Stable exact-file ownership and the provider's generated artifacts.
   * @throws {TypeError} When the fragment does not use exact-file ownership.
   */
  compile(context: ProviderContext): PlanFragment;
}

/**
 * Freeze validated plugin data as a provider context.
 *
 * @param plugin - Validated plugin domain model.
 * @returns An immutable provider context.
 */
export function createProviderContext(plugin: Plugin): ProviderContext {
  return Object.freeze({ plugin });
}
