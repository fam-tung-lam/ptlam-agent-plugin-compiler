import {
  CLAUDE,
  createCategoryId,
  createHookId,
  createPlugin,
  createProjectPath,
  createSkillId,
  type Plugin,
  PluginSchemaVersion,
  SkillStatus,
  SkillVisibility,
  UniversalHookEvent,
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
    providers: [CLAUDE],
    name: "fixture-skills",
    description: "Fixture plugin description.",
    version: "1.2.3",
    author,
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
        id: active,
        description: "An active public skill.",
        disable_model_invocation: false,
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
        disable_model_invocation: false,
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
        disable_model_invocation: false,
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
        disable_model_invocation: false,
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

/** Create one provider fixture containing the portable adaptive hook shape. */
export function makeHookPluginFixture(): Plugin {
  const plugin = makePluginFixture();
  return createPlugin({
    ...plugin,
    schema_version: PluginSchemaVersion.V2,
    categories: plugin.categories,
    hooks: [
      {
        id: createHookId("adaptive-interaction"),
        bindings: [
          {
            event: UniversalHookEvent.UserPromptSubmit,
            handler: createProjectPath("request.mjs"),
          },
          {
            event: UniversalHookEvent.Stop,
            handler: createProjectPath("response.mjs"),
          },
        ],
        source_path: createProjectPath("plugin/hooks/adaptive-interaction"),
        resources: [
          {
            path: createProjectPath("request.mjs"),
            content: Buffer.from("export async function handle() {}\n"),
          },
          {
            path: createProjectPath("response.mjs"),
            content: Buffer.from("export async function handle() {}\n"),
          },
          {
            path: createProjectPath("policies/style.json"),
            content: Buffer.from('{"concise":true}\n'),
          },
        ],
      },
    ],
    skills: plugin.skills,
  });
}
