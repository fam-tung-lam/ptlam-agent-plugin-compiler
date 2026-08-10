import assert from "node:assert/strict";

import { describe, it } from "vitest";
import {
  buildWritePlan,
  compareWritePlan,
} from "../../../../../src/compiler/planning/index.ts";
import {
  ArtifactKind,
  OwnershipKind,
} from "../../../../../src/core/generated/artifact.ts";
import { DriftReason } from "../../../../../src/core/generated/drift.ts";
import { createGeneratedSnapshot } from "../../../../../src/core/generated/generated-snapshot.ts";
import { createProjectPath } from "../../../../../src/core/index.ts";

describe("compareWritePlan", () => {
  it("reports desired-absence drift while ignoring unowned state", () => {
    // GIVEN: A plan owns selected and desired-absent provider files plus the complete skills tree.
    const providerPath = createProjectPath(".claude-plugin/plugin.json");
    const desiredAbsentPath = createProjectPath(".codex-plugin/plugin.json");
    const plan = buildWritePlan({
      fragments: [
        {
          ownerId: "skills",
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
              content: Buffer.from("expected catalog\n"),
            },
          ],
        },
        {
          ownerId: "claude",
          ownership: {
            kind: OwnershipKind.ExactFiles,
            paths: [providerPath],
          },
          artifacts: [
            {
              kind: ArtifactKind.File,
              path: providerPath,
              content: Buffer.from("expected provider\n"),
            },
          ],
        },
        {
          ownerId: "codex",
          ownership: {
            kind: OwnershipKind.ExactFiles,
            paths: [desiredAbsentPath],
          },
          artifacts: [],
        },
      ],
    });
    const snapshot = createGeneratedSnapshot({
      entries: [
        {
          kind: ArtifactKind.Directory,
          path: createProjectPath("skills"),
        },
        {
          kind: ArtifactKind.File,
          path: createProjectPath("skills/README.md"),
          content: Buffer.from("stale catalog\n"),
        },
        {
          kind: ArtifactKind.Directory,
          path: createProjectPath("skills/unexpected"),
        },
        {
          kind: ArtifactKind.File,
          path: desiredAbsentPath,
          content: Buffer.from("unexpected provider\n"),
        },
        {
          kind: ArtifactKind.File,
          path: createProjectPath(".unowned/plugin.json"),
          content: Buffer.from("unowned provider\n"),
        },
      ],
    });

    // WHEN: Expected artifacts are compared with factual state.
    const drift = compareWritePlan({ plan, snapshot });

    // THEN: Desired-absent, selected, and complete-tree drift is reported; unowned paths are ignored.
    assert.deepEqual(drift, [
      {
        path: ".claude-plugin/plugin.json",
        reason: DriftReason.Missing,
      },
      {
        path: ".codex-plugin/plugin.json",
        reason: DriftReason.Unexpected,
      },
      {
        path: "skills/README.md",
        reason: DriftReason.ContentDiffers,
      },
      {
        path: "skills/unexpected",
        reason: DriftReason.Unexpected,
      },
    ]);
    assert.equal(Object.isFrozen(drift), true);
    assert.equal(
      drift.some((entry) => String(entry.path).includes("unowned")),
      false,
    );
  });

  it("distinguishes a factual entry kind mismatch", () => {
    // GIVEN: A planned catalog file is observed as a directory.
    const plan = buildWritePlan({
      fragments: [
        {
          ownerId: "skills",
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
        },
      ],
    });
    const snapshot = createGeneratedSnapshot({
      entries: [
        {
          kind: ArtifactKind.Directory,
          path: createProjectPath("skills"),
        },
        {
          kind: ArtifactKind.Directory,
          path: createProjectPath("skills/README.md"),
        },
      ],
    });

    // WHEN: Planning compares the incompatible state kind.
    const drift = compareWritePlan({ plan, snapshot });

    // THEN: Kind drift is explicit rather than reported as byte drift.
    assert.deepEqual(drift, [
      {
        path: "skills/README.md",
        reason: DriftReason.KindDiffers,
      },
    ]);
  });
});
