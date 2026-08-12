import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it } from "vitest";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../examples/simple-agent-plugin",
);
const dispatcher = path.join(
  exampleRoot,
  "hooks/handlers/.runtime/portable-hook-dispatcher.mjs",
);

function dispatch(
  lifecycle: "before-request" | "before-response",
  handlerName: "request.mjs" | "response.mjs",
  input: Record<string, unknown>,
) {
  return spawnSync(
    process.execPath,
    [
      dispatcher,
      "codex",
      lifecycle,
      path.join(exampleRoot, "hooks/handlers/simple-logger", handlerName),
    ],
    { encoding: "utf8", input: JSON.stringify(input) },
  );
}

describe("simple logger hook", () => {
  it("logs a request and lets it continue unchanged", () => {
    // GIVEN: A provider sends a user request to the example hook.
    const prompt = "Rename old-name.ts to new-name.ts.";

    // WHEN: The request crosses the portable dispatcher.
    const result = dispatch("before-request", "request.mjs", { prompt });

    // THEN: The hook logs the request and returns an empty pass-through output.
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "{}");
    assert.match(result.stderr, /\[simple-logger\] request: Rename old-name/u);
  });

  it("logs a response and lets it continue unchanged", () => {
    // GIVEN: A provider sends a final response to the example hook.
    const response = "Renamed the file.";

    // WHEN: The response crosses the portable dispatcher.
    const result = dispatch("before-response", "response.mjs", {
      last_assistant_message: response,
    });

    // THEN: The hook logs the response and returns an empty pass-through output.
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "{}");
    assert.match(
      result.stderr,
      /\[simple-logger\] response: Renamed the file/u,
    );
  });
});
