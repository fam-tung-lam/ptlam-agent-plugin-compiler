import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  type ReleaseVersionRepository,
  validateReleaseVersion,
} from "../../../../.github/scripts/validate-release-version.ts";

function repository(
  overrides: Partial<ReleaseVersionRepository> = {},
): ReleaseVersionRepository {
  return {
    async fetch() {},
    async findTag() {
      return undefined;
    },
    async readPackageJsonAt() {
      return {
        name: "@fam-tung-lam/ptlam-agent-plugin-compiler",
        version: "1.0.0",
      };
    },
    async readPublishedVersion() {
      return "absent";
    },
    ...overrides,
  };
}

describe("validate release version", () => {
  it("allows a greater version absent from npm and Git", async () => {
    // GIVEN: A release version greater than the base and absent remotely.
    const manifest = {
      name: "@fam-tung-lam/ptlam-agent-plugin-compiler",
      version: "1.1.0-alpha.1",
    };
    const changelog = `# Changelog

## [Unreleased]

## [1.1.0-alpha.1] - 2026-08-10

### Added

- Added a release capability.

[Unreleased]:
  https://github.com/example/project/compare/v1.1.0-alpha.1...HEAD
[1.1.0-alpha.1]:
  https://github.com/example/project/compare/v1.0.0...v1.1.0-alpha.1
`;

    // WHEN: The PR release version is validated.
    const changed = await validateReleaseVersion(
      manifest,
      changelog,
      "base",
      repository(),
    );

    // THEN: CI recognizes a valid release change.
    assert.equal(changed, true);
  });

  it("rejects a version already published to npm", async () => {
    // GIVEN: npm already contains the requested version.
    const manifest = {
      name: "@fam-tung-lam/ptlam-agent-plugin-compiler",
      version: "1.1.0",
    };
    const published = repository({
      async readPublishedVersion() {
        return "present";
      },
    });

    // WHEN: The PR release version is validated.
    const validating = validateReleaseVersion(
      manifest,
      "unused changelog",
      "base",
      published,
    );

    // THEN: Reusing the immutable npm version is rejected.
    await assert.rejects(validating, /already exists on npm/);
  });
});
