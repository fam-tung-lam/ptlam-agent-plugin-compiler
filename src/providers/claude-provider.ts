import {
  ArtifactKind,
  CLAUDE,
  createPlanFragment,
  createProjectPath,
  OwnershipKind,
  type PlanFragment,
  PluginSchemaVersion,
  type ProviderAdapter,
  type ProviderContext,
  type ProviderId,
  selectPublishedSkills,
} from "../core/index.js";
import {
  hasMappedHookBindings,
  NESTED_HOOK_EVENT_MAP,
  renderNestedHookConfiguration,
  supportedHookEvents,
} from "./render-hooks.js";
import { renderJson } from "./render-json.js";

const hooksPath = createProjectPath("hooks/claude-hooks.json");
const marketplacePath = createProjectPath(".claude-plugin/marketplace.json");
const pluginPath = createProjectPath(".claude-plugin/plugin.json");
const pluginRoot = `\${CLAUDE_PLUGIN_ROOT}`;

/**
 * Built-in adapter for Claude plugin and marketplace manifests.
 *
 * It owns `.claude-plugin/plugin.json` and
 * `.claude-plugin/marketplace.json`; the shared compiler renderer owns the
 * referenced `skills/` tree.
 *
 * @example
 * ```ts
 * const registry = new ProviderAdapterRegistry([
 *   new ClaudeProviderAdapter(),
 * ]);
 * const compiler = new AgentPluginCompiler(
 *   { rootDir: process.cwd(), providers: [CLAUDE] },
 *   registry,
 * );
 * ```
 */
export class ClaudeProviderAdapter implements ProviderAdapter {
  /** Built-in Claude provider identifier. */
  readonly id: ProviderId = CLAUDE;
  /** Universal events with native Claude Code equivalents. */
  readonly supportedHookEvents = supportedHookEvents(NESTED_HOOK_EVENT_MAP);

  /**
   * Render Claude manifests from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing both Claude manifests.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
    const ownsHooks = plugin.schema_version === PluginSchemaVersion.V2;
    const hasHooks = hasMappedHookBindings(plugin, NESTED_HOOK_EVENT_MAP);
    const publishedSkills = selectPublishedSkills(plugin.skills);
    const pluginJson = renderJson({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      homepage: plugin.homepage,
      repository: plugin.repository,
      license: plugin.license,
      keywords: plugin.keywords,
      skills: publishedSkills.map((skill) => `./skills/${skill.id}`),
      ...(!hasHooks ? {} : { hooks: "./hooks/claude-hooks.json" }),
    });
    const marketplaceJson = renderJson({
      name: plugin.name,
      owner: {
        name: plugin.author.name,
        ...(plugin.author.email === undefined
          ? {}
          : { email: plugin.author.email }),
        ...(plugin.author.url === undefined ? {} : { url: plugin.author.url }),
      },
      description: plugin.description,
      plugins: [
        {
          name: plugin.name,
          source: "./",
          description: plugin.description,
          keywords: plugin.keywords,
        },
      ],
    });

    return createPlanFragment({
      ownerId: this.id,
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [...(ownsHooks ? [hooksPath] : []), marketplacePath, pluginPath],
      },
      artifacts: [
        {
          kind: ArtifactKind.File,
          path: pluginPath,
          content: pluginJson,
        },
        {
          kind: ArtifactKind.File,
          path: marketplacePath,
          content: marketplaceJson,
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
                    provider: "claude",
                    pluginRoot,
                  }),
                ),
              },
            ]),
      ],
    });
  }
}
