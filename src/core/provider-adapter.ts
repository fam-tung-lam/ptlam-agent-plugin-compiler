import type { PlanFragment } from "./generated/plan-fragment.js";
import type { ProviderId } from "./identifiers.js";
import type { Plugin } from "./plugin/plugin.js";

export interface ProviderContext {
  readonly plugin: Plugin;
}

/** Pure in-process seam for one host-specific renderer. */
export interface ProviderAdapter {
  readonly id: ProviderId;
  compile(context: ProviderContext): PlanFragment;
}

export function createProviderContext(plugin: Plugin): ProviderContext {
  return Object.freeze({ plugin });
}
