import type { ProviderAdapter } from "../core/index.js";
import { ClaudeProviderAdapter } from "./claude-provider.js";
import { CodexProviderAdapter } from "./codex-provider.js";

export enum ProviderSelectionErrorReason {
  Duplicate = "duplicate",
  Unknown = "unknown",
}

export class ProviderSelectionError extends TypeError {
  override readonly name = "ProviderSelectionError";

  constructor(
    readonly provider: string,
    readonly reason: ProviderSelectionErrorReason,
  ) {
    super(`${reason} provider ${JSON.stringify(provider)}`);
    Object.freeze(this);
  }
}

export class ProviderAdapterRegistry {
  private readonly adapters: readonly ProviderAdapter[];

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

  static withBuiltIns(): ProviderAdapterRegistry {
    return new ProviderAdapterRegistry([
      new ClaudeProviderAdapter(),
      new CodexProviderAdapter(),
    ]);
  }

  register(adapter: ProviderAdapter): ProviderAdapterRegistry {
    return new ProviderAdapterRegistry([...this.adapters, adapter]);
  }

  has(id: string): boolean {
    return this.adapters.some((adapter) => adapter.id === id);
  }

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

  list(): readonly ProviderAdapter[] {
    return this.adapters;
  }
}
