import {
  createCategoryId,
  createPlugin,
  createPluginSource,
  createProjectPath,
  createProviderId,
  createSkillId,
  type Plugin,
  type PluginCategory,
  type PluginManifest,
  PluginSchemaVersion,
  type PluginSource,
  REQUIRED_SKILLS_MARKER,
  type SkillArchive,
  type SkillDeprecation,
  type SkillInput,
  type SkillManifest,
  type SkillRequirement,
  SkillStatus,
  SkillVisibility,
  type SourceEntryInput,
  SourceEntryKind,
} from "../../../../../src/core/index.ts";

type SkillRequirementFixture = Omit<SkillRequirement, "skill_id"> & {
  readonly skill_id: string;
};

type SkillDeprecationFixture = Omit<
  SkillDeprecation,
  "replacement_skill_id"
> & {
  readonly replacement_skill_id?: string;
};

type SkillArchiveFixture = Omit<SkillArchive, "replacement_skill_id"> & {
  readonly replacement_skill_id?: string;
};

interface SkillManifestFixture {
  readonly id: string;
  readonly description?: string;
  readonly disable_model_invocation?: boolean;
  readonly category_id?: string;
  readonly visibility?: SkillVisibility;
  readonly status?: SkillStatus;
  readonly required_skills?: readonly SkillRequirementFixture[];
  readonly deprecation?: SkillDeprecationFixture;
  readonly archive?: SkillArchiveFixture;
}

type PluginManifestFixture = Omit<
  Partial<PluginManifest>,
  "categories" | "skills"
> & {
  readonly categories?: readonly (Omit<PluginCategory, "id"> & {
    readonly id: string;
  })[];
  readonly skills?: readonly SkillManifest[];
};

function makeSkillRequirement(
  requirement: SkillRequirementFixture,
): SkillRequirement {
  return { ...requirement, skill_id: createSkillId(requirement.skill_id) };
}

function makeDeprecation(
  deprecation: SkillDeprecationFixture,
): SkillDeprecation {
  return {
    reason: deprecation.reason,
    instructions: deprecation.instructions,
    ...(deprecation.replacement_skill_id === undefined
      ? {}
      : {
          replacement_skill_id: createSkillId(deprecation.replacement_skill_id),
        }),
  };
}

function makeArchive(archive: SkillArchiveFixture): SkillArchive {
  return {
    reason: archive.reason,
    ...(archive.replacement_skill_id === undefined
      ? {}
      : {
          replacement_skill_id: createSkillId(archive.replacement_skill_id),
        }),
  };
}

export function makeSkill(overrides: SkillManifestFixture): SkillManifest {
  return {
    id: createSkillId(overrides.id),
    description: overrides.description ?? `Description for ${overrides.id}.`,
    disable_model_invocation: overrides.disable_model_invocation ?? false,
    category_id: createCategoryId(overrides.category_id ?? "engineering"),
    visibility: overrides.visibility ?? SkillVisibility.Public,
    status: overrides.status ?? SkillStatus.Active,
    required_skills: (overrides.required_skills ?? []).map(
      makeSkillRequirement,
    ),
    ...(overrides.deprecation === undefined
      ? {}
      : { deprecation: makeDeprecation(overrides.deprecation) }),
    ...(overrides.archive === undefined
      ? {}
      : { archive: makeArchive(overrides.archive) }),
  };
}

export function makeManifest(
  overrides: PluginManifestFixture = {},
): PluginManifest {
  const { categories, hooks, skills, ...values } = overrides;
  return {
    schema_version: PluginSchemaVersion.V2,
    providers: [createProviderId("claude"), createProviderId("codex")],
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
    ...values,
    hooks: hooks ?? [],
    categories: (
      categories ?? [
        {
          id: "engineering",
          name: "Engineering",
          description: "Engineering skills.",
        },
      ]
    ).map((category) => ({
      ...category,
      id: createCategoryId(category.id),
    })),
    skills: skills ?? [makeSkill({ id: "alpha-skill" })],
  };
}

export function makePluginSource({
  manifest = makeManifest(),
  manifestSource,
  skillSources = {},
  resources = {},
  hookResources = {},
  hookExtraEntries = [],
  extraEntries = [],
}: {
  readonly manifest?: PluginManifest;
  readonly manifestSource?: string;
  readonly skillSources?: Readonly<Record<string, string>>;
  readonly resources?: Readonly<Record<string, string | Uint8Array>>;
  readonly hookResources?: Readonly<
    Record<string, Readonly<Record<string, string | Uint8Array>>>
  >;
  readonly hookExtraEntries?: readonly SourceEntryInput[];
  readonly extraEntries?: readonly SourceEntryInput[];
} = {}): PluginSource {
  const hookEntries: SourceEntryInput[] = [];
  const skillEntries: SourceEntryInput[] = [];
  for (const hook of manifest.hooks) {
    const hookRoot = `plugin/hooks/${hook.id}`;
    hookEntries.push({
      kind: SourceEntryKind.Directory,
      path: createProjectPath(hookRoot),
    });
    const directories = new Set<string>();
    for (const [relativePath, content] of Object.entries(
      hookResources[hook.id] ?? {},
    )) {
      const segments = relativePath.split("/");
      for (let index = 1; index < segments.length; index += 1) {
        directories.add(segments.slice(0, index).join("/"));
      }
      hookEntries.push({
        kind: SourceEntryKind.File,
        path: createProjectPath(`${hookRoot}/${relativePath}`),
        content: Buffer.from(content),
      });
    }
    for (const directory of directories) {
      hookEntries.push({
        kind: SourceEntryKind.Directory,
        path: createProjectPath(`${hookRoot}/${directory}`),
      });
    }
  }
  hookEntries.push(...hookExtraEntries);
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
    hookEntries,
    skillEntries,
  });
}

type SkillInputFixture = SkillManifestFixture & {
  readonly source_path?: string;
  readonly source_body?: string;
  readonly resources?: SkillInput["resources"];
};

function makeSkillInput(overrides: SkillInputFixture): SkillInput {
  return {
    ...makeSkill({
      ...overrides,
      visibility: overrides.visibility ?? SkillVisibility.Internal,
    }),
    source_path: createProjectPath(
      overrides.source_path ?? `plugin/skills/${overrides.id}`,
    ),
    source_body:
      overrides.source_body ??
      `# ${overrides.id}\n\n${REQUIRED_SKILLS_MARKER}\n`,
    resources: overrides.resources ?? [],
  };
}

export function makePlugin(): Plugin {
  return createPlugin({
    ...makeManifest(),
    hooks: [],
    categories: [
      {
        id: createCategoryId("engineering"),
        name: "Engineering",
        description: "Engineering skills.",
      },
    ],
    skills: [
      makeSkillInput({
        id: "base-skill",
        resources: [
          {
            path: createProjectPath("references/rules.md"),
            content: Buffer.from("# Rules\n"),
          },
        ],
      }),
      makeSkillInput({
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
      makeSkillInput({
        id: "old-skill",
        visibility: SkillVisibility.Public,
        status: SkillStatus.Deprecated,
        deprecation: {
          reason: "A replacement exists.",
          instructions: "Use public-skill.",
          replacement_skill_id: "public-skill",
        },
      }),
      makeSkillInput({
        id: "draft-skill",
        visibility: SkillVisibility.Public,
        status: SkillStatus.Draft,
      }),
    ],
  });
}
