import assert from "node:assert/strict";
import path from "node:path";

import { describe, it } from "vitest";

import {
  assertEmittedRuntimeTarget,
  findRuntimeSpecifiers,
  isScannableBuildSource,
} from "../../../scripts/verify-build.ts";

describe("verify-build JSON resources", () => {
  const root = path.resolve("/test-package");
  const parser = path.join(
    root,
    "dist/compiler/validation/parse-plugin-manifest.js",
  );
  const schema = path.join(root, "dist/schemas/v1/plugin-manifest.schema.json");
  const schemaSpecifier = "../../schemas/v1/plugin-manifest.schema.json";

  it("accepts emitted JSON runtime targets and rejects missing targets", () => {
    // GIVEN: The schema exists in one emitted path set but not another.
    const emittedPaths = new Set([schema]);

    // WHEN: Each emitted runtime target is resolved.
    const verifyExistingTarget = () =>
      assertEmittedRuntimeTarget(parser, schemaSpecifier, emittedPaths, root);
    const verifyMissingTarget = () =>
      assertEmittedRuntimeTarget(parser, schemaSpecifier, new Set(), root);

    // THEN: Existing JSON is accepted and a missing target is actionable.
    assert.doesNotThrow(verifyExistingTarget);
    assert.throws(verifyMissingTarget, /Unresolved emitted runtime specifier/u);
  });

  it("does not scan emitted JSON resources as source code", () => {
    // GIVEN: The build contains JavaScript, declarations, and a JSON resource.
    const declaration = `${parser.slice(0, -3)}.d.ts`;

    // WHEN: Each artifact is classified for source scanning.
    const sourceIsScannable = isScannableBuildSource(parser);
    const declarationIsScannable = isScannableBuildSource(declaration);
    const schemaIsScannable = isScannableBuildSource(schema);

    // THEN: Only executable and declaration sources are scanned.
    assert.equal(sourceIsScannable, true);
    assert.equal(declarationIsScannable, true);
    assert.equal(schemaIsScannable, false);
  });

  it("discovers JSON resources loaded through createRequire", () => {
    // GIVEN: Emitted JavaScript loads the schema through createRequire.
    const source = `const schema = require("${schemaSpecifier}");`;

    // WHEN: Runtime specifiers are discovered.
    const specifiers = findRuntimeSpecifiers(source);

    // THEN: The JSON resource remains part of build verification.
    assert.deepEqual(specifiers, [schemaSpecifier]);
  });

  it("ignores import examples inside emitted JSDoc", () => {
    // GIVEN: Emitted source documents package usage beside one real import.
    const source = `
      /**
       * @example
       * import { AgentPluginCompiler } from "@example/compiler";
       */
      export { value } from "./value.js";
    `;

    // WHEN: Runtime specifiers are discovered.
    const specifiers = findRuntimeSpecifiers(source);

    // THEN: Documentation cannot create a false runtime dependency.
    assert.deepEqual(specifiers, ["./value.js"]);
  });
});
