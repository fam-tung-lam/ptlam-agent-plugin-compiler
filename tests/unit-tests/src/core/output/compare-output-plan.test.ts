import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  buildOutputPlan,
  compareOutputPlan,
  createOutputState,
  createProjectPath,
  OutputDifferenceReason,
  OutputEntryKind,
  OutputOwnershipKind,
} from "../../../../../src/core/index.ts";

describe("compareOutputPlan", () => {
  it("reports deterministic owned drift while ignoring disabled-provider state", () => {
    // GIVEN: A plan owns the complete skills tree and one enabled provider file.
    const providerPath = createProjectPath(".claude-plugin/plugin.json");
    const plan = buildOutputPlan({
      fragments: [
        {
          ownerId: "skills",
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
              content: Buffer.from("expected catalog\n"),
            },
          ],
        },
        {
          ownerId: "claude",
          ownership: {
            kind: OutputOwnershipKind.ExactFiles,
            paths: [providerPath],
          },
          artifacts: [
            {
              kind: OutputEntryKind.File,
              path: providerPath,
              content: Buffer.from("expected provider\n"),
            },
          ],
        },
      ],
    });
    const state = createOutputState({
      entries: [
        {
          kind: OutputEntryKind.Directory,
          path: createProjectPath("skills"),
        },
        {
          kind: OutputEntryKind.File,
          path: createProjectPath("skills/README.md"),
          content: Buffer.from("stale catalog\n"),
        },
        {
          kind: OutputEntryKind.Directory,
          path: createProjectPath("skills/unexpected"),
        },
        {
          kind: OutputEntryKind.File,
          path: createProjectPath(".codex-plugin/plugin.json"),
          content: Buffer.from("disabled provider\n"),
        },
      ],
    });

    // WHEN: Expected artifacts are compared with factual state.
    const differences = compareOutputPlan({ plan, state });

    // THEN: Enabled missing/stale and complete-tree extras drift; disabled paths do not.
    assert.deepEqual(differences, [
      {
        path: ".claude-plugin/plugin.json",
        reason: OutputDifferenceReason.Missing,
      },
      {
        path: "skills/README.md",
        reason: OutputDifferenceReason.ContentDiffers,
      },
      {
        path: "skills/unexpected",
        reason: OutputDifferenceReason.Unexpected,
      },
    ]);
    assert.equal(Object.isFrozen(differences), true);
    assert.equal(
      differences.some((difference) =>
        String(difference.path).includes("codex"),
      ),
      false,
    );
  });

  it("distinguishes a factual entry kind mismatch", () => {
    // GIVEN: A planned catalog file is observed as a directory.
    const plan = buildOutputPlan({
      fragments: [
        {
          ownerId: "skills",
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
        },
      ],
    });
    const state = createOutputState({
      entries: [
        {
          kind: OutputEntryKind.Directory,
          path: createProjectPath("skills"),
        },
        {
          kind: OutputEntryKind.Directory,
          path: createProjectPath("skills/README.md"),
        },
      ],
    });

    // WHEN: Core compares the incompatible state kind.
    const differences = compareOutputPlan({ plan, state });

    // THEN: Kind drift is explicit rather than reported as byte drift.
    assert.deepEqual(differences, [
      {
        path: "skills/README.md",
        reason: OutputDifferenceReason.KindDiffers,
      },
    ]);
  });
});
