import {
  ArtifactKind,
  createPlanFragment,
  createProjectPath,
  GEMINI,
  OwnershipKind,
  type PlanFragment,
  PluginSchemaVersion,
  type ProviderAdapter,
  type ProviderContext,
  type ProviderId,
} from "../core/index.js";
import {
  GEMINI_HOOK_EVENT_MAP,
  hasMappedHookBindings,
  renderGeminiHookConfiguration,
  supportedHookEvents,
} from "./render-hooks.js";
import { renderJson } from "./render-json.js";

const extensionPath = createProjectPath("gemini-extension.json");
const hooksPath = createProjectPath("hooks/hooks.json");

/**
 * Built-in adapter for the Gemini CLI extension manifest.
 *
 * It owns `gemini-extension.json`; Gemini discovers the shared root `skills/`
 * directory by convention after installing the extension.
 *
 * @example
 * ```ts
 * const registry = new ProviderAdapterRegistry([
 *   new GeminiProviderAdapter(),
 * ]);
 * const compiler = new AgentPluginCompiler(
 *   { rootDir: process.cwd(), providers: [GEMINI] },
 *   registry,
 * );
 * ```
 */
export class GeminiProviderAdapter implements ProviderAdapter {
  /** Built-in Gemini provider identifier. */
  readonly id: ProviderId = GEMINI;
  /** Universal events with native Gemini CLI equivalents. */
  readonly supportedHookEvents = supportedHookEvents(GEMINI_HOOK_EVENT_MAP);

  /**
   * Render the Gemini extension manifest from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing the Gemini extension manifest.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
    const ownsHooks = plugin.schema_version === PluginSchemaVersion.V2;
    const hasHooks = hasMappedHookBindings(plugin, GEMINI_HOOK_EVENT_MAP);
    const extensionJson = renderJson({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
    });

    return createPlanFragment({
      ownerId: this.id,
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [extensionPath, ...(ownsHooks ? [hooksPath] : [])],
      },
      artifacts: [
        {
          kind: ArtifactKind.File,
          path: extensionPath,
          content: extensionJson,
        },
        ...(!hasHooks
          ? []
          : [
              {
                kind: ArtifactKind.File as const,
                path: hooksPath,
                content: renderJson(renderGeminiHookConfiguration(plugin)),
              },
            ]),
      ],
    });
  }
}
