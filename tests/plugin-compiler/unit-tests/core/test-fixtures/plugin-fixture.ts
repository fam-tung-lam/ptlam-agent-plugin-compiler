import {
  createPluginSource,
  createProjectPath,
  createValidatedPlugin,
  type Plugin,
  PluginSchemaVersion,
  type PluginSource,
  REQUIRED_SKILLS_MARKER,
  type Skill,
  SkillStatus,
  SkillVisibility,
  type SourceEntryInput,
  SourceEntryKind,
  type ValidatedPlugin,
  type ValidatedSkillInput,
} from "../../../../../src/core/index.ts";

export function makeSkill(
  overrides: Partial<Skill> & Pick<Skill, "id">,
): Skill {
  return {
    description: `Description for ${overrides.id}.`,
    category_id: "engineering",
    visibility: SkillVisibility.Public,
    status: SkillStatus.Active,
    required_skills: [],
    ...overrides,
  };
}

export function makeManifest(overrides: Partial<Plugin> = {}): Plugin {
  return {
    schema_version: PluginSchemaVersion.V1,
    name: "fixture-skills",
    description: "Fixture plugin.",
    version: "1.2.3+1",
    author: {
      name: "Fixture Owner",
      email: "owner@example.test",
      url: "https://example.test",
    },
    homepage: "https://example.test/readme",
    repository: "https://example.test/repository",
    license: "MIT",
    keywords: ["agent-skills"],
    marketplace: {
      name: "fixture",
      description: "Fixture marketplace.",
      plugin_description: "Fixture listing.",
      category: "development",
      keywords: ["agent-skills"],
    },
    categories: [
      {
        id: "engineering",
        name: "Engineering",
        description: "Engineering skills.",
      },
    ],
    skills: [makeSkill({ id: "alpha-skill" })],
    ...overrides,
  };
}

export function makePluginSource({
  manifest = makeManifest(),
  manifestSource,
  skillSources = {},
  resources = {},
  extraEntries = [],
}: {
  readonly manifest?: Plugin;
  readonly manifestSource?: string;
  readonly skillSources?: Readonly<Record<string, string>>;
  readonly resources?: Readonly<Record<string, string | Uint8Array>>;
  readonly extraEntries?: readonly SourceEntryInput[];
} = {}): PluginSource {
  const skillEntries: SourceEntryInput[] = [];
  for (const skill of manifest.skills) {
    const skillRoot = `plugin/skills/${skill.id}`;
    skillEntries.push(
      {
        kind: SourceEntryKind.Directory,
        path: createProjectPath(skillRoot),
      },
      {
        kind: SourceEntryKind.File,
        path: createProjectPath(`${skillRoot}/SKILL.md`),
        content: Buffer.from(
          skillSources[skill.id] ??
            `# ${skill.id}\n\n${REQUIRED_SKILLS_MARKER}\n`,
        ),
      },
    );
  }
  for (const [relativePath, content] of Object.entries(resources)) {
    skillEntries.push({
      kind: SourceEntryKind.File,
      path: createProjectPath(`plugin/skills/${relativePath}`),
      content: Buffer.from(content),
    });
  }
  skillEntries.push(...extraEntries);

  return createPluginSource({
    manifest: {
      kind: SourceEntryKind.File,
      path: createProjectPath("plugin/plugin.yml"),
      content: Buffer.from(
        manifestSource ?? `${JSON.stringify(manifest, null, 2)}\n`,
      ),
    },
    skillEntries,
  });
}

function validatedSkill(
  overrides: Partial<ValidatedSkillInput> & Pick<ValidatedSkillInput, "id">,
): ValidatedSkillInput {
  return {
    description: `Description for ${overrides.id}.`,
    category_id: "engineering",
    visibility: SkillVisibility.Internal,
    status: SkillStatus.Active,
    required_skills: [],
    source_path: createProjectPath(`plugin/skills/${overrides.id}`),
    source_body: `# ${overrides.id}\n\n${REQUIRED_SKILLS_MARKER}\n`,
    resources: [],
    ...overrides,
  };
}

export function makeValidatedPlugin(): ValidatedPlugin {
  return createValidatedPlugin({
    ...makeManifest(),
    categories: [
      {
        id: "engineering",
        name: "Engineering",
        description: "Engineering skills.",
      },
    ],
    skills: [
      validatedSkill({
        id: "base-skill",
        resources: [
          {
            path: createProjectPath("references/rules.md"),
            content: Buffer.from("# Rules\n"),
          },
        ],
      }),
      validatedSkill({
        id: "public-skill",
        visibility: SkillVisibility.Public,
        required_skills: [
          {
            skill_id: "base-skill",
            reason: "Provides base rules.",
            instructions: "Read the base skill first.",
          },
        ],
      }),
      validatedSkill({
        id: "old-skill",
        visibility: SkillVisibility.Public,
        status: SkillStatus.Deprecated,
        deprecation: {
          reason: "A replacement exists.",
          instructions: "Use public-skill.",
          replacement_skill_id: "public-skill",
        },
      }),
      validatedSkill({
        id: "draft-skill",
        visibility: SkillVisibility.Public,
        status: SkillStatus.Draft,
      }),
    ],
  });
}
