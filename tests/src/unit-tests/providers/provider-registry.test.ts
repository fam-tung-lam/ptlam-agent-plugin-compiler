import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  createProjectPath,
  OutputEntryKind,
  OutputOwnershipKind,
} from "../../../../src/core/index.ts";
import {
  availableProviders,
  createCompilerProvider,
  createProviderContext,
  Provider,
  ProviderContractError,
  ProviderSelectionError,
  ProviderSelectionErrorReason,
  resolveProviders,
} from "../../../../src/providers/index.ts";
import { makeValidatedPluginFixture } from "./test-fixtures/validated-plugin-fixture.ts";

describe("provider registry", () => {
  it("resolves explicit subsets in stable provider order", () => {
    // GIVEN: Both providers are requested in reverse order.
    const requested = [Provider.Codex, Provider.Claude];

    // WHEN: The provider subset is resolved.
    const providers = resolveProviders(requested);

    // THEN: The result is immutable and follows canonical provider order.
    assert.deepEqual(
      providers.map((provider) => provider.id),
      ["claude", "codex"],
    );
    assert.equal(Object.isFrozen(providers), true);
    assert.deepEqual(
      availableProviders.map((provider) => provider.id),
      ["claude", "codex"],
    );
  });

  it.each([
    {
      providers: ["future" as Provider],
      provider: "future",
      reason: ProviderSelectionErrorReason.Unknown,
    },
    {
      providers: [Provider.Claude, Provider.Claude],
      provider: Provider.Claude,
      reason: ProviderSelectionErrorReason.Duplicate,
    },
  ])("reports $reason providers deterministically", (expected) => {
    // GIVEN: An invalid explicit provider selection.
    // WHEN: The registry resolves the selection.
    const resolution = () => resolveProviders(expected.providers);
    // THEN: The shared stable error identifies the value and reason.
    assert.throws(resolution, (error: unknown) => {
      assert.ok(error instanceof ProviderSelectionError);
      assert.equal(error.provider, expected.provider);
      assert.equal(error.reason, expected.reason);
      return true;
    });
  });

  it("rejects mismatched ownership and artifacts with deterministic violations", () => {
    // GIVEN: A provider declares one path but returns a different owner and duplicates.
    const declaredPath = createProjectPath(".claude-plugin/plugin.json");
    const unexpectedPath = createProjectPath(".claude-plugin/unexpected.json");
    const provider = createCompilerProvider({
      id: Provider.Claude,
      ownedPaths: [declaredPath],
      compile: () => ({
        ownerId: Provider.Codex,
        ownership: {
          kind: OutputOwnershipKind.ExactFiles,
          paths: [unexpectedPath],
        },
        artifacts: [
          { kind: OutputEntryKind.Directory, path: unexpectedPath },
          { kind: OutputEntryKind.Directory, path: unexpectedPath },
        ],
      }),
    });

    // WHEN: The provider compiles through the validated adapter seam.
    const compilation = () =>
      provider.compile(createProviderContext(makeValidatedPluginFixture()));

    // THEN: Every mismatch is reported once in stable lexical order.
    assert.throws(compilation, (error: unknown) => {
      assert.ok(error instanceof ProviderContractError);
      assert.deepEqual(error.violations, [
        "returned artifacts [.claude-plugin/unexpected.json, .claude-plugin/unexpected.json] instead of [.claude-plugin/plugin.json]",
        'returned duplicate artifact ".claude-plugin/unexpected.json"',
        'returned non-file artifact ".claude-plugin/unexpected.json"',
        'returned owner "codex" instead of "claude"',
        "returned ownership [.claude-plugin/unexpected.json] instead of [.claude-plugin/plugin.json]",
      ]);
      return true;
    });
  });
});
