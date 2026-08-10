import {
  createCategoryId,
  createPlugin,
  createProjectPath,
  createSkillId,
  type Plugin,
  PluginSchemaVersion,
  SkillStatus,
  SkillVisibility,
} from "../../../../../src/core/index.ts";

export function makePluginFixture(
  author: {
    readonly name: string;
    readonly email?: string;
    readonly url?: string;
  } = {
    name: "Fixture Owner",
    email: "owner@example.test",
    url: "https://example.test/owner",
  },
): Plugin {
  const engineering = createCategoryId("engineering");
  const active = createSkillId("active-skill");
  return createPlugin({
    schema_version: PluginSchemaVersion.V1,
    name: "fixture-skills",
    description: "Fixture plugin description.",
    version: "1.2.3",
    author,
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
        id: engineering,
        name: "Engineering",
        description: "Engineering skills.",
      },
    ],
    skills: [
      {
        id: active,
        description: "An active public skill.",
        category_id: engineering,
        visibility: SkillVisibility.Public,
        status: SkillStatus.Active,
        required_skills: [],
        source_path: createProjectPath("plugin/skills/active-skill"),
        source_body: "# Active\n",
        resources: [],
      },
      {
        id: createSkillId("deprecated-skill"),
        description: "A deprecated public skill.",
        category_id: engineering,
        visibility: SkillVisibility.Public,
        status: SkillStatus.Deprecated,
        required_skills: [],
        deprecation: {
          reason: "Use active-skill.",
          instructions: "Migrate to active-skill.",
          replacement_skill_id: active,
        },
        source_path: createProjectPath("plugin/skills/deprecated-skill"),
        source_body: "# Deprecated\n",
        resources: [],
      },
      {
        id: createSkillId("internal-skill"),
        description: "An internal dependency.",
        category_id: engineering,
        visibility: SkillVisibility.Internal,
        status: SkillStatus.Active,
        required_skills: [],
        source_path: createProjectPath("plugin/skills/internal-skill"),
        source_body: "# Internal\n",
        resources: [],
      },
      {
        id: createSkillId("draft-skill"),
        description: "A draft public skill.",
        category_id: engineering,
        visibility: SkillVisibility.Public,
        status: SkillStatus.Draft,
        required_skills: [],
        source_path: createProjectPath("plugin/skills/draft-skill"),
        source_body: "# Draft\n",
        resources: [],
      },
    ],
  });
}
