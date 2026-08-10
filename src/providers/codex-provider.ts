import {
  ArtifactKind,
  CODEX,
  createPlanFragment,
  createProjectPath,
  OwnershipKind,
  type PlanFragment,
  type ProviderAdapter,
  type ProviderContext,
  type ProviderId,
} from "../core/index.js";
import { renderJson } from "./render-json.js";

const pluginPath = createProjectPath(".codex-plugin/plugin.json");

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

  /**
   * Render the Codex manifest from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing the Codex manifest.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
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
