import {
  createProjectPath,
  OutputEntryKind,
  type OutputFragmentInput,
  OutputOwnershipKind,
  selectPublishedSkills,
} from "../core/index.js";
import type { ProviderContext } from "./models/provider.js";
import { createCompilerProvider } from "./provider-contract.js";
import { renderJson } from "./render-json.js";

const marketplacePath = createProjectPath(".claude-plugin/marketplace.json");
const pluginPath = createProjectPath(".claude-plugin/plugin.json");
const ownedPaths = Object.freeze([marketplacePath, pluginPath]);

function compileClaude({ plugin }: ProviderContext): OutputFragmentInput {
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

  return {
    ownerId: "claude",
    ownership: {
      kind: OutputOwnershipKind.ExactFiles,
      paths: ownedPaths,
    },
    artifacts: [
      {
        kind: OutputEntryKind.File,
        path: pluginPath,
        content: pluginJson,
      },
      {
        kind: OutputEntryKind.File,
        path: marketplacePath,
        content: marketplaceJson,
      },
    ],
  };
}

/** Pure Claude adapter for the official plugin and marketplace manifests. */
export const claudeProvider = createCompilerProvider({
  id: "claude",
  ownedPaths,
  compile: compileClaude,
});
