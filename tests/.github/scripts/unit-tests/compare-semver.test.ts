import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  compareSemVer,
  parseSemVer,
  requireGreaterSemVer,
} from "../../../../.github/scripts/compare-semver.ts";

describe("compare semantic versions", () => {
  it("orders prereleases according to SemVer", () => {
    // GIVEN: Numeric and textual prereleases followed by a stable version.
    const versions = ["1.0.0-alpha.2", "1.0.0-alpha.10", "1.0.0-beta", "1.0.0"];

    // WHEN: Each adjacent pair is compared.
    const comparisons = versions
      .slice(1)
      .map((version, index) =>
        compareSemVer(versions[index] as string, version),
      );

    // THEN: Every version has higher precedence than its predecessor.
    assert.deepEqual(comparisons, [-1, -1, -1]);
  });

  it("rejects invalid or non-increasing versions", () => {
    // GIVEN: A version with a leading zero and an unchanged release.
    // WHEN: The parser and release guard validate them.
    const parsing = () => parseSemVer("01.0.0");
    const comparing = () => requireGreaterSemVer("1.0.0", "1.0.0");

    // THEN: Both are rejected.
    assert.throws(parsing, /not valid SemVer/);
    assert.throws(comparing, /must be valid SemVer and greater/);
  });
});
