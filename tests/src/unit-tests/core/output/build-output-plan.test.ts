import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  buildOutputPlan,
  createProjectPath,
  OutputEntryKind,
  type OutputFragmentInput,
  OutputOwnershipKind,
  OutputPlanValidationError,
  type ProjectPath,
} from "../../../../../src/core/index.ts";

function sharedFragment(): OutputFragmentInput {
  return {
    ownerId: "shared-skills",
    ownership: {
      kind: OutputOwnershipKind.CompleteTree,
      root: createProjectPath("skills"),
    },
    artifacts: [
      {
        kind: OutputEntryKind.Directory,
        path: createProjectPath("skills"),
      },
      {
        kind: OutputEntryKind.File,
        path: createProjectPath("skills/README.md"),
        content: Buffer.from("catalog\n"),
      },
    ],
  };
}

function providerFragment(
  ownerId: string,
  artifactPath: string,
): OutputFragmentInput {
  const ownedPath = createProjectPath(artifactPath);
  return {
    ownerId,
    ownership: {
      kind: OutputOwnershipKind.ExactFiles,
      paths: [ownedPath],
    },
    artifacts: [
      {
        kind: OutputEntryKind.File,
        path: ownedPath,
        content: Buffer.from(`${ownerId}\n`),
      },
    ],
  };
}

describe("buildOutputPlan", () => {
  it("canonicalizes provider order into one immutable collision-free plan", () => {
    // GIVEN: Common and provider fragments arrive in non-canonical order.
    const codex = providerFragment("codex", ".codex-plugin/plugin.json");
    const claude = providerFragment("claude", ".claude-plugin/plugin.json");

    // WHEN: Core validates and constructs the output plan.
    const plan = buildOutputPlan({
      fragments: [codex, sharedFragment(), claude],
    });

    // THEN: Fragment and artifact ordering is deterministic and immutable.
    assert.deepEqual(
      plan.fragments.map((fragment) => fragment.ownerId),
      ["claude", "codex", "shared-skills"],
    );
    assert.equal(Object.isFrozen(plan), true);
    assert.equal(Object.isFrozen(plan.fragments), true);
  });

  it("reports ownership collisions independently of provider input order", () => {
    // GIVEN: Two providers claim the same exact output file.
    const left = providerFragment("alpha", ".plugin/plugin.json");
    const right = providerFragment("beta", ".plugin/plugin.json");

    // WHEN: Both provider orders are validated.
    const first = () =>
      buildOutputPlan({ fragments: [sharedFragment(), left, right] });
    const second = () =>
      buildOutputPlan({ fragments: [right, left, sharedFragment()] });

    // THEN: Both fail with the same deterministic diagnostics.
    assert.throws(first, (firstError: unknown) => {
      assert.ok(firstError instanceof OutputPlanValidationError);
      assert.throws(second, (secondError: unknown) => {
        assert.ok(secondError instanceof OutputPlanValidationError);
        assert.deepEqual(secondError.errors, firstError.errors);
        return true;
      });
      return true;
    });
  });

  it("rejects root README ownership and logical path escapes", () => {
    // GIVEN: One fragment claims root README and another bypasses the branded path factory.
    const readme = providerFragment("readme-owner", "README.md");
    const escapedPath = "skills/../outside" as ProjectPath;
    const escaped: OutputFragmentInput = {
      ownerId: "unsafe",
      ownership: {
        kind: OutputOwnershipKind.ExactFiles,
        paths: [escapedPath],
      },
      artifacts: [
        {
          kind: OutputEntryKind.File,
          path: escapedPath,
          content: Buffer.from("unsafe"),
        },
      ],
    };

    // WHEN: The unsafe plan is validated.
    const planning = () =>
      buildOutputPlan({ fragments: [sharedFragment(), readme, escaped] });

    // THEN: Root documentation and unsafe logical paths cannot enter a plan.
    assert.throws(planning, (error: unknown) => {
      assert.ok(error instanceof OutputPlanValidationError);
      assert.ok(
        error.message.includes("root README.md is never compiler-owned"),
      );
      assert.ok(error.message.includes("unsafe logical path"));
      return true;
    });
  });

  it("requires the generated skills catalog in the single shared tree", () => {
    // GIVEN: A complete skills tree omits its compiler-owned catalog.
    const missingCatalog: OutputFragmentInput = {
      ownerId: "shared-skills",
      ownership: {
        kind: OutputOwnershipKind.CompleteTree,
        root: createProjectPath("skills"),
      },
      artifacts: [
        {
          kind: OutputEntryKind.Directory,
          path: createProjectPath("skills"),
        },
      ],
    };

    // WHEN: The incomplete shared fragment is planned.
    const planning = () => buildOutputPlan({ fragments: [missingCatalog] });

    // THEN: Planning rejects the incomplete common output contract.
    assert.throws(planning, /skills\/README\.md/u);
  });
});
