import {
  CLAUDE,
  createCategoryId,
  createPlugin,
  createProjectPath,
  createSkillId,
  type Plugin,
  PluginSchemaVersion,
  SkillStatus,
  SkillVisibility,
} from "../../../../../src/core/index.ts";

export function makeClaudeConformancePlugin(): Plugin {
  const engineering = createCategoryId("engineering");
  return createPlugin({
    schema_version: PluginSchemaVersion.V1,
    providers: [CLAUDE],
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
    categories: [
      {
        id: engineering,
        name: "Engineering",
        description: "Engineering skills.",
      },
    ],
    skills: [
      {
        id: createSkillId("active-skill"),
        description: "An active public skill.",
        category_id: engineering,
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
