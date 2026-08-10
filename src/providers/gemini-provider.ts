import {
  ArtifactKind,
  createPlanFragment,
  createProjectPath,
  GEMINI,
  OwnershipKind,
  type PlanFragment,
  type ProviderAdapter,
  type ProviderContext,
  type ProviderId,
} from "../core/index.js";
import { renderJson } from "./render-json.js";

const extensionPath = createProjectPath("gemini-extension.json");

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

  /**
   * Render the Gemini extension manifest from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing the Gemini extension manifest.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
    const extensionJson = renderJson({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
    });

    return createPlanFragment({
      ownerId: this.id,
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [extensionPath],
      },
      artifacts: [
        {
          kind: ArtifactKind.File,
          path: extensionPath,
          content: extensionJson,
        },
      ],
    });
  }
}
