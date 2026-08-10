import assert from "node:assert/strict";
import path from "node:path";

import { describe, it } from "vitest";

import {
  assertEmittedRuntimeTarget,
  findRuntimeSpecifiers,
  isScannableBuildSource,
} from "./verify-build.ts";

describe("verify-build JSON resources", () => {
  const root = path.resolve("/test-package");
  const parser = path.join(
    root,
    "dist/compiler/validation/parse-plugin-manifest.js",
  );
  const schema = path.join(root, "dist/schemas/v1/plugin-manifest.schema.json");
  const schemaSpecifier = "../../schemas/v1/plugin-manifest.schema.json";

  it("accepts emitted JSON runtime targets and rejects missing targets", () => {
    assert.doesNotThrow(() =>
      assertEmittedRuntimeTarget(
        parser,
        schemaSpecifier,
        new Set([schema]),
        root,
      ),
    );
    assert.throws(
      () =>
        assertEmittedRuntimeTarget(parser, schemaSpecifier, new Set(), root),
      /Unresolved emitted runtime specifier/u,
    );
  });

  it("does not scan emitted JSON resources as source code", () => {
    assert.equal(isScannableBuildSource(parser), true);
    assert.equal(isScannableBuildSource(`${parser.slice(0, -3)}.d.ts`), true);
    assert.equal(isScannableBuildSource(schema), false);
  });

  it("discovers JSON resources loaded through createRequire", () => {
    assert.deepEqual(
      findRuntimeSpecifiers(`const schema = require("${schemaSpecifier}");`),
      [schemaSpecifier],
    );
  });
});
