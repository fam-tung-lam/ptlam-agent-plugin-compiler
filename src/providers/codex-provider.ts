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

/** Pure Codex adapter for the official plugin manifest. */
export class CodexProviderAdapter implements ProviderAdapter {
  readonly id: ProviderId = CODEX;

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
