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
import { renderNestedHookConfiguration } from "./render-hooks.js";
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
  /** Claude Code supports both provider-neutral lifecycle stages. */
  readonly supportsHooks = true;

  /**
   * Render Claude manifests from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing both Claude manifests.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
    const ownsHooks = plugin.schema_version === PluginSchemaVersion.V2;
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
      ...(plugin.hooks.length === 0
        ? {}
        : { hooks: "./hooks/claude-hooks.json" }),
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
        ...(plugin.hooks.length === 0
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
                    requestEvent: "UserPromptSubmit",
                    responseEvent: "Stop",
                  }),
                ),
              },
            ]),
      ],
    });
  }
}
