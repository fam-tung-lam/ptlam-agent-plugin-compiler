import assert from "node:assert/strict";

import { describe, it } from "vitest";
import {
  PluginValidationError,
  validateAuthoredPlugin,
} from "../../../../../src/compiler/validation/index.ts";
import {
  createProjectPath,
  PluginSchemaVersion,
  REQUIRED_SKILLS_MARKER,
  SkillStatus,
  SkillVisibility,
  SourceEntryKind,
  UniversalHookEvent,
} from "../../../../../src/core/index.ts";
import {
  makeManifest,
  makePluginSource,
  makeSkill,
} from "../test-fixtures/plugin-fixture.ts";

describe("validateAuthoredPlugin", () => {
  it("ignores hook-tree entries for a schema-v1 plugin", () => {
    // GIVEN: A legacy plugin has an unrelated directory under plugin/hooks/.
    const manifest = makeManifest();
    const { hooks: _hooks, ...withoutHooks } = manifest;
    const legacySkills = manifest.skills.map(
      ({ disable_model_invocation: _disableModelInvocation, ...skill }) =>
        skill,
    );
    const source = makePluginSource({
      manifest,
      manifestSource: `${JSON.stringify(
        {
          ...withoutHooks,
          schema_version: PluginSchemaVersion.V1,
          skills: legacySkills,
        },
        null,
        2,
      )}\n`,
      hookExtraEntries: [
        {
          kind: SourceEntryKind.Directory,
          path: createProjectPath("plugin/hooks/unrelated-tooling"),
        },
        {
          kind: SourceEntryKind.File,
          path: createProjectPath("plugin/hooks/unrelated-tooling/config.json"),
          content: Buffer.from("{}\n"),
        },
      ],
    });

    // WHEN: The frozen v1 contract validates the authored repository.
    const result = validateAuthoredPlugin(source);

    // THEN: The pre-existing hook tree remains outside v1 validation and output.
    assert.equal(result.plugin.schema_version, PluginSchemaVersion.V1);
    assert.deepEqual(result.plugin.hooks, []);
  });

  it("loads event-keyed handlers and keeps policy files as internal resources", () => {
    // GIVEN: Two universal events name handlers under the shared hook source root.
    const manifest = makeManifest({
      hooks: {
        [UniversalHookEvent.UserPromptSubmit]: [
          { handler: createProjectPath("adaptive-interaction/request.mjs") },
        ],
        [UniversalHookEvent.Stop]: [
          { handler: createProjectPath("adaptive-interaction/response.mjs") },
        ],
      },
    });
    const source = makePluginSource({
      manifest,
      hookResources: {
        "adaptive-interaction/request.mjs":
          "export async function handle() {}\n",
        "adaptive-interaction/response.mjs":
          "export async function handle() {}\n",
        "adaptive-interaction/policies/style.json": '{"concise":true}\n',
      },
    });

    // WHEN: Authored plugin validation attaches source resources.
    const result = validateAuthoredPlugin(source);

    // THEN: Both registrations and all three source files remain immutable.
    assert.equal(result.plugin.hooks.length, 2);
    assert.deepEqual(
      result.plugin.hooks.map(({ event }) => event),
      [UniversalHookEvent.UserPromptSubmit, UniversalHookEvent.Stop],
    );
    assert.deepEqual(
      result.plugin.hook_resources.map(({ path }) => path),
      [
        "adaptive-interaction/policies/style.json",
        "adaptive-interaction/request.mjs",
        "adaptive-interaction/response.mjs",
      ],
    );
    assert.equal(Object.isFrozen(result.plugin.hooks), true);
  });

  it("rejects authored files in the compiler-owned hook runtime namespace", () => {
    // GIVEN: A valid handler is accompanied by a file at the generated runtime path.
    const manifest = makeManifest({
      hooks: {
        [UniversalHookEvent.UserPromptSubmit]: [
          { handler: createProjectPath("request.mjs") },
        ],
      },
    });
    const source = makePluginSource({
      manifest,
      hookResources: {
        "request.mjs": "export async function handle() {}\n",
        ".runtime/portable-hook-dispatcher.mjs":
          "export async function dispatch() {}\n",
      },
    });

    // WHEN: Source validation evaluates the compiler-owned runtime namespace.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: The collision fails at the authored-source validation boundary.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      assert.match(
        error.message,
        /plugin\/hooks\/\.runtime\/: reserved for compiler-managed hook runtime files/u,
      );
      return true;
    });
  });

  it("aggregates missing event-keyed handler resources", () => {
    // GIVEN: One event registers two handler paths that are absent from disk.
    const manifest = makeManifest({
      hooks: {
        [UniversalHookEvent.UserPromptSubmit]: [
          { handler: createProjectPath("adaptive-interaction/request.mjs") },
          { handler: createProjectPath("adaptive-interaction/other.mjs") },
        ],
      },
    });
    const source = makePluginSource({ manifest });

    // WHEN: Validation evaluates the event-keyed source mapping.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: Both missing-resource failures remain visible together.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      assert.match(error.message, /expected .*request\.mjs/u);
      assert.match(error.message, /expected .*other\.mjs/u);
      return true;
    });
  });
  it("returns ordered immutable source data with defensive resource bytes", () => {
    // GIVEN: Valid in-memory source facts contain a dependency and binary resource.
    const manifest = makeManifest({
      skills: [
        makeSkill({
          id: "alpha-skill",
          required_skills: [
            {
              skill_id: "beta-skill",
              reason: "Provides beta rules.",
              instructions: "Read beta first.",
            },
          ],
        }),
        makeSkill({
          id: "beta-skill",
          visibility: SkillVisibility.Internal,
        }),
      ],
    });
    const source = makePluginSource({
      manifest,
      skillSources: {
        "alpha-skill": `# Alpha\n\n${REQUIRED_SKILLS_MARKER}\n\nRead [rules](references/rules.md).\n`,
      },
      resources: {
        "alpha-skill/references/rules.md": Buffer.from([0, 1, 255]),
      },
    });

    // WHEN: Pure core validation builds the canonical plugin snapshot.
    const result = validateAuthoredPlugin(source);
    const resource = result.plugin.skills[0]?.resources[0];

    // THEN: Manifest order, warnings, nested values, and resource bytes are stable.
    assert.deepEqual(
      result.plugin.skills.map((skill) => skill.id),
      ["alpha-skill", "beta-skill"],
    );
    assert.deepEqual(result.warnings, []);
    assert.ok(resource);
    assert.deepEqual(resource.content, Buffer.from([0, 1, 255]));
    resource.content.fill(0);
    assert.deepEqual(resource.content, Buffer.from([0, 1, 255]));
    for (const value of [
      result,
      result.warnings,
      result.plugin,
      result.plugin.skills,
      result.plugin.skills[0],
      resource,
    ]) {
      assert.equal(Object.isFrozen(value), true);
    }
  });

  it("rejects unsupported manifest interpolation", () => {
    // GIVEN: Manifest text contains a non-portable interpolation placeholder.
    const source = makePluginSource({
      manifestSource: `${JSON.stringify(makeManifest(), null, 2).replace(
        '"description": "Fixture plugin."',
        `"description": "$${"{PLUGIN_DESCRIPTION}"}"`,
      )}\n`,
    });

    // WHEN: The invalid manifest is validated.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: The portability failure remains explicit.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      assert.ok(error.message.includes("interpolation is not supported"));
      return true;
    });
  });

  it("accepts an omitted required-skills placement marker", () => {
    // GIVEN: A skill declares a dependency but leaves placement to the compiler.
    const manifest = makeManifest({
      skills: [
        makeSkill({
          id: "alpha-skill",
          required_skills: [
            {
              skill_id: "beta-skill",
              reason: "Provides beta rules.",
              instructions: "Read beta first.",
            },
          ],
        }),
        makeSkill({
          id: "beta-skill",
          visibility: SkillVisibility.Internal,
        }),
      ],
    });
    const source = makePluginSource({
      manifest,
      skillSources: {
        "alpha-skill": "# Alpha\n\nFollow the alpha workflow.\n",
        "beta-skill": "# Beta\n",
      },
    });

    // WHEN: The authored plugin is validated.
    const result = validateAuthoredPlugin(source);

    // THEN: Marker placement remains optional for every skill.
    assert.equal(result.plugin.skills[0]?.required_skills.length, 1);
    assert.equal(result.plugin.skills[1]?.required_skills.length, 0);
  });

  it("rejects exact required-skill IDs across authored Markdown forms", () => {
    // GIVEN: One skill repeats its manifest dependency in prose, code, and a link.
    const manifest = makeManifest({
      skills: [
        makeSkill({
          id: "alpha-skill",
          required_skills: [
            {
              skill_id: "beta-skill",
              reason: "Provides beta rules.",
              instructions: "Read beta first.",
            },
          ],
        }),
        makeSkill({
          id: "beta-skill",
          visibility: SkillVisibility.Internal,
        }),
      ],
    });
    const source = makePluginSource({
      manifest,
      skillSources: {
        "alpha-skill": `# Alpha

Use beta-skill in prose.
Read \`beta-skill\` before continuing.
[Beta](https://example.test/beta-skill)
`,
      },
    });

    // WHEN: Authored-source validation checks dependency-contract ownership.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: Every Markdown form reports its authored line and both skill IDs.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      assert.equal(error.errors.length, 3);
      for (const line of [3, 4, 5]) {
        assert.ok(
          error.errors.some((diagnostic) =>
            diagnostic.startsWith(
              `plugin/skills/alpha-skill/SKILL.md:${line}:`,
            ),
          ),
        );
      }
      for (const diagnostic of error.errors) {
        assert.match(diagnostic, /owning skill "alpha-skill"/u);
        assert.match(diagnostic, /required skill "beta-skill"/u);
        assert.match(diagnostic, /plugin\/plugin\.yml/u);
        assert.match(diagnostic, /generated top-level required-skills block/u);
      }
      return true;
    });
  });

  it("rejects exact required-skill IDs in nested authored references", () => {
    // GIVEN: A nested Markdown reference repeats its owning skill's dependency.
    const manifest = makeManifest({
      skills: [
        makeSkill({
          id: "alpha-skill",
          required_skills: [
            {
              skill_id: "beta-skill",
              reason: "Provides beta rules.",
              instructions: "Read beta first.",
            },
          ],
        }),
        makeSkill({
          id: "beta-skill",
          visibility: SkillVisibility.Internal,
        }),
      ],
    });
    const source = makePluginSource({
      manifest,
      resources: {
        "alpha-skill/references/guides/nested.md":
          "# Nested guide\n\nApply beta-skill here.\n",
      },
    });

    // WHEN: Authored-source validation traverses nested references.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: The nested authored path and exact line identify the violation.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      assert.equal(error.errors.length, 1);
      assert.match(
        error.errors[0] ?? "",
        /^plugin\/skills\/alpha-skill\/references\/guides\/nested\.md:3:\d+: owning skill "alpha-skill" repeats required skill "beta-skill"/u,
      );
      return true;
    });
  });

  it("accepts token-prefix self-references and non-owned dependency prose", () => {
    // GIVEN: A specialization names itself, unrelated skills, and domain vocabulary.
    const manifest = makeManifest({
      skills: [
        makeSkill({
          id: "ptlam-code-style-flutter",
          required_skills: [
            {
              skill_id: "ptlam-code-style",
              reason: "Provides shared style rules.",
              instructions: "Apply the generated contract.",
            },
          ],
        }),
        makeSkill({
          id: "ptlam-code-style",
          visibility: SkillVisibility.Internal,
        }),
        makeSkill({ id: "unrelated-skill" }),
      ],
    });
    const source = makePluginSource({
      manifest,
      skillSources: {
        "ptlam-code-style-flutter":
          "# Flutter style\n\nptlam-code-style-flutter uses foundation and dependency vocabulary and may cross-reference unrelated-skill.\n",
        "unrelated-skill":
          "# Unrelated\n\nptlam-code-style is not this skill's declared dependency.\n",
      },
      resources: {
        "ptlam-code-style-flutter/references/nested/rules.md":
          "The ptlam-code-style-flutter specialization owns these runtime dependency notes.\n",
      },
    });

    // WHEN: Manifest-aware token-boundary validation inspects every package.
    const result = validateAuthoredPlugin(source);

    // THEN: Prefix self-references and text not owned by required_skills remain valid.
    assert.equal(result.plugin.skills.length, 3);
  });

  it("aggregates graph, source mapping, reserved path, and link failures", () => {
    // GIVEN: Logical facts contain independent graph and authored-source violations.
    const manifest = makeManifest({
      skills: [
        makeSkill({
          id: "alpha-skill",
          category_id: "missing-category",
          required_skills: [
            {
              skill_id: "alpha-skill",
              reason: "Invalid self dependency.",
              instructions: "Do not do this.",
            },
          ],
        }),
      ],
    });
    const source = makePluginSource({
      manifest,
      skillSources: {
        "alpha-skill": "# Alpha\n\n[missing](references/missing.md)\n",
      },
      extraEntries: [
        {
          kind: SourceEntryKind.Directory,
          path: createProjectPath("plugin/skills/orphan-skill"),
        },
        {
          kind: SourceEntryKind.File,
          path: createProjectPath("plugin/skills/alpha-skill/skills/owned.md"),
          content: Buffer.from("owned"),
        },
      ],
    });

    // WHEN: Pure validation evaluates the complete logical source set.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: All material semantic failures remain observable in one error.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      for (const expected of [
        'unknown category "missing-category"',
        'skill "alpha-skill" cannot require itself',
        "source skill is not listed",
        "skills/ is owned by the plugin compiler",
        "local link target does not exist",
      ]) {
        assert.ok(error.message.includes(expected), expected);
      }
      return true;
    });
  });

  it("returns deprecated dependency and unreachable internal skill warnings", () => {
    // GIVEN: A public root requires a deprecated skill while another internal skill is unused.
    const manifest = makeManifest({
      skills: [
        makeSkill({
          id: "public-skill",
          required_skills: [
            {
              skill_id: "legacy-core",
              reason: "Legacy foundation.",
              instructions: "Migrate later.",
            },
          ],
        }),
        makeSkill({
          id: "legacy-core",
          visibility: SkillVisibility.Internal,
          status: SkillStatus.Deprecated,
          deprecation: {
            reason: "Legacy.",
            instructions: "Migrate later.",
          },
        }),
        makeSkill({
          id: "unused-core",
          visibility: SkillVisibility.Internal,
        }),
      ],
    });
    const source = makePluginSource({ manifest });

    // WHEN: The valid graph is inspected for non-failing concerns.
    const result = validateAuthoredPlugin(source);

    // THEN: Both warnings are immutable and do not prevent a validated plugin.
    assert.equal(result.warnings.length, 2);
    assert.ok(
      result.warnings.some((warning) => warning.includes("deprecated")),
    );
    assert.ok(
      result.warnings.some((warning) => warning.includes("unreachable")),
    );
    assert.equal(Object.isFrozen(result.warnings), true);
  });

  it("rejects unsafe YAML and invalid public metadata before source compilation", () => {
    // GIVEN: Independent manifests exercise the strict YAML and public metadata boundaries.
    const cases = [
      {
        source: `schema_version: &version 1\nname: *version\n`,
        expected: "YAML anchors are not supported",
      },
      {
        source: `${JSON.stringify(
          makeManifest({
            homepage: "http://example.test/readme",
            repository: "not a URL",
            author: {
              name: "Fixture Owner",
              email: "invalid-email",
              url: "file:///private/repository",
            },
          }),
          null,
          2,
        )}\n`,
        expected: "must be a valid HTTPS URL",
      },
      {
        source: `${JSON.stringify(makeManifest(), null, 2).replace(
          '"version": "1.2.3+1"',
          '"version": 1.2',
        )}\n`,
        expected: "version must be quoted",
      },
    ] as const;

    // WHEN/THEN: Each invalid boundary fails through the public validator.
    for (const testCase of cases) {
      assert.throws(
        () =>
          validateAuthoredPlugin(
            makePluginSource({ manifestSource: testCase.source }),
          ),
        (error: unknown) => {
          assert.ok(error instanceof PluginValidationError);
          assert.ok(error.message.includes(testCase.expected), error.message);
          return true;
        },
      );
    }
  });

  it("aggregates dependency lifecycle, replacement, duplicate, and cycle failures", () => {
    // GIVEN: Schema-valid declarations violate independent graph invariants.
    const requirement = (skill_id: string) => ({
      skill_id,
      reason: `Needs ${skill_id}.`,
      instructions: `Read ${skill_id}.`,
    });
    const manifest = makeManifest({
      categories: [
        {
          id: "engineering",
          name: "Engineering",
          description: "Engineering skills.",
        },
        {
          id: "engineering",
          name: "Duplicate engineering",
          description: "Duplicate category.",
        },
      ],
      skills: [
        makeSkill({
          id: "active-skill",
          required_skills: [
            requirement("missing-skill"),
            requirement("archived-skill"),
            requirement("archived-skill"),
            requirement("draft-skill"),
            requirement("cycle-skill"),
          ],
        }),
        makeSkill({
          id: "cycle-skill",
          required_skills: [requirement("active-skill")],
        }),
        makeSkill({ id: "draft-skill", status: SkillStatus.Draft }),
        makeSkill({
          id: "archived-skill",
          status: SkillStatus.Archived,
          archive: {
            reason: "No longer supported.",
            replacement_skill_id: "draft-skill",
          },
        }),
        makeSkill({
          id: "deprecated-unknown",
          status: SkillStatus.Deprecated,
          deprecation: {
            reason: "Old.",
            instructions: "Use another skill.",
            replacement_skill_id: "missing-skill",
          },
        }),
        makeSkill({
          id: "deprecated-self",
          status: SkillStatus.Deprecated,
          deprecation: {
            reason: "Old.",
            instructions: "Use another skill.",
            replacement_skill_id: "deprecated-self",
          },
        }),
      ],
    });

    // WHEN: The complete graph is validated.
    const validation = () =>
      validateAuthoredPlugin(makePluginSource({ manifest }));

    // THEN: Failures retain enough context to repair every declaration together.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      for (const expected of [
        "duplicate category id",
        "references unknown skill",
        "duplicate required skill",
        "cannot require archived skill",
        "cannot require draft skill",
        "must form an acyclic graph",
        "references unknown skill",
        "cannot replace itself",
        "must be active and public",
      ]) {
        assert.ok(error.message.includes(expected), expected);
      }
      return true;
    });
  });

  it("enforces skill-relative Markdown links across link node types", () => {
    // GIVEN: One source mixes allowed destinations with unsafe and missing targets.
    const source = makePluginSource({
      skillSources: {
        "alpha-skill": `# Alpha

${REQUIRED_SKILLS_MARKER}

[fragment](#details)
[valid](references/rules.md?raw=1#details)
![image](images/example.png)
[definition][docs]
[docs]: https://example.test/docs
[http](http://example.test)
[mail](mailto:owner@example.test)
[bad HTTPS](https://)
[bad encoding](references/%ZZ.md)
[absolute](/private/file.md)
[home](~/file.md)
[escape](../outside.md)
[missing](references/missing.md)
`,
      },
      resources: {
        "alpha-skill/references/rules.md": "# Rules\n",
        "alpha-skill/images/example.png": Buffer.from([137, 80, 78, 71]),
      },
    });

    // WHEN: Markdown destinations are validated inside the logical skill tree.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: External protocol and local confinement failures are all reported.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      for (const expected of [
        "unsupported link scheme",
        "invalid HTTPS link",
        "invalid encoded link",
        "must be skill-relative",
        "local link escapes the skill",
        "local link target does not exist",
      ]) {
        assert.ok(error.message.includes(expected), expected);
      }
      return true;
    });
  });

  it("rejects duplicate, misplaced, reserved, and decorated authored entries", () => {
    // GIVEN: Authored source facts violate tree ownership and body-only rules.
    const duplicatePath = createProjectPath(
      "plugin/skills/alpha-skill/SKILL.md",
    );
    const source = makePluginSource({
      skillSources: {
        "alpha-skill": `---\nname: forbidden\n---\n${REQUIRED_SKILLS_MARKER}\n${REQUIRED_SKILLS_MARKER}\n`,
      },
      extraEntries: [
        {
          kind: SourceEntryKind.Directory,
          path: createProjectPath("plugin/skills"),
        },
        {
          kind: SourceEntryKind.File,
          path: createProjectPath("plugin/outside.md"),
          content: Buffer.from("outside"),
        },
        {
          kind: SourceEntryKind.File,
          path: createProjectPath("plugin/skills/unexpected.md"),
          content: Buffer.from("unexpected"),
        },
        {
          kind: SourceEntryKind.File,
          path: createProjectPath("plugin/skills/alpha-skill/.DS_Store"),
          content: Buffer.from("service"),
        },
        {
          kind: SourceEntryKind.File,
          path: duplicatePath,
          content: Buffer.from("duplicate"),
        },
      ],
    });

    // WHEN: The source tree is validated.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: Every ownership violation is actionable in the aggregated error.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      for (const expected of [
        "duplicate logical source entry",
        "is outside plugin/skills/",
        "only skill directories are allowed directly",
        "unsupported service file",
        "must not contain YAML frontmatter",
        "expected at most one",
      ]) {
        assert.ok(error.message.includes(expected), expected);
      }
      return true;
    });
  });
});
