import {
  createProjectPath,
  createValidatedPlugin,
  PluginSchemaVersion,
  SkillStatus,
  SkillVisibility,
  type ValidatedPlugin,
} from "../../../../src/core/index.ts";

export function makeClaudeConformancePlugin(): ValidatedPlugin {
  return createValidatedPlugin({
    schema_version: PluginSchemaVersion.V1,
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
    marketplace: {
      name: "fixture-marketplace",
      description: "Fixture marketplace.",
      plugin_description: "Installable fixture skills.",
      category: "development",
      keywords: ["agent-skills", "testing"],
    },
    categories: [
      {
        id: "engineering",
        name: "Engineering",
        description: "Engineering skills.",
      },
    ],
    skills: [
      {
        id: "active-skill",
        description: "An active public skill.",
        category_id: "engineering",
        visibility: SkillVisibility.Public,
        status: SkillStatus.Active,
        required_skills: [],
        source_path: createProjectPath("plugin/skills/active-skill"),
        source_body: "# Active\n",
        resources: [],
      },
    ],
  });
}
