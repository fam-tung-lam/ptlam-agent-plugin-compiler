import {
  ArtifactKind,
  CLAUDE,
  createPlanFragment,
  createProjectPath,
  OwnershipKind,
  type PlanFragment,
  type ProviderAdapter,
  type ProviderContext,
  type ProviderId,
  selectPublishedSkills,
} from "../core/index.js";
import { renderJson } from "./render-json.js";

const marketplacePath = createProjectPath(".claude-plugin/marketplace.json");
const pluginPath = createProjectPath(".claude-plugin/plugin.json");

/** Pure Claude adapter for the official plugin and marketplace manifests. */
export class ClaudeProviderAdapter implements ProviderAdapter {
  readonly id: ProviderId = CLAUDE;

  compile({ plugin }: ProviderContext): PlanFragment {
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
    });
    const marketplaceJson = renderJson({
      name: plugin.marketplace.name,
      owner: {
        name: plugin.author.name,
        ...(plugin.author.email === undefined
          ? {}
          : { email: plugin.author.email }),
        ...(plugin.author.url === undefined ? {} : { url: plugin.author.url }),
      },
      description: plugin.marketplace.description,
      plugins: [
        {
          name: plugin.name,
          source: "./",
          description: plugin.marketplace.plugin_description,
          category: plugin.marketplace.category,
          keywords: plugin.marketplace.keywords,
        },
      ],
    });

    return createPlanFragment({
      ownerId: this.id,
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [marketplacePath, pluginPath],
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
      ],
    });
  }
}
