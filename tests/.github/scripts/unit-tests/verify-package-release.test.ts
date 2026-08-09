import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  type ExpectedPackageRelease,
  type PackageReleaseReader,
  verifyPackageRelease,
} from "../../../../.github/scripts/verify-package-release.ts";

const expected: ExpectedPackageRelease = {
  integrity: "sha512-YWJj",
  npmTag: "next",
  packageName: "@fam-tung-lam/ptlam-agent-plugin-compiler",
  packageVersion: "1.0.0-alpha.2",
  publishedNow: true,
  shasum: "a".repeat(40),
};

function reader(
  overrides: Partial<PackageReleaseReader> = {},
): PackageReleaseReader {
  return {
    async readRelease() {
      return {
        distTagVersion: expected.packageVersion,
        integrity: expected.integrity,
        provenanceType: "https://slsa.dev/provenance/v1",
        shasum: expected.shasum,
        version: expected.packageVersion,
      };
    },
    async verifyConsumer() {},
    ...overrides,
  };
}

describe("verify package release", () => {
  it("accepts matching registry bytes, provenance, tag, and consumer verification", async () => {
    // GIVEN: npm exposes the exact expected public release.
    let consumerSpec = "";
    const registry = reader({
      async verifyConsumer(packageSpec) {
        consumerSpec = packageSpec;
      },
    });

    // WHEN: The read-only verifier observes the release.
    await verifyPackageRelease(expected, registry);

    // THEN: It verifies a clean consumer against the exact version.
    assert.equal(
      consumerSpec,
      "@fam-tung-lam/ptlam-agent-plugin-compiler@1.0.0-alpha.2",
    );
  });

  it("rejects missing provenance", async () => {
    // GIVEN: npm serves the bytes without trusted publishing provenance.
    const registry = reader({
      async readRelease() {
        return {
          distTagVersion: expected.packageVersion,
          integrity: expected.integrity,
          provenanceType: "",
          shasum: expected.shasum,
          version: expected.packageVersion,
        };
      },
    });

    // WHEN: The read-only verifier observes the release.
    const verifying = verifyPackageRelease(expected, registry);

    // THEN: CD reports the provenance failure.
    await assert.rejects(verifying, /unexpected provenance/);
  });

  it("accepts a resumed prerelease when next already points ahead", async () => {
    // GIVEN: The exact release exists and next points to a newer prerelease.
    const registry = reader({
      async readRelease() {
        return {
          distTagVersion: "1.0.0-alpha.3",
          integrity: expected.integrity,
          provenanceType: "https://slsa.dev/provenance/v1",
          shasum: expected.shasum,
          version: expected.packageVersion,
        };
      },
    });

    // WHEN: CD verifies a release resumed after publication.
    const verifying = verifyPackageRelease(
      { ...expected, publishedNow: false },
      registry,
    );

    // THEN: Verification preserves the newer next tag and succeeds.
    await assert.doesNotReject(verifying);
  });
});
