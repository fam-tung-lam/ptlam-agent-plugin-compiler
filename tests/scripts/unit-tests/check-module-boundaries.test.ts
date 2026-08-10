import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, it } from "vitest";

import { checkModuleBoundaries } from "../../../scripts/check-module-boundaries.ts";

const fixtureRoots: string[] = [];

/**
 * Creates an isolated source tree for one module-boundary scenario.
 *
 * @param files - Source contents keyed by paths relative to the fixture `src/`.
 * @returns The absolute fixture source root.
 * @throws If the temporary fixture cannot be created or written.
 */
async function makeSourceFixture(
  files: Readonly<Record<string, string>>,
): Promise<string> {
  const fixtureRoot = await mkdtemp(
    path.join(os.tmpdir(), "module-boundaries-"),
  );
  fixtureRoots.push(fixtureRoot);
  const sourceRoot = path.join(fixtureRoot, "src");

  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(sourceRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, source, "utf8");
  }

  return sourceRoot;
}

afterEach(async () => {
  await Promise.all(
    fixtureRoots
      .splice(0)
      .map((fixtureRoot) => rm(fixtureRoot, { force: true, recursive: true })),
  );
});

describe("module boundary checker", () => {
  it("accepts the target dependency graph through public module indexes", async () => {
    // GIVEN: A fixture follows every allowed module dependency and index seam.
    const sourceRoot = await makeSourceFixture({
      "cli/command.ts": [
        'import "../compiler/index.js";',
        'import "../providers/index.js";',
      ].join("\n"),
      "compiler/agent-plugin-compiler.ts": [
        'import "../core/index.js";',
        'import "../filesystem/index.js";',
        'import "../providers/index.js";',
        'import "./planning/index.js";',
        'import "./rendering/index.js";',
        'import "./validation/index.js";',
      ].join("\n"),
      "compiler/planning/build-write-plan.ts": 'import "../../core/index.js";',
      "compiler/rendering/render.ts": [
        'import "../../core/index.js";',
        'import "../validation/index.js";',
      ].join("\n"),
      "compiler/validation/parse.ts": [
        'import "../../core/index.js";',
        'const schema = require("../../schemas/v1/plugin-manifest.schema.json");',
        "void schema;",
      ].join("\n"),
      "core/plugin/plugin.ts": "export interface Plugin {}",
      "filesystem/read.ts": 'import "../core/index.js";',
      "providers/provider.ts": 'import "../core/index.js";',
    });

    // WHEN: The source graph is checked.
    const violations = await checkModuleBoundaries(sourceRoot);

    // THEN: No boundary violation is reported.
    assert.deepEqual(violations, []);
  });

  it("reports every disallowed dependency edge with the allowed targets", async () => {
    // GIVEN: Independent source files cross three forbidden module edges.
    const sourceRoot = await makeSourceFixture({
      "core/plugin/plugin.ts": 'import "../../filesystem/index.js";',
      "filesystem/read.ts": 'import "../providers/index.js";',
      "providers/provider.ts": 'import "../compiler/index.js";',
    });

    // WHEN: The source graph is checked.
    const violations = await checkModuleBoundaries(sourceRoot);

    // THEN: Every violation names the edge and its allowed alternatives.
    assert.deepEqual(violations, [
      {
        file: "core/plugin/plugin.ts",
        message:
          'Module "core" cannot import "filesystem"; allowed module imports: none',
        specifier: "../../filesystem/index.js",
      },
      {
        file: "filesystem/read.ts",
        message:
          'Module "filesystem" cannot import "providers"; allowed module imports: core',
        specifier: "../providers/index.js",
      },
      {
        file: "providers/provider.ts",
        message:
          'Module "providers" cannot import "compiler"; allowed module imports: core',
        specifier: "../compiler/index.js",
      },
    ]);
  });

  it("rejects cross-module imports that bypass the target index", async () => {
    // GIVEN: A cross-module import bypasses the provider index.
    const sourceRoot = await makeSourceFixture({
      "cli/command.ts": 'import "../providers/provider-adapter.js";',
    });

    // WHEN: The source graph is checked.
    const violations = await checkModuleBoundaries(sourceRoot);

    // THEN: The diagnostic points callers to the public module index.
    assert.deepEqual(violations, [
      {
        file: "cli/command.ts",
        message:
          'Cross-module import must target "providers/index.js", not "providers/provider-adapter.js"',
        specifier: "../providers/provider-adapter.js",
      },
    ]);
  });

  it("rejects compiler internals imported from outside compiler", async () => {
    // GIVEN: CLI code imports a private compiler planning module.
    const sourceRoot = await makeSourceFixture({
      "cli/command.ts": 'import "../compiler/planning/index.js";',
    });

    // WHEN: The source graph is checked.
    const violations = await checkModuleBoundaries(sourceRoot);

    // THEN: The private compiler seam is rejected.
    assert.deepEqual(violations, [
      {
        file: "cli/command.ts",
        message:
          'Compiler internals are private; import "compiler/index.js" instead of "compiler/planning/index.js"',
        specifier: "../compiler/planning/index.js",
      },
    ]);
  });

  it("rejects code imports from schemas while allowing direct JSON", async () => {
    // GIVEN: Validation imports the schema as both JSON data and JavaScript.
    const sourceRoot = await makeSourceFixture({
      "compiler/validation/parse.ts": [
        'const schema = require("../../schemas/v1/schema.json");',
        'import "../../schemas/v1/schema.js";',
        "void schema;",
      ].join("\n"),
    });

    // WHEN: The source graph is checked.
    const violations = await checkModuleBoundaries(sourceRoot);

    // THEN: Only the executable schema import is rejected.
    assert.deepEqual(violations, [
      {
        file: "compiler/validation/parse.ts",
        message:
          'Schema import must target a JSON resource, not "schemas/v1/schema.js"',
        specifier: "../../schemas/v1/schema.js",
      },
    ]);
  });

  it("allows direct imports within one module", async () => {
    // GIVEN: Provider files import one another within the same module.
    const sourceRoot = await makeSourceFixture({
      "providers/claude-provider.ts": 'import "./render-json.js";',
      "providers/render-json.ts": "export const renderJson = JSON.stringify;",
    });

    // WHEN: The source graph is checked.
    const violations = await checkModuleBoundaries(sourceRoot);

    // THEN: Internal module organization remains unrestricted.
    assert.deepEqual(violations, []);
  });
});
