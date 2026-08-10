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

  /**
   * Render the Kimi manifest from a validated plugin.
   *
   * @param context - Validated plugin data.
   * @returns An exact-file fragment containing the Kimi manifest.
   */
  compile({ plugin }: ProviderContext): PlanFragment {
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
