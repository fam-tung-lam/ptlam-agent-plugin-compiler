import assert from "node:assert/strict";

import { describe, it } from "vitest";
import { renderSkillsCatalog } from "../../../../../src/compiler/rendering/index.ts";
import {
  createPlugin,
  createProjectPath,
  createSkillId,
  type SkillId,
  type SkillInput,
  type SkillManifest,
  SkillStatus,
  SkillVisibility,
  selectPublishedSkills,
} from "../../../../../src/core/index.ts";
import { makeManifest, makeSkill } from "../test-fixtures/plugin-fixture.ts";

function withSource(skill: SkillManifest): SkillInput {
  return {
    ...skill,
    source_path: createProjectPath(`plugin/skills/${skill.id}`),
    source_body: `# ${skill.id}\n`,
    resources: [],
  };
}

function requirement(skillId: string) {
  return {
    skill_id: createSkillId(skillId),
    reason: `Use ${skillId}.`,
    instructions: `Read ${skillId} first.`,
  };
}

function makeGraphPlugin() {
  const manifest = makeManifest();
  return createPlugin({
    ...manifest,
    categories: manifest.categories,
    hooks: [],
    hook_resources: [],
    skills: [
      withSource(
        makeSkill({
          id: "shared-skill",
          visibility: SkillVisibility.Internal,
        }),
      ),
      withSource(
        makeSkill({
          id: "middle-skill",
          visibility: SkillVisibility.Internal,
          required_skills: [requirement("shared-skill")],
        }),
      ),
      withSource(
        makeSkill({
          id: "public-skill",
          required_skills: [
            requirement("middle-skill"),
            requirement("shared-skill"),
          ],
        }),
      ),
      withSource(
        makeSkill({
          id: "old-skill",
          status: SkillStatus.Deprecated,
          required_skills: [requirement("shared-skill")],
          deprecation: {
            reason: "A replacement exists.",
            instructions: "Use public-skill.",
            replacement_skill_id: "public-skill",
          },
        }),
      ),
      withSource(makeSkill({ id: "isolated-skill" })),
      withSource(makeSkill({ id: "draft-skill", status: SkillStatus.Draft })),
      withSource(
        makeSkill({
          id: "archived-skill",
          visibility: SkillVisibility.Internal,
          status: SkillStatus.Archived,
          archive: { reason: "No longer supported." },
        }),
      ),
      withSource(
        makeSkill({
          id: "unreachable-skill",
          visibility: SkillVisibility.Internal,
        }),
      ),
    ],
  });
}

describe("renderSkillsCatalog", () => {
  it("renders the complete published dependency graph in manifest order", () => {
    // GIVEN: Published roots have direct, transitive, shared, isolated, and deprecated graph shapes.
    const plugin = makeGraphPlugin();
    const publishedSkills = selectPublishedSkills(plugin.skills);

    // WHEN: The validated model is rendered as a skills catalog.
    const catalog = renderSkillsCatalog(plugin, publishedSkills);
    const graph = catalog.slice(catalog.indexOf("## Skill dependency graph"));

    // THEN: Every publishable reachable node and unique edge appears in deterministic order.
    assert.equal(
      graph,
      `## Skill dependency graph

Arrows point from a dependent skill to the skill it requires.

\`\`\`mermaid
flowchart LR
  skill_0["shared-skill [internal dependency]"]
  skill_1["middle-skill [internal dependency]"]
  skill_2["public-skill [public root]"]
  skill_3["old-skill [public root, deprecated]"]
  skill_4["isolated-skill [public root]"]
  skill_1 --> skill_0
  skill_2 --> skill_1
  skill_2 --> skill_0
  skill_3 --> skill_0
  classDef publicRoot fill:#dbeafe,stroke:#1d4ed8,color:#172554
  classDef internalDependency fill:#f3f4f6,stroke:#4b5563,color:#111827,stroke-dasharray:5 5
  classDef deprecated fill:#fef3c7,stroke:#b45309,color:#78350f
  class skill_0 internalDependency
  class skill_1 internalDependency
  class skill_2 publicRoot
  class skill_3 publicRoot
  class skill_3 deprecated
  class skill_4 publicRoot
\`\`\`
`,
    );
    assert.doesNotMatch(
      catalog,
      /draft-skill|archived-skill|unreachable-skill/u,
    );
  });

  it("renders a readable graph empty state while retaining the catalog table", () => {
    // GIVEN: A validated plugin has no publishable root skills.
    const plugin = makeGraphPlugin();

    // WHEN: The empty published selection is rendered.
    const catalog = renderSkillsCatalog(plugin, []);

    // THEN: The existing table remains and the graph does not emit an empty Mermaid block.
    assert.match(catalog, /## Available skills/u);
    assert.match(catalog, /\| Skill\s+\| Category\s+\| Description/u);
    assert.match(
      catalog,
      /## Skill dependency graph\n\nNo skills are currently published\.\n$/u,
    );
    assert.doesNotMatch(catalog, /```mermaid/u);
  });

  it("escapes displayed skill identifiers without using them as node identifiers", () => {
    // GIVEN: A defensive validated-looking model contains Mermaid-significant display characters.
    const sourcePlugin = makeGraphPlugin();
    const isolatedSkill = sourcePlugin.skills[4];
    assert.ok(isolatedSkill);
    const plugin = createPlugin({
      ...sourcePlugin,
      categories: sourcePlugin.categories,
      hooks: [],
      hook_resources: [],
      skills: [
        {
          ...isolatedSkill,
          id: 'unsafe"&<>' as SkillId,
          required_skills: [],
        },
      ],
    });

    // WHEN: The catalog graph renders the model.
    const catalog = renderSkillsCatalog(
      plugin,
      selectPublishedSkills(plugin.skills),
    );

    // THEN: A stable generated node ID carries an entity-escaped display label.
    assert.match(
      catalog,
      /skill_0\["unsafe&quot;&amp;&lt;&gt; \[public root\]"\]/u,
    );
    assert.doesNotMatch(catalog, /unsafe"&<> \[public root\]/u);
  });
});
