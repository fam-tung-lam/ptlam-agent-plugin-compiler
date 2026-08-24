import assert from "node:assert/strict";

import type { RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { describe, it } from "vitest";
import {
  compileSharedSkills,
  SharedSkillsCompilationError,
} from "../../../../../src/compiler/rendering/index.ts";
import {
  ArtifactKind,
  createPlugin,
  createProjectPath,
  MARKDOWN_REFERENCES_MARKER,
  OwnershipKind,
  REQUIRED_SKILLS_MARKER,
  SkillStatus,
  SkillVisibility,
  selectPublishedSkills,
} from "../../../../../src/core/index.ts";
import { makePlugin } from "../test-fixtures/plugin-fixture.ts";

function markdownNodes(source: string): RootContent[] {
  const result: RootContent[] = [];
  const visit = (nodes: readonly RootContent[]): void => {
    for (const node of nodes) {
      result.push(node);
      if ("children" in node) visit(node.children);
    }
  };
  visit(fromMarkdown(source).children);
  return result;
}

describe("compileSharedSkills", () => {
  it("builds a complete cataloged tree with recursive required-skill context", async () => {
    // GIVEN: A validated catalog contains active, deprecated, draft, and internal skills.
    const plugin = makePlugin();

    // WHEN: Rendering compiles the provider-neutral shared skills tree.
    const fragment = await compileSharedSkills(plugin);
    const files = new Map(
      fragment.artifacts
        .filter((artifact) => artifact.kind === ArtifactKind.File)
        .map((artifact) => [String(artifact.path), artifact.content]),
    );
    const publicSkill = files
      .get("skills/public-skill/SKILL.md")
      ?.toString("utf8");
    const catalog = files.get("skills/README.md")?.toString("utf8");

    // THEN: One complete tree contains cataloged roots and recursive dependency bytes.
    assert.deepEqual(fragment.ownership, {
      kind: OwnershipKind.CompleteTree,
      root: "skills",
    });
    assert.match(publicSkill ?? "", /name: public-skill/u);
    assert.match(publicSkill ?? "", /\*\*Reason:\*\* Provides base rules\./u);
    assert.match(publicSkill ?? "", /skills\/base-skill\/SKILL\.md/u);
    assert.deepEqual(
      files.get("skills/public-skill/skills/base-skill/references/rules.md"),
      Buffer.from("# Rules\n"),
    );
    assert.match(catalog ?? "", /`public-skill`/u);
    assert.match(catalog ?? "", /`old-skill`/u);
    assert.match(
      catalog ?? "",
      /\| Skill\s+\| Category\s+\| Description\s+\| Visibility\s+\|/u,
    );
    assert.match(
      catalog ?? "",
      /\| `public-skill`\s+\| Engineering\s+\| Description for public-skill\.\s+\| public\s+\|/u,
    );
    assert.match(
      catalog ?? "",
      /SkillNode0\["`\s+base-skill\s+\(active\/internal\)\s+`"\]/u,
    );
    assert.doesNotMatch(catalog ?? "", /draft-skill/u);
    assert.equal(catalog?.endsWith("\n"), true);
    assert.equal(Object.isFrozen(fragment), true);
    assert.equal(Object.isFrozen(fragment.artifacts), true);
  });

  it("emits manual-only frontmatter for root and embedded skill copies", async () => {
    // GIVEN: A public skill and its internal dependency both disable model invocation.
    const plugin = makePlugin();
    const manualOnlyPlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) => ({
        ...skill,
        disable_model_invocation:
          skill.id === "public-skill" || skill.id === "base-skill",
      })),
    });

    // WHEN: Rendering compiles root skills and recursively embedded dependencies.
    const fragment = await compileSharedSkills(manualOnlyPlugin);
    const files = new Map(
      fragment.artifacts
        .filter((artifact) => artifact.kind === ArtifactKind.File)
        .map((artifact) => [String(artifact.path), artifact.content]),
    );
    const publicSkill = files
      .get("skills/public-skill/SKILL.md")
      ?.toString("utf8");
    const embeddedSkill = files
      .get("skills/public-skill/skills/base-skill/SKILL.md")
      ?.toString("utf8");
    const ordinarySkill = files
      .get("skills/old-skill/SKILL.md")
      ?.toString("utf8");

    // THEN: Every enabled copy carries the host field while ordinary bytes omit it.
    assert.match(publicSkill ?? "", /disable-model-invocation: true\n---/u);
    assert.match(embeddedSkill ?? "", /disable-model-invocation: true\n---/u);
    assert.doesNotMatch(ordinarySkill ?? "", /disable-model-invocation/u);
  });

  it("selects public active and deprecated roots in manifest order", () => {
    // GIVEN: A validated plugin has every material lifecycle and visibility case.
    const plugin = makePlugin();

    // WHEN: Published root skills are selected through the core interface.
    const selected = selectPublishedSkills(plugin.skills);

    // THEN: Only active and deprecated public skills remain in manifest order.
    assert.deepEqual(
      selected.map((skill) => skill.id),
      ["public-skill", "old-skill"],
    );
    assert.equal(Object.isFrozen(selected), true);
  });

  it("always emits an empty shared tree catalog when no roots are publishable", async () => {
    // GIVEN: Every validated skill is internal.
    const plugin = makePlugin();
    const internalPlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) => ({
        ...skill,
        visibility: SkillVisibility.Internal,
      })),
    });

    // WHEN: The shared tree is compiled.
    const fragment = await compileSharedSkills(internalPlugin);

    // THEN: The root directory and generated catalog still exist without skill roots.
    assert.deepEqual(
      fragment.artifacts.map((artifact) => String(artifact.path)),
      ["skills", "skills/README.md"],
    );
    const catalog = fragment.artifacts.find(
      (artifact) => String(artifact.path) === "skills/README.md",
    );
    assert.ok(catalog?.kind === ArtifactKind.File);
    assert.match(
      catalog.content.toString("utf8"),
      /## Available Skills\n\nNo skills are currently published\.\n\n\| Skill/u,
    );
  });

  it("places required-skill guidance before instructions when the marker is omitted", async () => {
    // GIVEN: An authored skill has a title, introductory prose, and an instruction list.
    const plugin = makePlugin();
    const markerlessPlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) =>
        skill.id === "public-skill"
          ? {
              ...skill,
              source_body:
                "# Public\n\nOverview of the public workflow.\n\n1. Follow the workflow.\n",
            }
          : skill.id === "old-skill"
            ? { ...skill, source_body: "# Old\n" }
            : skill,
      ),
    });

    // WHEN: Rendering composes the shared skills tree.
    const fragment = await compileSharedSkills(markerlessPlugin);
    const files = new Map(
      fragment.artifacts
        .filter((artifact) => artifact.kind === ArtifactKind.File)
        .map((artifact) => [String(artifact.path), artifact.content]),
    );
    const publicSkill = files
      .get("skills/public-skill/SKILL.md")
      ?.toString("utf8");
    const oldSkill = files.get("skills/old-skill/SKILL.md")?.toString("utf8");

    // THEN: Guidance follows the introduction but precedes the instruction list.
    assert.ok(publicSkill);
    assert.ok(
      publicSkill.indexOf("Overview of the public workflow.") <
        publicSkill.indexOf("## Required skills"),
    );
    assert.ok(
      publicSkill.indexOf("## Required skills") <
        publicSkill.indexOf("1. Follow the workflow."),
    );
    assert.match(oldSkill ?? "", /# Old\n$/u);
    assert.doesNotMatch(oldSkill ?? "", /## Required skills/u);
  });

  it("uses an explicit marker as the required-skill insertion point", async () => {
    // GIVEN: An authored skill places the marker between its overview and workflow.
    const plugin = makePlugin();
    const placedPlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) =>
        skill.id === "public-skill"
          ? {
              ...skill,
              source_body:
                "# Public\n\nOverview.\n\n<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->\n\n## Workflow\n",
            }
          : skill,
      ),
    });

    // WHEN: Rendering composes the shared skills tree.
    const fragment = await compileSharedSkills(placedPlugin);
    const artifact = fragment.artifacts.find(
      (candidate) => String(candidate.path) === "skills/public-skill/SKILL.md",
    );
    assert.ok(artifact?.kind === ArtifactKind.File);
    const content = artifact.content.toString("utf8");

    // THEN: Generated guidance occupies the selected location and the marker disappears.
    assert.ok(
      content.indexOf("Overview.") < content.indexOf("## Required skills"),
    );
    assert.ok(
      content.indexOf("## Required skills") < content.indexOf("## Workflow"),
    );
    assert.doesNotMatch(content, /PLUGIN-COMPILER:REQUIRED-SKILLS/u);
  });

  it("rejects broken links in generated output before a plan can be written", async () => {
    // GIVEN: A defensive validated-looking model contains a broken generated Markdown link.
    const plugin = makePlugin();
    const brokenPlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) =>
        skill.id === "public-skill"
          ? {
              ...skill,
              source_body:
                "# Public\n\n<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->\n\n[missing](references/missing.md)\n",
            }
          : skill,
      ),
    });

    // WHEN: Rendering attempts to compile the invalid generated tree.
    const compilation = compileSharedSkills(brokenPlugin);

    // THEN: Generated-link diagnostics fail before any filesystem operation exists.
    await assert.rejects(compilation, (error: unknown) => {
      assert.ok(error instanceof SharedSkillsCompilationError);
      assert.match(error.message, /local link target does not exist/u);
      return true;
    });
  });

  it("inlines nested Markdown references and preserves every other resource", async () => {
    // GIVEN: One public skill opts in with nested references and mixed resources.
    const plugin = makePlugin();
    const inlinePlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) =>
        skill.id === "public-skill"
          ? {
              ...skill,
              compilation: {
                markdown_references: "inline",
              },
              source_body: `# Public

Root [architecture](references/architecture.md#overview).

${MARKDOWN_REFERENCES_MARKER}

## Workflow
`,
              resources: [
                {
                  path: createProjectPath("references/architecture.md"),
                  content: Buffer.from(`# Architecture

[nested](nested/details.md?raw=1#part)
![diagram](../assets/diagram.png)
[data][data]

[data]: data.json?raw=1#record
`),
                },
                {
                  path: createProjectPath("references/nested/details.md"),
                  content: Buffer.from(`# Details

[architecture](../architecture.md#overview)
[root](../../SKILL.md#public)
[script](../../scripts/check.mjs)
`),
                },
                {
                  path: createProjectPath("references/data.json"),
                  content: Buffer.from('{"valid":true}\n'),
                },
                {
                  path: createProjectPath("assets/diagram.png"),
                  content: Buffer.from([137, 80, 78, 71]),
                },
                {
                  path: createProjectPath("scripts/check.mjs"),
                  content: Buffer.from("export default true;\n"),
                },
                {
                  path: createProjectPath("notes/outside.md"),
                  content: Buffer.from("# Separate Markdown\n"),
                },
              ],
            }
          : skill,
      ),
    });

    // WHEN: Shared rendering composes the skill tree.
    const fragment = await compileSharedSkills(inlinePlugin);
    const files = new Map(
      fragment.artifacts
        .filter((artifact) => artifact.kind === ArtifactKind.File)
        .map((artifact) => [String(artifact.path), artifact.content]),
    );
    const content = files.get("skills/public-skill/SKILL.md")?.toString("utf8");

    // THEN: References merge in path order with root-valid links and no dependency inlining.
    assert.ok(content);
    assert.ok(content.indexOf("# Architecture") < content.indexOf("# Details"));
    assert.ok(content.indexOf("# Details") < content.indexOf("## Workflow"));
    assert.match(content, /\[architecture\]\(SKILL\.md#overview\)/u);
    assert.match(content, /\[nested\]\(SKILL\.md\?raw=1#part\)/u);
    assert.match(content, /!\[diagram\]\(assets\/diagram\.png\)/u);
    assert.match(
      content,
      /\[plugin-compiler-[a-f0-9]{64}\]: references\/data\.json\?raw=1#record/u,
    );
    assert.match(content, /\[root\]\(SKILL\.md#public\)/u);
    assert.match(content, /\[script\]\(scripts\/check\.mjs\)/u);
    assert.doesNotMatch(content, /# Rules/u);
    assert.equal(
      files.has("skills/public-skill/references/architecture.md"),
      false,
    );
    assert.equal(
      files.has("skills/public-skill/references/nested/details.md"),
      false,
    );
    assert.deepEqual(
      files.get("skills/public-skill/references/data.json"),
      Buffer.from('{"valid":true}\n'),
    );
    assert.deepEqual(
      files.get("skills/public-skill/assets/diagram.png"),
      Buffer.from([137, 80, 78, 71]),
    );
    assert.deepEqual(
      files.get("skills/public-skill/scripts/check.mjs"),
      Buffer.from("export default true;\n"),
    );
    assert.deepEqual(
      files.get("skills/public-skill/notes/outside.md"),
      Buffer.from("# Separate Markdown\n"),
    );
    assert.deepEqual(
      files.get("skills/public-skill/skills/base-skill/references/rules.md"),
      Buffer.from("# Rules\n"),
    );
  });

  it("appends inlined references when the placement marker is absent", async () => {
    // GIVEN: One markerless public skill opts into a single reference.
    const plugin = makePlugin();
    const inlinePlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) =>
        skill.id === "old-skill"
          ? {
              ...skill,
              compilation: {
                markdown_references: "inline",
              },
              source_body: "# Old\n\nBody.\n",
              resources: [
                {
                  path: createProjectPath("references/appended.md"),
                  content: Buffer.from("# Appended\n"),
                },
              ],
            }
          : skill,
      ),
    });

    // WHEN: The markerless skill is compiled.
    const fragment = await compileSharedSkills(inlinePlugin);
    const artifact = fragment.artifacts.find(
      (candidate) => String(candidate.path) === "skills/old-skill/SKILL.md",
    );
    assert.ok(artifact?.kind === ArtifactKind.File);
    const content = artifact.content.toString("utf8");

    // THEN: Reference content follows the complete authored body.
    assert.ok(content.indexOf("Body.") < content.indexOf("# Appended"));
    assert.equal(
      fragment.artifacts.some(
        (candidate) =>
          String(candidate.path) === "skills/old-skill/references/appended.md",
      ),
      false,
    );
  });

  it("rebases parsed edge-case destinations without changing their authored spelling", async () => {
    // GIVEN: One reference uses escaped labels, structured labels, and raw URL suffix syntax.
    const plugin = makePlugin();
    const edgeCasePlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) =>
        skill.id === "old-skill"
          ? {
              ...skill,
              compilation: { markdown_references: "inline" },
              source_body: `# Old

${MARKDOWN_REFERENCES_MARKER}
`,
              resources: [
                {
                  path: createProjectPath("references/edge.md"),
                  content: Buffer.from(`# Edge

[code \`[\`](nested.md?close=\\)#raw&amp;)
[html <span title="[">label</span>](<nested.md?space=&#32;q>)
[entity query](<nested.md&#63;x=1>)
[entity fragment](nested.md&#35;part)
[escaped query](nested.md\\?x=1)
[escaped fragment](nested.md\\#part)
[escaped][a\\]:b]

[a\\]:b]: ../assets/data.json?raw=1
`),
                },
                {
                  path: createProjectPath("references/nested.md"),
                  content: Buffer.from("# Nested\n"),
                },
                {
                  path: createProjectPath("assets/data.json"),
                  content: Buffer.from("{}\n"),
                },
              ],
            }
          : skill,
      ),
    });

    // WHEN: The shared document is compiled and reparsed during generated validation.
    const fragment = await compileSharedSkills(edgeCasePlugin);
    const artifact = fragment.artifacts.find(
      (candidate) => String(candidate.path) === "skills/old-skill/SKILL.md",
    );
    assert.ok(artifact?.kind === ArtifactKind.File);
    const content = artifact.content.toString("utf8");

    // THEN: Only destination paths and isolated reference identifiers change.
    assert.match(content, /\[code `\[`\]\(SKILL\.md\?close=\\\)#raw&amp;\)/u);
    assert.match(
      content,
      /\[html <span title="\[">label<\/span>\]\(<SKILL\.md\?space=&#32;q>\)/u,
    );
    assert.match(content, /\[entity query\]\(<SKILL\.md&#63;x=1>\)/u);
    assert.match(content, /\[entity fragment\]\(SKILL\.md&#35;part\)/u);
    assert.match(content, /\[escaped query\]\(SKILL\.md\\\?x=1\)/u);
    assert.match(content, /\[escaped fragment\]\(SKILL\.md\\#part\)/u);
    const escapedReference =
      /\[escaped\]\[(plugin-compiler-[a-f0-9]{64})\]/u.exec(content);
    assert.ok(escapedReference?.[1]);
    assert.match(
      content,
      new RegExp(
        `\\[${escapedReference[1]}\\]: assets/data\\.json\\?raw=1`,
        "u",
      ),
    );
    const reparsedDestinations = markdownNodes(content)
      .filter((node) => node.type === "link")
      .map((node) => node.url);
    assert.equal(
      reparsedDestinations.filter((url) => url === "SKILL.md?x=1").length,
      2,
    );
    assert.equal(
      reparsedDestinations.filter((url) => url === "SKILL.md#part").length,
      2,
    );
  });

  it("isolates duplicate reference-definition namespaces across inlined documents", async () => {
    // GIVEN: Two independent reference documents use the same definition identifier.
    const plugin = makePlugin();
    const duplicateDefinitionsPlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) =>
        skill.id === "old-skill"
          ? {
              ...skill,
              compilation: { markdown_references: "inline" },
              source_body: `# Old

${MARKDOWN_REFERENCES_MARKER}
`,
              resources: [
                {
                  path: createProjectPath("references/A.md"),
                  content: Buffer.from(
                    "[first][asset] ![first image][asset] [asset][] ![asset]\n\n[asset]: ../assets/A.json\n",
                  ),
                },
                {
                  path: createProjectPath("references/a.md"),
                  content: Buffer.from(
                    "[second][asset]\n\n[asset]: ../assets/a.json\n",
                  ),
                },
                {
                  path: createProjectPath("assets/A.json"),
                  content: Buffer.from("{}\n"),
                },
                {
                  path: createProjectPath("assets/a.json"),
                  content: Buffer.from("{}\n"),
                },
              ],
            }
          : skill,
      ),
    });

    // WHEN: Both documents merge into one generated SKILL.md.
    const fragment = await compileSharedSkills(duplicateDefinitionsPlugin);
    const artifact = fragment.artifacts.find(
      (candidate) => String(candidate.path) === "skills/old-skill/SKILL.md",
    );
    assert.ok(artifact?.kind === ArtifactKind.File);
    const content = artifact.content.toString("utf8");

    // THEN: Each visible reference points at its own qualified definition and target.
    const firstReference = /\[first\]\[(plugin-compiler-[a-f0-9]{64})\]/u.exec(
      content,
    );
    const secondReference =
      /\[second\]\[(plugin-compiler-[a-f0-9]{64})\]/u.exec(content);
    assert.ok(firstReference?.[1]);
    assert.ok(secondReference?.[1]);
    assert.notEqual(firstReference[1], secondReference[1]);
    assert.match(
      content,
      new RegExp(
        `!\\[first image\\]\\[${firstReference[1]}\\] \\[asset\\]\\[${firstReference[1]}\\] !\\[asset\\]\\[${firstReference[1]}\\]`,
        "u",
      ),
    );
    assert.match(
      content,
      new RegExp(`\\[${firstReference[1]}\\]: assets/A\\.json`, "u"),
    );
    assert.match(
      content,
      new RegExp(`\\[${secondReference[1]}\\]: assets/a\\.json`, "u"),
    );
  });

  it("keeps near-limit reference labels valid after namespace isolation", async () => {
    // GIVEN: An inlined document has a valid reference label close to CommonMark's limit.
    const plugin = makePlugin();
    const nearLimitLabel = "x".repeat(980);
    const nearLimitPlugin = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) =>
        skill.id === "old-skill"
          ? {
              ...skill,
              compilation: { markdown_references: "inline" },
              source_body: `# Old\n\n${MARKDOWN_REFERENCES_MARKER}\n`,
              resources: [
                {
                  path: createProjectPath("references/long.md"),
                  content: Buffer.from(
                    `[near][${nearLimitLabel}]\n\n[${nearLimitLabel}]: ../assets/near.json\n`,
                  ),
                },
                {
                  path: createProjectPath("assets/near.json"),
                  content: Buffer.from("{}\n"),
                },
              ],
            }
          : skill,
      ),
    });

    // WHEN: Reference identifiers are isolated and the generated document reparses.
    const fragment = await compileSharedSkills(nearLimitPlugin);
    const artifact = fragment.artifacts.find(
      (candidate) => String(candidate.path) === "skills/old-skill/SKILL.md",
    );
    assert.ok(artifact?.kind === ArtifactKind.File);
    const nodes = markdownNodes(artifact.content.toString("utf8"));
    const reference = nodes.find(
      (node) =>
        node.type === "linkReference" &&
        node.children[0]?.type === "text" &&
        node.children[0].value === "near",
    );
    const definition = nodes.find(
      (node) => node.type === "definition" && node.url === "assets/near.json",
    );

    // THEN: A fixed-length identifier preserves the link-to-definition relationship.
    assert.ok(reference?.type === "linkReference");
    assert.ok(definition?.type === "definition");
    assert.match(reference.identifier, /^plugin-compiler-[a-f0-9]{64}$/u);
    assert.equal(reference.identifier, definition.identifier);
  });

  it("scopes reference placement to the authored body before required guidance", async () => {
    // GIVEN: Generated required-skill fields contain the exact reference marker text.
    const plugin = makePlugin();
    const makeMarkerPlugin = (sourceBody: string) =>
      createPlugin({
        ...plugin,
        categories: plugin.categories,
        skills: plugin.skills.map((skill) =>
          skill.id === "public-skill"
            ? {
                ...skill,
                compilation: { markdown_references: "inline" },
                source_body: sourceBody,
                required_skills: skill.required_skills.map((requirement) => ({
                  ...requirement,
                  reason: `Reason ${MARKDOWN_REFERENCES_MARKER}`,
                  instructions: `Instructions ${MARKDOWN_REFERENCES_MARKER}`,
                })),
                resources: [
                  {
                    path: createProjectPath("references/placed.md"),
                    content: Buffer.from(
                      `# Inlined reference\n\n${REQUIRED_SKILLS_MARKER}\n`,
                    ),
                  },
                ],
              }
            : skill,
        ),
      });

    // WHEN: Compilation uses an authored marker and the markerless append policy.
    const placed = await compileSharedSkills(
      makeMarkerPlugin(`# Public

Before.

${MARKDOWN_REFERENCES_MARKER}

After.

${REQUIRED_SKILLS_MARKER}
`),
    );
    const appended = await compileSharedSkills(
      makeMarkerPlugin("# Public\n\nBefore.\n\nAfter.\n"),
    );
    const placedArtifact = placed.artifacts.find(
      (candidate) => String(candidate.path) === "skills/public-skill/SKILL.md",
    );
    const appendedArtifact = appended.artifacts.find(
      (candidate) => String(candidate.path) === "skills/public-skill/SKILL.md",
    );
    assert.ok(placedArtifact?.kind === ArtifactKind.File);
    assert.ok(appendedArtifact?.kind === ArtifactKind.File);
    const placedContent = placedArtifact.content.toString("utf8");
    const appendedContent = appendedArtifact.content.toString("utf8");

    // THEN: Authored placement wins, markerless content appends, and generated markers remain inert.
    assert.ok(
      placedContent.indexOf("Before.") <
        placedContent.indexOf("# Inlined reference"),
    );
    assert.ok(
      placedContent.indexOf("# Inlined reference") <
        placedContent.indexOf("After."),
    );
    assert.ok(
      appendedContent.indexOf("After.") <
        appendedContent.indexOf("# Inlined reference"),
    );
    assert.ok(
      placedContent.indexOf("After.") <
        placedContent.indexOf("## Required skills"),
    );
    assert.ok(
      appendedContent.indexOf("## Required skills") <
        appendedContent.indexOf("# Inlined reference"),
    );
    assert.equal(placedContent.split(MARKDOWN_REFERENCES_MARKER).length - 1, 2);
    assert.equal(
      appendedContent.split(MARKDOWN_REFERENCES_MARKER).length - 1,
      2,
    );
    assert.equal(placedContent.split(REQUIRED_SKILLS_MARKER).length - 1, 1);
    assert.equal(appendedContent.split(REQUIRED_SKILLS_MARKER).length - 1, 1);
  });

  it("keeps omitted and explicit preserve policies byte-identical", async () => {
    // GIVEN: The current fixture and an explicit-preserve copy describe the same plugin.
    const plugin = makePlugin();
    const explicitPreserve = createPlugin({
      ...plugin,
      categories: plugin.categories,
      skills: plugin.skills.map((skill) => ({
        ...skill,
        compilation: {
          markdown_references: "preserve",
        },
      })),
    });

    // WHEN: Both policies compile.
    const omitted = await compileSharedSkills(plugin);
    const preserved = await compileSharedSkills(explicitPreserve);

    // THEN: The complete desired trees have identical paths, kinds, and bytes.
    assert.deepEqual(preserved, omitted);
  });

  it("catalogs deprecated status and replacement guidance", async () => {
    // GIVEN: One public skill is deprecated in favor of another public skill.
    const plugin = makePlugin();
    assert.equal(plugin.skills[2]?.status, SkillStatus.Deprecated);

    // WHEN: The deterministic catalog is compiled.
    const fragment = await compileSharedSkills(plugin);
    const catalogArtifact = fragment.artifacts.find(
      (artifact) => String(artifact.path) === "skills/README.md",
    );

    // THEN: The generated table exposes status and replacement without root README markers.
    assert.ok(catalogArtifact?.kind === ArtifactKind.File);
    const catalog = catalogArtifact.content.toString("utf8");
    assert.match(
      catalog,
      /Deprecated — A replacement exists\. Use public-skill\./u,
    );
    assert.match(catalog, /`public-skill`/u);
    assert.doesNotMatch(catalog, /BEGIN GENERATED|END GENERATED/u);
  });
});
