import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  CLAUDE,
  CODEX,
  COPILOT,
  createProviderId,
  GEMINI,
  KIMI,
  type ProviderAdapter,
} from "../../../../src/core/index.ts";
import {
  ClaudeProviderAdapter,
  CodexProviderAdapter,
  CopilotProviderAdapter,
  GeminiProviderAdapter,
  KimiProviderAdapter,
  ProviderAdapterRegistry,
  ProviderSelectionError,
  ProviderSelectionErrorReason,
} from "../../../../src/providers/index.ts";

describe("ProviderAdapterRegistry", () => {
  it("registers an adapter without changing the original registry", () => {
    // GIVEN: An empty registry and one external adapter.
    const adapter = Object.freeze({
      id: createProviderId("external"),
      compile: () => {
        throw new Error("Compilation is not part of this registry test");
      },
    }) satisfies ProviderAdapter;
    const empty = new ProviderAdapterRegistry();

    // WHEN: The adapter is registered.
    const registered = empty.register(adapter);

    // THEN: Registration returns a new immutable registry.
    assert.notEqual(registered, empty);
    assert.deepEqual(empty.list(), []);
    assert.deepEqual(registered.list(), [adapter]);
    assert.equal(registered.has(adapter.id), true);
    assert.equal(Object.isFrozen(empty), true);
    assert.equal(Object.isFrozen(registered), true);
    assert.equal(Object.isFrozen(registered.list()), true);
  });

  it("resolves built-ins in stable registry order", () => {
    // GIVEN: Every built-in provider is requested in reverse order.
    const registry = ProviderAdapterRegistry.withBuiltIns();

    // WHEN: The requested adapters are resolved.
    const resolved = registry.resolve([KIMI, GEMINI, COPILOT, CODEX, CLAUDE]);

    // THEN: Resolution follows stable registry order and returns real adapters.
    assert.deepEqual(
      resolved.map((adapter) => adapter.id),
      [CLAUDE, CODEX, COPILOT, GEMINI, KIMI],
    );
    assert.equal(resolved[0] instanceof ClaudeProviderAdapter, true);
    assert.equal(resolved[1] instanceof CodexProviderAdapter, true);
    assert.equal(resolved[2] instanceof CopilotProviderAdapter, true);
    assert.equal(resolved[3] instanceof GeminiProviderAdapter, true);
    assert.equal(resolved[4] instanceof KimiProviderAdapter, true);
    assert.equal(Object.isFrozen(resolved), true);
  });

  it("rejects duplicate adapter registration", () => {
    // GIVEN: A registry already contains one adapter ID.
    const adapter = ProviderAdapterRegistry.withBuiltIns().list()[0];
    assert.ok(adapter !== undefined);
    const registry = new ProviderAdapterRegistry([adapter]);

    // WHEN: Another adapter with the same ID is registered.
    const registration = () => registry.register(adapter);

    // THEN: The duplicate is rejected without changing the registry.
    assert.throws(registration, /Duplicate provider adapter "claude"/u);
    assert.deepEqual(registry.list(), [adapter]);
  });

  it("rejects unknown and duplicate provider selections", () => {
    // GIVEN: A registry with every built-in adapter.
    const registry = ProviderAdapterRegistry.withBuiltIns();

    // WHEN: Resolution receives one unknown ID or one repeated ID.
    const unknown = () => registry.resolve(["future"]);
    const duplicate = () => registry.resolve([CLAUDE, CLAUDE]);

    // THEN: Each error identifies the provider and reason deterministically.
    assert.throws(unknown, (error: unknown) => {
      assert.ok(error instanceof ProviderSelectionError);
      assert.equal(error.provider, "future");
      assert.equal(error.reason, ProviderSelectionErrorReason.Unknown);
      return true;
    });
    assert.throws(duplicate, (error: unknown) => {
      assert.ok(error instanceof ProviderSelectionError);
      assert.equal(error.provider, CLAUDE);
      assert.equal(error.reason, ProviderSelectionErrorReason.Duplicate);
      return true;
    });
  });
});
