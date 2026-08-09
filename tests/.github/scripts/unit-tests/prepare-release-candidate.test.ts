import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  type CandidateRepository,
  prepareReleaseCandidate,
} from "../../../../.github/scripts/prepare-release-candidate.ts";

function repository(registryIntegrity: "absent" | string): CandidateRepository {
  return {
    async fetch() {},
    async findTag() {
      return false;
    },
    async readPackageJsonAt() {
      return {
        name: "@fam-tung-lam/ptlam-agent-plugin-compiler",
        version: "1.0.0",
      };
    },
    async readRegistryIntegrity() {
      return registryIntegrity;
    },
  };
}

describe("prepare release candidate", () => {
  it("maps a prerelease change to the next npm channel", async () => {
    // GIVEN: A new prerelease and tested artifact metadata.
    const input = {
      currentManifest: {
        name: "@fam-tung-lam/ptlam-agent-plugin-compiler",
        version: "1.1.0-alpha.1",
      },
      integrity: "sha512-YWJj",
      previousSha: "previous",
      releaseSha: "b".repeat(40),
      shasum: "a".repeat(40),
      tarballName: "package.tgz",
    };

    // WHEN: CI prepares the candidate metadata.
    const candidate = await prepareReleaseCandidate(
      input,
      repository("absent"),
    );

    // THEN: CD receives a prerelease on the next channel.
    assert.equal(candidate.shouldRelease, true);
    assert.equal(candidate.npmTag, "next");
    assert.equal(candidate.prerelease, true);
  });

  it("rejects an existing version with different bytes", async () => {
    // GIVEN: npm has the same version but a different integrity.
    const input = {
      currentManifest: {
        name: "@fam-tung-lam/ptlam-agent-plugin-compiler",
        version: "1.1.0",
      },
      integrity: "sha512-YWJj",
      previousSha: "previous",
      releaseSha: "b".repeat(40),
      shasum: "a".repeat(40),
      tarballName: "package.tgz",
    };

    // WHEN: CI prepares a safe resume candidate.
    const preparing = prepareReleaseCandidate(input, repository("sha512-ZGVm"));

    // THEN: Immutable npm bytes cannot be replaced.
    await assert.rejects(preparing, /different bytes/);
  });
});
