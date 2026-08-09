import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  compileSharedSkills,
  createValidatedPlugin,
  OutputEntryKind,
  OutputOwnershipKind,
  SharedSkillsCompilationError,
  SkillStatus,
  SkillVisibility,
  selectPublishedSkills,
} from "../../../../../src/core/index.ts";
import { makeValidatedPlugin } from "../test-fixtures/plugin-fixture.ts";

describe("compileSharedSkills", () => {
  it("builds a complete cataloged tree with recursive required-skill context", async () => {
    // GIVEN: A validated catalog contains active, deprecated, draft, and internal skills.
    const plugin = makeValidatedPlugin();

    // WHEN: Core compiles the provider-neutral shared skills tree.
    const fragment = await compileSharedSkills(plugin);
    const files = new Map(
      fragment.artifacts
        .filter((artifact) => artifact.kind === OutputEntryKind.File)
        .map((artifact) => [String(artifact.path), artifact.content]),
    );
    const publicSkill = files
      .get("skills/public-skill/SKILL.md")
      ?.toString("utf8");
    const catalog = files.get("skills/README.md")?.toString("utf8");

    // THEN: One complete tree contains cataloged roots and recursive dependency bytes.
    assert.deepEqual(fragment.ownership, {
      kind: OutputOwnershipKind.CompleteTree,
      root: "skills",
    });
    assert.match(publicSkill ?? "", /name: public-skill/u);
    assert.match(publicSkill ?? "", /\*\*Reason:\*\* Provides base rules\./u);
    assert.match(
      publicSkill ?? "",
      /references\/required-skills\/base-skill\/SKILL\.md/u,
    );
    assert.deepEqual(
      files.get(
        "skills/public-skill/references/required-skills/base-skill/references/rules.md",
      ),
      Buffer.from("# Rules\n"),
    );
    assert.match(catalog ?? "", /`public-skill`/u);
    assert.match(catalog ?? "", /`old-skill`/u);
    assert.doesNotMatch(catalog ?? "", /draft-skill|base-skill/u);
    assert.equal(catalog?.endsWith("\n"), true);
    assert.equal(Object.isFrozen(fragment), true);
    assert.equal(Object.isFrozen(fragment.artifacts), true);
  });

  it("selects public active and deprecated roots in manifest order", () => {
    // GIVEN: A validated plugin has every material lifecycle and visibility case.
    const plugin = makeValidatedPlugin();

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
    const plugin = makeValidatedPlugin();
    const internalPlugin = createValidatedPlugin({
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

  it("rejects broken links in generated output before a plan can be written", async () => {
    // GIVEN: A defensive validated-looking model contains a broken generated Markdown link.
    const plugin = makeValidatedPlugin();
    const brokenPlugin = createValidatedPlugin({
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

    // WHEN: Core attempts to compile the invalid generated tree.
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
    const plugin = makeValidatedPlugin();
    assert.equal(plugin.skills[2]?.status, SkillStatus.Deprecated);

    // WHEN: The deterministic catalog is compiled.
    const fragment = await compileSharedSkills(plugin);
    const catalogArtifact = fragment.artifacts.find(
      (artifact) => String(artifact.path) === "skills/README.md",
    );

    // THEN: The generated table exposes status and replacement without root README markers.
    assert.ok(catalogArtifact?.kind === OutputEntryKind.File);
    const catalog = catalogArtifact.content.toString("utf8");
    assert.match(
      catalog,
      /Deprecated — A replacement exists\. Use public-skill\./u,
    );
    assert.match(catalog, /`public-skill`/u);
    assert.doesNotMatch(catalog, /BEGIN GENERATED|END GENERATED/u);
  });
});
