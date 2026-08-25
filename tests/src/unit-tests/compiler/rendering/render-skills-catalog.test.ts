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
  const manifest = makeManifest({
    categories: [
      {
        id: "engineering",
        name: "Engineering",
        description: "Engineering skills.",
      },
      {
        id: "foundations",
        name: "Foundations",
        description: "Foundational skills.",
      },
    ],
  });
  return createPlugin({
    ...manifest,
    categories: manifest.categories,
    hooks: [],
    hook_resources: [],
    skills: [
      withSource(
        makeSkill({
          id: "shared-skill",
          category_id: "foundations",
          visibility: SkillVisibility.Internal,
        }),
      ),
      withSource(
        makeSkill({
          id: "middle-skill",
          category_id: "foundations",
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
  it("renders the categorized dependency graph before the skills table", () => {
    // GIVEN: Published roots have direct, transitive, shared, isolated, and deprecated graph shapes.
    const plugin = makeGraphPlugin();
    const publishedSkills = selectPublishedSkills(plugin.skills);

    // WHEN: The validated model is rendered as a skills catalog.
    const catalog = renderSkillsCatalog(plugin, publishedSkills);
    const graphStart = catalog.indexOf(
      "Arrows point from a dependent skill to the skill it requires.",
    );
    const tableStart = catalog.indexOf("| Skill");
    const graph = catalog.slice(graphStart, tableStart);

    // THEN: One heading introduces the graph, followed directly by the table.
    assert.equal(catalog.startsWith("## Available Skills\n\n"), true);
    assert.doesNotMatch(catalog, /## Skill dependency graph/u);
    assert.equal(
      graph,
      `Arrows point from a dependent skill to the skill it requires.

\`\`\`mermaid
---
config:
  htmlLabels: false
---
flowchart TB
    subgraph SkillCategory0["Engineering"]
        SkillNode2["\`
            public-skill
            (active/public)
        \`"]
        SkillNode3["\`
            old-skill
            (deprecated/public)
        \`"]
        SkillNode4["\`
            isolated-skill
            (active/public)
        \`"]
    end
    subgraph SkillCategory1["Foundations"]
        SkillNode0["\`
            shared-skill
            (active/internal)
        \`"]
        SkillNode1["\`
            middle-skill
            (active/internal)
        \`"]
    end
    SkillNode1 --> SkillNode0
    SkillNode2 --> SkillNode1
    SkillNode2 --> SkillNode0
    SkillNode3 --> SkillNode0
    classDef publicSkill fill:#dbeafe,stroke:#1d4ed8,color:#172554
    classDef internalSkill fill:#f3f4f6,stroke:#4b5563,color:#111827,stroke-dasharray:5 5
    classDef deprecatedSkill fill:#fef3c7,stroke:#b45309,color:#78350f
    class SkillNode0 internalSkill
    class SkillNode1 internalSkill
    class SkillNode2 publicSkill
    class SkillNode3 publicSkill
    class SkillNode3 deprecatedSkill
    class SkillNode4 publicSkill
\`\`\`

`,
    );
    assert.ok(graphStart < tableStart);
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
    assert.match(catalog, /^## Available Skills/u);
    assert.match(catalog, /\| Skill\s+\| Category\s+\| Description/u);
    assert.match(
      catalog,
      /^## Available Skills\n\nNo skills are currently published\.\n\n\| Skill/u,
    );
    assert.doesNotMatch(catalog, /## Skill dependency graph/u);
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
      /SkillNode0\["`\s+unsafe&quot;&amp;&lt;&gt;\s+\(active\/public\)\s+`"\]/u,
    );
    assert.doesNotMatch(catalog, /unsafe"&<> \[public root\]/u);
  });
});
