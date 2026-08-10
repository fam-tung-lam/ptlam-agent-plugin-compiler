import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  extractReleaseNotes,
  validateReleaseChangelog,
} from "../../../../.github/scripts/release-notes.ts";

const validChangelog = `# Changelog

## [Unreleased]

## [1.1.0] - 2026-08-10

### Added

- Added immutable release assets.

## [1.0.0] - 2026-08-09

### Added

- Published the first release.

[Unreleased]:
  https://github.com/example/project/compare/v1.1.0...HEAD
[1.1.0]:
  https://github.com/example/project/compare/v1.0.0...v1.1.0
`;

describe("release notes", () => {
  it("extracts the curated notes for one release", () => {
    // GIVEN: A changelog with adjacent version sections.

    // WHEN: CD reads the notes for the current release.
    const notes = extractReleaseNotes(validChangelog, "1.1.0");

    // THEN: Only the current release body is returned.
    assert.equal(notes, "### Added\n\n- Added immutable release assets.\n");
  });

  it("accepts a complete release changelog", () => {
    // GIVEN: The release section is dated and Unreleased is empty.

    // WHEN: CI validates the changelog for the version bump.
    const validating = () =>
      validateReleaseChangelog(validChangelog, "1.0.0", "1.1.0");

    // THEN: The release changelog is accepted.
    assert.doesNotThrow(validating);
  });

  it("rejects changes left under Unreleased", () => {
    // GIVEN: A release pull request that did not move its notes.
    const staleChangelog = validChangelog.replace(
      "## [Unreleased]\n",
      "## [Unreleased]\n\n- Still unreleased.\n",
    );

    // WHEN: CI validates the changelog for the version bump.
    const validating = () =>
      validateReleaseChangelog(staleChangelog, "1.0.0", "1.1.0");

    // THEN: The stale Unreleased section is rejected.
    assert.throws(validating, /Unreleased must be empty/);
  });

  it("rejects stale comparison links", () => {
    // GIVEN: Unreleased still compares from the previous release.
    const staleChangelog = validChangelog.replace(
      "v1.1.0...HEAD",
      "v1.0.0...HEAD",
    );

    // WHEN: CI validates the changelog for the version bump.
    const validating = () =>
      validateReleaseChangelog(staleChangelog, "1.0.0", "1.1.0");

    // THEN: The stale comparison range is rejected.
    assert.throws(validating, /Unreleased comparison link/);
  });
});
