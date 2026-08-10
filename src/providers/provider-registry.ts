import type { ProviderAdapter } from "../core/index.js";
import { ClaudeProviderAdapter } from "./claude-provider.js";
import { CodexProviderAdapter } from "./codex-provider.js";

/** Why a provider selection could not be resolved. */
export enum ProviderSelectionErrorReason {
  /** The same provider was selected more than once. */
  Duplicate = "duplicate",
  /** No registered adapter has the selected identifier. */
  Unknown = "unknown",
}

/** A duplicate or unknown provider selection. */
export class ProviderSelectionError extends TypeError {
  override readonly name = "ProviderSelectionError";

  /**
   * @param provider - Provider identifier that could not be resolved.
   * @param reason - Classification of the selection failure.
   */
  constructor(
    /** Provider identifier that could not be resolved. */
    readonly provider: string,
    /** Classification of the selection failure. */
    readonly reason: ProviderSelectionErrorReason,
  ) {
    super(`${reason} provider ${JSON.stringify(provider)}`);
    Object.freeze(this);
  }
}

/**
 * Immutable per-compiler registry of provider adapters.
 *
 * Registration returns a new registry, so independently configured compiler
 * instances cannot leak provider state into each other.
 *
 * @example
 * ```ts
 * const externalId = createProviderId("external");
 * const registry = new ProviderAdapterRegistry().register({
 *   id: externalId,
 *   compile: () => createPlanFragment({
 *     ownerId: externalId,
 *     ownership: { kind: OwnershipKind.ExactFiles, paths: [] },
 *     artifacts: [],
 *   }),
 * });
 * const compiler = new AgentPluginCompiler(
 *   { rootDir: process.cwd(), providers: [externalId] },
 *   registry,
 * );
 * ```
 */
export class ProviderAdapterRegistry {
  private readonly adapters: readonly ProviderAdapter[];

  /**
   * Create a registry from a snapshot of adapters.
   *
   * @param adapters - Initial adapters in stable resolution order.
   * @throws `TypeError` When two adapters have the same identifier.
   */
  constructor(adapters: Iterable<ProviderAdapter> = []) {
    const snapshot = [...adapters];
    const seen = new Set<string>();
    for (const adapter of snapshot) {
      if (seen.has(adapter.id)) {
        throw new TypeError(
          `Duplicate provider adapter ${JSON.stringify(adapter.id)}`,
        );
      }
      seen.add(adapter.id);
    }
    this.adapters = Object.freeze(snapshot);
    Object.freeze(this);
  }

  /**
   * Create an isolated registry containing the Claude and Codex adapters.
   *
   * @returns A new immutable registry in Claude-then-Codex order.
   *
   * @example
   * ```ts
   * const registry = ProviderAdapterRegistry.withBuiltIns();
   * ```
   */
  static withBuiltIns(): ProviderAdapterRegistry {
    return new ProviderAdapterRegistry([
      new ClaudeProviderAdapter(),
      new CodexProviderAdapter(),
    ]);
  }

  /**
   * Add an adapter without mutating this registry.
   *
   * @param adapter - Provider adapter to add after existing adapters.
   * @returns A new immutable registry containing the adapter.
   * @throws `TypeError` When the adapter identifier is already registered.
   *
   * @example
   * ```ts
   * const extended = registry.register(externalAdapter);
   * ```
   */
  register(adapter: ProviderAdapter): ProviderAdapterRegistry {
    return new ProviderAdapterRegistry([...this.adapters, adapter]);
  }

  /**
   * Test whether an adapter identifier is registered.
   *
   * @param id - Provider identifier to look up.
   * @returns `true` when the registry contains a matching adapter.
   */
  has(id: string): boolean {
    return this.adapters.some((adapter) => adapter.id === id);
  }

  /**
   * Resolve a selection in stable registry order.
   *
   * @param ids - Provider identifiers to select.
   * @returns A frozen array of matching adapters in registry order.
   * @throws {@link ProviderSelectionError} When an identifier is unknown or
   * selected more than once.
   */
  resolve(ids: Iterable<string>): readonly ProviderAdapter[] {
    const selectedIds = new Set<string>();
    for (const id of ids) {
      if (!this.has(id)) {
        throw new ProviderSelectionError(
          id,
          ProviderSelectionErrorReason.Unknown,
        );
      }
      if (selectedIds.has(id)) {
        throw new ProviderSelectionError(
          id,
          ProviderSelectionErrorReason.Duplicate,
        );
      }
      selectedIds.add(id);
    }
    return Object.freeze(
      this.adapters.filter((adapter) => selectedIds.has(adapter.id)),
    );
  }

  /**
   * List every registered adapter in stable registry order.
   *
   * @returns The registry's immutable adapter snapshot.
   */
  list(): readonly ProviderAdapter[] {
    return this.adapters;
  }
}
