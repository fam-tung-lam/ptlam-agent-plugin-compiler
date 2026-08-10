import assert from "node:assert/strict";

import { describe, it } from "vitest";
import {
  buildWritePlan,
  WritePlanValidationError,
} from "../../../../../src/compiler/planning/index.ts";
import {
  ArtifactKind,
  OwnershipKind,
} from "../../../../../src/core/generated/artifact.ts";
import type { PlanFragmentInput } from "../../../../../src/core/generated/plan-fragment.ts";
import {
  createProjectPath,
  type ProjectPath,
} from "../../../../../src/core/index.ts";

function sharedFragment(): PlanFragmentInput {
  return {
    ownerId: "shared-skills",
    ownership: {
      kind: OwnershipKind.CompleteTree,
      root: createProjectPath("skills"),
    },
    artifacts: [
      {
        kind: ArtifactKind.Directory,
        path: createProjectPath("skills"),
      },
      {
        kind: ArtifactKind.File,
        path: createProjectPath("skills/README.md"),
        content: Buffer.from("catalog\n"),
      },
    ],
  };
}

function providerFragment(
  ownerId: string,
  artifactPath: string,
): PlanFragmentInput {
  const ownedPath = createProjectPath(artifactPath);
  return {
    ownerId,
    ownership: {
      kind: OwnershipKind.ExactFiles,
      paths: [ownedPath],
    },
    artifacts: [
      {
        kind: ArtifactKind.File,
        path: ownedPath,
        content: Buffer.from(`${ownerId}\n`),
      },
    ],
  };
}

describe("buildWritePlan", () => {
  it("canonicalizes provider order into one immutable collision-free plan", () => {
    // GIVEN: Common and provider fragments arrive in non-canonical order.
    const codex = providerFragment("codex", ".codex-plugin/plugin.json");
    const claude = providerFragment("claude", ".claude-plugin/plugin.json");

    // WHEN: Planning validates and constructs the write plan.
    const plan = buildWritePlan({
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
      buildWritePlan({ fragments: [sharedFragment(), left, right] });
    const second = () =>
      buildWritePlan({ fragments: [right, left, sharedFragment()] });

    // THEN: Both fail with the same deterministic diagnostics.
    assert.throws(first, (firstError: unknown) => {
      assert.ok(firstError instanceof WritePlanValidationError);
      assert.throws(second, (secondError: unknown) => {
        assert.ok(secondError instanceof WritePlanValidationError);
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
    const escaped: PlanFragmentInput = {
      ownerId: "unsafe",
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [escapedPath],
      },
      artifacts: [
        {
          kind: ArtifactKind.File,
          path: escapedPath,
          content: Buffer.from("unsafe"),
        },
      ],
    };

    // WHEN: The unsafe plan is validated.
    const planning = () =>
      buildWritePlan({ fragments: [sharedFragment(), readme, escaped] });

    // THEN: Root documentation and unsafe logical paths cannot enter a plan.
    assert.throws(planning, (error: unknown) => {
      assert.ok(error instanceof WritePlanValidationError);
      assert.ok(
        error.message.includes("root README.md is never compiler-owned"),
      );
      assert.ok(error.message.includes("unsafe logical path"));
      return true;
    });
  });

  it("requires the generated skills catalog in the single shared tree", () => {
    // GIVEN: A complete skills tree omits its compiler-owned catalog.
    const missingCatalog: PlanFragmentInput = {
      ownerId: "shared-skills",
      ownership: {
        kind: OwnershipKind.CompleteTree,
        root: createProjectPath("skills"),
      },
      artifacts: [
        {
          kind: ArtifactKind.Directory,
          path: createProjectPath("skills"),
        },
      ],
    };

    // WHEN: The incomplete shared fragment is planned.
    const planning = () => buildWritePlan({ fragments: [missingCatalog] });

    // THEN: Planning rejects the incomplete common output contract.
    assert.throws(planning, /skills\/README\.md/u);
  });

  it("applies exact-fragment invariants to every owner", () => {
    const declared = createProjectPath(".custom/plugin.json");
    const missing = createProjectPath(".custom/missing.json");
    const undeclared = createProjectPath(".custom/extra.json");
    const invalid: PlanFragmentInput = {
      ownerId: "custom-owner",
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [declared, missing],
      },
      artifacts: [
        { kind: ArtifactKind.Directory, path: declared },
        {
          kind: ArtifactKind.File,
          path: undeclared,
          content: Buffer.from("extra"),
        },
      ],
    };

    assert.throws(
      () => buildWritePlan({ fragments: [sharedFragment(), invalid] }),
      (error: unknown) => {
        assert.ok(error instanceof WritePlanValidationError);
        assert.ok(
          error.errors.some((message) =>
            message.includes("exact ownership may emit only files"),
          ),
        );
        assert.ok(
          error.errors.some((message) =>
            message.includes("emits undeclared exact path"),
          ),
        );
        assert.ok(
          error.errors.some((message) =>
            message.includes("does not emit owned exact path"),
          ),
        );
        return true;
      },
    );
  });
});
