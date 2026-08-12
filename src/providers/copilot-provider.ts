import {
  ArtifactKind,
  COPILOT,
  createPlanFragment,
  createProjectPath,
  OwnershipKind,
  type PlanFragment,
  PluginSchemaVersion,
  type ProviderAdapter,
  type ProviderContext,
  type ProviderId,
} from "../core/index.js";
import { renderCopilotHookConfiguration } from "./render-hooks.js";
import { renderJson } from "./render-json.js";

const hooksPath = createProjectPath("hooks/copilot-hooks.json");
const pluginPath = createProjectPath("plugin.json");
const portablePluginSchema =
  "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";

/**
 * Built-in adapter for the portable Agent Plugins manifest used by Copilot CLI.
 *
 * It owns the root `plugin.json`; the shared compiler renderer owns the
 * conventionally discovered `skills/` tree.
 *
 * @example
 * ```ts
 * const registry = new ProviderAdapterRegistry([
 *   new CopilotProviderAdapter(),
 * ]);
 * const compiler = new AgentPluginCompiler(
 *   { rootDir: process.cwd(), providers: [COPILOT] },
 *   registry,
 * );
 * ```
 */
export class CopilotProviderAdapter implements ProviderAdapter {
  /** Built-in GitHub Copilot CLI provider identifier. */
  readonly id: ProviderId = COPILOT;
  /** Copilot CLI supports both provider-neutral lifecycle stages. */
  readonly supportsHooks = true;

  /**
   * Render the portable Agent Plugins manifest from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing the root Copilot manifest.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
    const ownsHooks = plugin.schema_version === PluginSchemaVersion.V2;
    const pluginJson = renderJson({
      $schema: portablePluginSchema,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      homepage: plugin.homepage,
      repository: plugin.repository,
      license: plugin.license,
      keywords: plugin.keywords,
      ...(plugin.hooks.length === 0
        ? {}
        : { hooks: "./hooks/copilot-hooks.json" }),
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
        ...(plugin.hooks.length === 0
          ? []
          : [
              {
                kind: ArtifactKind.File as const,
                path: hooksPath,
                content: renderJson(renderCopilotHookConfiguration(plugin)),
              },
            ]),
      ],
    });
  }
}
