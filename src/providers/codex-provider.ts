import {
  createProjectPath,
  OutputEntryKind,
  type OutputFragmentInput,
  OutputOwnershipKind,
} from "../core/index.js";
import type { ProviderContext } from "./models/provider.js";
import { createCompilerProvider } from "./provider-contract.js";
import { renderJson } from "./render-json.js";

const pluginPath = createProjectPath(".codex-plugin/plugin.json");
const ownedPaths = Object.freeze([pluginPath]);

function compileCodex({ plugin }: ProviderContext): OutputFragmentInput {
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

  return {
    ownerId: "codex",
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
    ],
  };
}

/** Pure Codex adapter for the official plugin manifest. */
export const codexProvider = createCompilerProvider({
  id: "codex",
  ownedPaths,
  compile: compileCodex,
});
