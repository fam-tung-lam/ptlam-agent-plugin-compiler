import assert from "node:assert/strict";

import { describe, expectTypeOf, it } from "vitest";

import {
  type CategoryId,
  CLAUDE,
  CODEX,
  COPILOT,
  createCategoryId,
  createProviderId,
  createSkillId,
  GEMINI,
  InvalidIdentifierError,
  KIMI,
  type PluginCategory,
  type ProviderId,
  type SkillId,
  type SkillManifest,
  type SkillRequirement,
} from "../../../../src/core/index.ts";

describe("branded identifiers", () => {
  it("keeps skill, category, and provider references distinct at compile time", () => {
    expectTypeOf<SkillManifest["id"]>().toEqualTypeOf<SkillId>();
    expectTypeOf<SkillRequirement["skill_id"]>().toEqualTypeOf<SkillId>();
    expectTypeOf<SkillManifest["category_id"]>().toEqualTypeOf<CategoryId>();
    expectTypeOf<PluginCategory["id"]>().toEqualTypeOf<CategoryId>();
    expectTypeOf<SkillId>().not.toEqualTypeOf<CategoryId>();
    expectTypeOf<ProviderId>().not.toEqualTypeOf<SkillId>();
  });

  it("validates manifest identifiers before branding them", () => {
    assert.equal(createSkillId("prepare-change"), "prepare-change");
    assert.equal(createCategoryId("engineering"), "engineering");

    for (const value of [
      "",
      "Prepare-Change",
      "prepare--change",
      "prepare-",
      "a".repeat(65),
    ]) {
      assert.throws(() => createSkillId(value), InvalidIdentifierError);
      assert.throws(() => createCategoryId(value), InvalidIdentifierError);
    }
  });

  it("supports extensible provider identifiers and stable built-in constants", () => {
    assert.equal(CLAUDE, "claude");
    assert.equal(CODEX, "codex");
    assert.equal(COPILOT, "copilot");
    assert.equal(GEMINI, "gemini");
    assert.equal(KIMI, "kimi");
    assert.equal(createProviderId("custom-provider"), "custom-provider");

    for (const value of ["", "Claude", "1provider", "provider!"]) {
      assert.throws(() => createProviderId(value), InvalidIdentifierError);
    }
  });
});
