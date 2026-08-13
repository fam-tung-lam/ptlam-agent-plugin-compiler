import assert from "node:assert/strict";

import { describe, it } from "vitest";
import {
  PluginValidationError,
  validateAuthoredPlugin,
} from "../../../../../src/compiler/validation/index.ts";
import {
  createHookId,
  createProjectPath,
  HookLifecycle,
  PluginSchemaVersion,
  REQUIRED_SKILLS_MARKER,
  SkillStatus,
  SkillVisibility,
  SourceEntryKind,
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

  it("loads separate hook handlers and keeps policy files as internal resources", () => {
    // GIVEN: One logical hook binds two .mjs handlers and ships a private policy file.
    const manifest = makeManifest({
      hooks: [
        {
          id: createHookId("adaptive-interaction"),
          bindings: [
            {
              lifecycle: HookLifecycle.BeforeRequest,
              handler: createProjectPath("request.mjs"),
            },
            {
              lifecycle: HookLifecycle.BeforeResponse,
              handler: createProjectPath("response.mjs"),
            },
          ],
        },
      ],
    });
    const source = makePluginSource({
      manifest,
      hookResources: {
        "adaptive-interaction": {
          "request.mjs": "export async function handle() {}\n",
          "response.mjs": "export async function handle() {}\n",
          "policies/style.json": '{"concise":true}\n',
        },
      },
    });

    // WHEN: Authored plugin validation attaches source resources.
    const result = validateAuthoredPlugin(source);

    // THEN: The public hook has two bindings while all three files stay resources.
    assert.equal(result.plugin.hooks.length, 1);
    assert.deepEqual(
      result.plugin.hooks[0]?.bindings.map(({ lifecycle }) => lifecycle),
      [HookLifecycle.BeforeRequest, HookLifecycle.BeforeResponse],
    );
    assert.deepEqual(
      result.plugin.hooks[0]?.resources.map(({ path }) => path),
      ["policies/style.json", "request.mjs", "response.mjs"],
    );
    assert.equal(Object.isFrozen(result.plugin.hooks), true);
  });

  it("aggregates duplicate lifecycles and missing handler resources", () => {
    // GIVEN: A logical hook repeats a lifecycle and references absent handlers.
    const manifest = makeManifest({
      hooks: [
        {
          id: createHookId("adaptive-interaction"),
          bindings: [
            {
              lifecycle: HookLifecycle.BeforeRequest,
              handler: createProjectPath("request.mjs"),
            },
            {
              lifecycle: HookLifecycle.BeforeRequest,
              handler: createProjectPath("other.mjs"),
            },
          ],
        },
      ],
    });
    const source = makePluginSource({ manifest });

    // WHEN: Validation evaluates hook identity, lifecycle, and source mapping.
    const validation = () => validateAuthoredPlugin(source);

    // THEN: Both semantic and missing-resource failures remain visible together.
    assert.throws(validation, (error: unknown) => {
      assert.ok(error instanceof PluginValidationError);
      assert.match(error.message, /duplicate lifecycle/u);
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
