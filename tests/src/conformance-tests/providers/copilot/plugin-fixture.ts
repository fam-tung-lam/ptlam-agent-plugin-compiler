import {
  COPILOT,
  createPlugin,
  type Plugin,
  PluginSchemaVersion,
} from "../../../../../src/core/index.ts";

export function makeCopilotConformancePlugin(): Plugin {
  return createPlugin({
    schema_version: PluginSchemaVersion.V1,
    providers: [COPILOT],
    name: "fixture-skills",
    description: "Fixture plugin description.",
    version: "1.2.3",
    author: {
      name: "Fixture Owner",
      email: "owner@example.test",
      url: "https://example.test/owner",
    },
    homepage: "https://example.test/plugin",
    repository: "https://example.test/repository",
    license: "MIT",
    keywords: ["agent-skills", "fixtures"],
    categories: [],
    skills: [],
  });
}
