import assert from "node:assert/strict";

import { describe, it } from "vitest";
import {
  compileSharedSkills,
  SharedSkillsCompilationError,
} from "../../../../../src/compiler/rendering/index.ts";
import {
  ArtifactKind,
  createPlugin,
  OwnershipKind,
  SkillStatus,
  SkillVisibility,
  selectPublishedSkills,
} from "../../../../../src/core/index.ts";
import { makePlugin } from "../test-fixtures/plugin-fixture.ts";

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
    assert.match(catalog ?? "", /\| Skill\s+\| Category\s+\| Visibility\s+\|/u);
    assert.match(
      catalog ?? "",
      /\| `public-skill`\s+\| Engineering\s+\| public\s+\|/u,
    );
    assert.doesNotMatch(catalog ?? "", /draft-skill|base-skill/u);
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
