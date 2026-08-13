import assert from "node:assert/strict";

import { describe, it } from "vitest";

import { compileSharedHooks } from "../../../../../src/compiler/rendering/index.ts";
import { ArtifactKind, OwnershipKind } from "../../../../../src/core/index.ts";
import {
  makeHookPluginFixture,
  makePluginFixture,
} from "../../providers/test-fixtures/plugin-fixture.ts";

describe("compileSharedHooks", () => {
  it("copies authored handlers and internal resources once for every provider", () => {
    // GIVEN: Two event-keyed handlers share one internal policy resource.
    const plugin = makeHookPluginFixture();

    // WHEN: The provider-neutral hook tree is compiled.
    const fragment = compileSharedHooks(plugin);

    // THEN: One complete tree contains shared files and the portable dispatcher.
    assert.ok(fragment !== null);
    assert.deepEqual(fragment.ownership, {
      kind: OwnershipKind.CompleteTree,
      root: "hooks/handlers",
    });
    const files = fragment.artifacts
      .filter((artifact) => artifact.kind === ArtifactKind.File)
      .map((artifact) => artifact.path);
    assert.deepEqual(files, [
      "hooks/handlers/.runtime/portable-hook-dispatcher.mjs",
      "hooks/handlers/adaptive-interaction/policies/style.json",
      "hooks/handlers/adaptive-interaction/request.mjs",
      "hooks/handlers/adaptive-interaction/response.mjs",
    ]);
    assert.equal(
      files.filter((path) => path.endsWith("request.mjs")).length,
      1,
    );
  });

  it("keeps the v2 hook tree owned after all hooks are removed", () => {
    // GIVEN: A v2 plugin no longer registers hook handlers.
    const plugin = makeHookPluginFixture();
    const hookFree = Object.freeze({ ...plugin, hooks: Object.freeze([]) });

    // WHEN: Shared hook rendering evaluates the plugin.
    const fragment = compileSharedHooks(hookFree);

    // THEN: The empty owned root can remove stale generated handler resources.
    assert.ok(fragment !== null);
    assert.deepEqual(fragment.artifacts, [
      {
        kind: ArtifactKind.Directory,
        path: "hooks/handlers",
      },
    ]);
  });

  it("leaves legacy v1 plugins without a generated hook tree", () => {
    // GIVEN: An existing v1 plugin uses the frozen hook-free contract.
    const plugin = makePluginFixture();

    // WHEN: Shared hook rendering evaluates the plugin.
    const fragment = compileSharedHooks(plugin);

    // THEN: Backward-compatible compilation claims no new generated root.
    assert.equal(fragment, null);
  });
});
