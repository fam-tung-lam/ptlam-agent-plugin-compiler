import assert from "node:assert/strict";

import { describe, it } from "vitest";

import { ArtifactKind } from "../../../../src/core/index.ts";
import {
  ClaudeProviderAdapter,
  CodexProviderAdapter,
  CopilotProviderAdapter,
  GeminiProviderAdapter,
  KimiProviderAdapter,
} from "../../../../src/providers/index.ts";
import {
  makeHookPluginFixture,
  makePluginFixture,
} from "./test-fixtures/plugin-fixture.ts";

function generatedJson(
  adapter:
    | ClaudeProviderAdapter
    | CodexProviderAdapter
    | CopilotProviderAdapter
    | GeminiProviderAdapter
    | KimiProviderAdapter,
  path: string,
): Record<string, unknown> {
  const artifact = adapter
    .compile({ plugin: makeHookPluginFixture() })
    .artifacts.find((candidate) => candidate.path === path);
  assert.ok(artifact?.kind === ArtifactKind.File);
  return JSON.parse(artifact.content.toString("utf8")) as Record<
    string,
    unknown
  >;
}

describe("built-in provider hook compilation", () => {
  it("owns removable hook files only for the v2 contract", () => {
    // GIVEN: Hook-free plugins use the legacy and current schema contracts.
    const adapter = new CodexProviderAdapter();
    const legacy = makePluginFixture();
    const current = Object.freeze({
      ...makeHookPluginFixture(),
      hooks: Object.freeze([]),
    });

    // WHEN: The provider declares generated-file ownership for both plugins.
    const legacyOwnership = adapter.compile({ plugin: legacy }).ownership;
    const currentOwnership = adapter.compile({ plugin: current }).ownership;

    // THEN: v2 retains cleanup authority without changing v1 ownership.
    assert.deepEqual(legacyOwnership, {
      kind: "exact-files",
      paths: [".codex-plugin/plugin.json"],
    });
    assert.deepEqual(currentOwnership, {
      kind: "exact-files",
      paths: ["hooks/codex-hooks.json", ".codex-plugin/plugin.json"],
    });
  });

  it("maps one logical hook into Claude and Codex lifecycle files", () => {
    // GIVEN: One logical hook binds separate request and response handlers.
    const claude = new ClaudeProviderAdapter();
    const codex = new CodexProviderAdapter();

    // WHEN: Both compatible provider adapters compile the same plugin.
    const claudeManifest = generatedJson(claude, ".claude-plugin/plugin.json");
    const claudeHooks = generatedJson(claude, "hooks/claude-hooks.json");
    const codexManifest = generatedJson(codex, ".codex-plugin/plugin.json");
    const codexHooks = generatedJson(codex, "hooks/codex-hooks.json");

    // THEN: Native manifests point to distinct configs with both lifecycle events.
    assert.equal(claude.supportsHooks, true);
    assert.equal(codex.supportsHooks, true);
    assert.equal(claudeManifest["hooks"], "./hooks/claude-hooks.json");
    assert.equal(codexManifest["hooks"], "./hooks/codex-hooks.json");
    assert.deepEqual(Object.keys(claudeHooks["hooks"] as object), [
      "UserPromptSubmit",
      "Stop",
    ]);
    assert.deepEqual(Object.keys(codexHooks["hooks"] as object), [
      "UserPromptSubmit",
      "Stop",
    ]);
    assert.match(JSON.stringify(claudeHooks), /request\.mjs/u);
    assert.match(JSON.stringify(claudeHooks), /response\.mjs/u);
  });

  it("uses Copilot mutation events and Gemini agent events", () => {
    // GIVEN: Copilot and Gemini expose different native lifecycle vocabularies.
    const copilot = new CopilotProviderAdapter();
    const gemini = new GeminiProviderAdapter();

    // WHEN: Both adapters compile the same logical bindings.
    const copilotHooks = generatedJson(copilot, "hooks/copilot-hooks.json");
    const geminiHooks = generatedJson(gemini, "hooks/hooks.json");

    // THEN: Each native config contains the two provider-appropriate events.
    assert.equal(copilot.supportsHooks, true);
    assert.equal(gemini.supportsHooks, true);
    assert.deepEqual(Object.keys(copilotHooks["hooks"] as object), [
      "userPromptTransformed",
      "agentStop",
    ]);
    assert.deepEqual(Object.keys(geminiHooks["hooks"] as object), [
      "BeforeAgent",
      "AfterAgent",
    ]);
    assert.match(JSON.stringify(copilotHooks), /\$\{PLUGIN_ROOT\}/u);
    assert.match(JSON.stringify(geminiHooks), /\$\{extensionPath\}/u);
  });

  it("embeds Kimi lifecycle rules without exposing policy resources", () => {
    // GIVEN: Kimi declares plugin hooks inline in its native manifest.
    const kimi = new KimiProviderAdapter();

    // WHEN: The Kimi adapter compiles the logical adaptive hook.
    const manifest = generatedJson(kimi, "kimi.plugin.json");

    // THEN: Only the two handler bindings become first-class hook entries.
    assert.equal(kimi.supportsHooks, true);
    assert.deepEqual(
      (manifest["hooks"] as { event: string }[]).map(({ event }) => event),
      ["UserPromptSubmit", "Stop"],
    );
    assert.doesNotMatch(JSON.stringify(manifest), /policies/u);
  });
});
