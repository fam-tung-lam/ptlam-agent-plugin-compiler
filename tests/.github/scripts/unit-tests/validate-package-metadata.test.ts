import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  EXPECTED_PACKAGE_NAME,
  validatePackageMetadata,
} from "../../../../.github/scripts/validate-package-metadata.ts";

describe("validate package metadata", () => {
  it("accepts one consistent public package identity", () => {
    // GIVEN: Matching manifest and lockfile metadata.
    const manifest = { name: EXPECTED_PACKAGE_NAME, version: "1.2.3" };
    const lockfile = {
      name: EXPECTED_PACKAGE_NAME,
      packages: { "": manifest },
      version: "1.2.3",
    };

    // WHEN: The public validator reads the metadata.
    const identity = validatePackageMetadata(manifest, lockfile);

    // THEN: It returns the canonical identity.
    assert.deepEqual(identity, manifest);
  });

  it("rejects lockfile drift", () => {
    // GIVEN: The lockfile has an older version.
    const manifest = { name: EXPECTED_PACKAGE_NAME, version: "1.2.3" };
    const lockfile = {
      name: EXPECTED_PACKAGE_NAME,
      packages: { "": { ...manifest, version: "1.2.2" } },
      version: "1.2.2",
    };

    // WHEN: The public validator compares the files.
    const validating = () => validatePackageMetadata(manifest, lockfile);

    // THEN: The release is rejected before CI proceeds.
    assert.throws(validating, /different versions/);
  });
});
