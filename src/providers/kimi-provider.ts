import {
  ArtifactKind,
  createPlanFragment,
  createProjectPath,
  KIMI,
  OwnershipKind,
  type PlanFragment,
  type ProviderAdapter,
  type ProviderContext,
  type ProviderId,
} from "../core/index.js";
import {
  hasMappedHookRegistrations,
  KIMI_HOOK_EVENT_MAP,
  renderKimiHooks,
  supportedHookEvents,
} from "./render-hooks.js";
import { renderJson } from "./render-json.js";

const pluginPath = createProjectPath("kimi.plugin.json");

/**
 * Built-in adapter for the Kimi Code CLI plugin manifest.
 *
 * It owns `kimi.plugin.json`; the shared compiler renderer owns the referenced
 * `skills/` tree.
 */
export class KimiProviderAdapter implements ProviderAdapter {
  /** Built-in Kimi provider identifier. */
  readonly id: ProviderId = KIMI;
  /** Universal events with native Kimi Code equivalents. */
  readonly supportedHookEvents = supportedHookEvents(KIMI_HOOK_EVENT_MAP);

  /**
   * Render the Kimi manifest from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing the Kimi manifest.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
    const hasHooks = hasMappedHookRegistrations(plugin, KIMI_HOOK_EVENT_MAP);
    const pluginJson = renderJson({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      keywords: plugin.keywords,
      author: {
        name: plugin.author.name,
        ...(plugin.author.email === undefined
          ? {}
          : { email: plugin.author.email }),
      },
      homepage: plugin.homepage,
      license: plugin.license,
      skills: "./skills/",
      ...(!hasHooks ? {} : { hooks: renderKimiHooks(plugin) }),
    });

    return createPlanFragment({
      ownerId: this.id,
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [pluginPath],
      },
      artifacts: [
        {
          kind: ArtifactKind.File,
          path: pluginPath,
          content: pluginJson,
        },
      ],
    });
  }
}
