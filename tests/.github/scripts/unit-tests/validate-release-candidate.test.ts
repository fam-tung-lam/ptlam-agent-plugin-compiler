import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  parseReleaseCandidateMetadata,
  validateReleaseCandidate,
} from "../../../../.github/scripts/validate-release-candidate.ts";

const releaseSha = "b".repeat(40);
const rawMetadata = {
  integrity: "sha512-YWJj",
  npmTag: "next",
  packageName: "@fam-tung-lam/ptlam-agent-plugin-compiler",
  packageVersion: "1.0.0-alpha.2",
  prerelease: true,
  releaseSha,
  shasum: "a".repeat(40),
  shouldRelease: true,
  tarballName: "package.tgz",
};

describe("validate release candidate", () => {
  it("requests publishing only when the exact version is absent", async () => {
    // GIVEN: Valid tested metadata and matching tarball bytes absent from npm.
    const metadata = parseReleaseCandidateMetadata(rawMetadata, releaseSha);

    // WHEN: The release boundary validates the candidate.
    const result = await validateReleaseCandidate(metadata, "/candidate", {
      async inspectTarball() {
        return {
          integrity: metadata.integrity,
          packageName: metadata.packageName,
          packageVersion: metadata.packageVersion,
          shasum: metadata.shasum,
        };
      },
      async readRegistryIntegrity() {
        return "absent";
      },
    });

    // THEN: The privileged job receives an explicit publish decision.
    assert.equal(result.needsPublish, true);
  });

  it("resumes without publishing when npm contains the tested bytes", async () => {
    // GIVEN: npm already contains the exact tested tarball integrity.
    const metadata = parseReleaseCandidateMetadata(rawMetadata, releaseSha);

    // WHEN: The release boundary validates the existing package version.
    const result = await validateReleaseCandidate(metadata, "/candidate", {
      async inspectTarball() {
        return {
          integrity: metadata.integrity,
          packageName: metadata.packageName,
          packageVersion: metadata.packageVersion,
          shasum: metadata.shasum,
        };
      },
      async readRegistryIntegrity() {
        return metadata.integrity;
      },
    });

    // THEN: CD continues to verification without another npm publication.
    assert.equal(result.needsPublish, false);
  });

  it("rejects a tarball identity mismatch", async () => {
    // GIVEN: Metadata names the release package but the tarball names another package.
    const metadata = parseReleaseCandidateMetadata(rawMetadata, releaseSha);

    // WHEN: The release boundary validates the candidate.
    const validating = validateReleaseCandidate(metadata, "/candidate", {
      async inspectTarball() {
        return {
          integrity: metadata.integrity,
          packageName: "other-package",
          packageVersion: metadata.packageVersion,
          shasum: metadata.shasum,
        };
      },
      async readRegistryIntegrity() {
        return "absent";
      },
    });

    // THEN: Publishing is blocked before the approval boundary.
    await assert.rejects(validating, /identity does not match/);
  });
});
