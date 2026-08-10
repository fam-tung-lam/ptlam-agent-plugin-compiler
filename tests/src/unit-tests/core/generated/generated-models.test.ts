import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

import { describe, it } from "vitest";

import {
  ArtifactKind,
  createArtifact,
  OwnershipKind,
} from "../../../../../src/core/generated/artifact.ts";
import {
  createDriftEntry,
  DriftReason,
} from "../../../../../src/core/generated/drift.ts";
import { createGeneratedSnapshot } from "../../../../../src/core/generated/generated-snapshot.ts";
import { createPlanFragment } from "../../../../../src/core/generated/plan-fragment.ts";
import { createWritePlan } from "../../../../../src/core/generated/write-plan.ts";
import { createProjectPath } from "../../../../../src/core/index.ts";

describe("generated models", () => {
  it("creates deeply immutable plans and defensively copied artifacts", () => {
    const artifactPath = createProjectPath("skills/example/SKILL.md");
    const bytes = Buffer.from("original");
    const artifact = createArtifact({
      kind: ArtifactKind.File,
      path: artifactPath,
      content: bytes,
    });
    bytes.fill(0);

    const fragment = createPlanFragment({
      ownerId: "skills",
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [artifactPath],
      },
      artifacts: [artifact],
    });
    const plan = createWritePlan({ fragments: [fragment] });

    assert.equal(
      artifact.kind === ArtifactKind.File
        ? artifact.content.toString("utf8")
        : "",
      "original",
    );
    assert.equal(Object.isFrozen(fragment), true);
    assert.equal(Object.isFrozen(fragment.ownership), true);
    assert.equal(Object.isFrozen(fragment.artifacts), true);
    assert.equal(Object.isFrozen(plan), true);
    assert.equal(Object.isFrozen(plan.fragments), true);
  });

  it("sorts generated facts and freezes drift entries", () => {
    const later = createProjectPath("skills/zeta");
    const earlier = createProjectPath("skills/alpha");
    const snapshot = createGeneratedSnapshot({
      entries: [
        { kind: ArtifactKind.Directory, path: later },
        { kind: ArtifactKind.Directory, path: earlier },
      ],
    });
    const drift = createDriftEntry({
      path: earlier,
      reason: DriftReason.Missing,
    });

    assert.deepEqual(
      snapshot.entries.map((entry) => entry.path),
      [earlier, later],
    );
    assert.equal(Object.isFrozen(snapshot.entries), true);
    assert.equal(Object.isFrozen(drift), true);
  });

  it("keeps only the final generated vocabulary", async () => {
    const generatedRoot = new URL(
      "../../../../../src/core/generated/",
      import.meta.url,
    );
    const files = (await readdir(generatedRoot)).toSorted();

    assert.deepEqual(files, [
      "artifact.ts",
      "drift.ts",
      "generated-snapshot.ts",
      "plan-fragment.ts",
      "write-plan.ts",
      "write-result.ts",
    ]);

    const source = (
      await Promise.all(
        files.map((file) => readFile(new URL(file, generatedRoot), "utf8")),
      )
    ).join("\n");
    assert.doesNotMatch(source, /\b(?:Output[A-Z]\w*|PlannedArtifact)\b/u);
  });
});
