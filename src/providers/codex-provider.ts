import {
  ArtifactKind,
  CODEX,
  createPlanFragment,
  createProjectPath,
  OwnershipKind,
  type PlanFragment,
  PluginSchemaVersion,
  type ProviderAdapter,
  type ProviderContext,
  type ProviderId,
} from "../core/index.js";
import {
  hasMappedHookRegistrations,
  NESTED_HOOK_EVENT_MAP,
  renderNestedHookConfiguration,
  supportedHookEvents,
} from "./render-hooks.js";
import { renderJson } from "./render-json.js";

const hooksPath = createProjectPath("hooks/codex-hooks.json");
const pluginPath = createProjectPath(".codex-plugin/plugin.json");
const pluginRoot = `\${PLUGIN_ROOT}`;

/**
 * Built-in adapter for the Codex plugin manifest.
 *
 * It owns `.codex-plugin/plugin.json`; the shared compiler renderer owns the
 * referenced `skills/` tree.
 *
 * @example
 * ```ts
 * const registry = new ProviderAdapterRegistry([
 *   new CodexProviderAdapter(),
 * ]);
 * const compiler = new AgentPluginCompiler(
 *   { rootDir: process.cwd(), providers: [CODEX] },
 *   registry,
 * );
 * ```
 */
export class CodexProviderAdapter implements ProviderAdapter {
  /** Built-in Codex provider identifier. */
  readonly id: ProviderId = CODEX;
  /** Universal events with native Codex command-hook equivalents. */
  readonly supportedHookEvents = supportedHookEvents(NESTED_HOOK_EVENT_MAP);

  /**
   * Render the Codex manifest from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing the Codex manifest.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
    const ownsHooks = plugin.schema_version === PluginSchemaVersion.V2;
    const hasHooks = hasMappedHookRegistrations(plugin, NESTED_HOOK_EVENT_MAP);
    const pluginJson = renderJson({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      homepage: plugin.homepage,
      repository: plugin.repository,
      license: plugin.license,
      keywords: plugin.keywords,
      skills: "./skills/",
      ...(!hasHooks ? {} : { hooks: "./hooks/codex-hooks.json" }),
    });

    return createPlanFragment({
      ownerId: this.id,
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [...(ownsHooks ? [hooksPath] : []), pluginPath],
      },
      artifacts: [
        {
          kind: ArtifactKind.File,
          path: pluginPath,
          content: pluginJson,
        },
        ...(!hasHooks
          ? []
          : [
              {
                kind: ArtifactKind.File as const,
                path: hooksPath,
                content: renderJson(
                  renderNestedHookConfiguration({
                    plugin,
                    provider: "codex",
                    pluginRoot,
                  }),
                ),
              },
            ]),
      ],
    });
  }
}
