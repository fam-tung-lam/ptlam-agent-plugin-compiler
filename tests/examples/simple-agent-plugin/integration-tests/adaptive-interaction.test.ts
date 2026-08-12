import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
const requestHandler = path.join(
  exampleRoot,
  "hooks/handlers/adaptive-interaction/request.mjs",
);
const responseHandler = path.join(
  exampleRoot,
  "hooks/handlers/adaptive-interaction/response.mjs",
);

function dispatch(
  provider: string,
  lifecycle: "before-request" | "before-response",
  handler: string,
  input: Record<string, unknown>,
): Record<string, unknown> {
  const stdout = execFileSync(
    process.execPath,
    [dispatcher, provider, lifecycle, handler],
    { encoding: "utf8", input: JSON.stringify(input) },
  );
  return JSON.parse(stdout) as Record<string, unknown>;
}

function dispatchText(
  provider: string,
  lifecycle: "before-request" | "before-response",
  handler: string,
  input: Record<string, unknown>,
): string {
  return execFileSync(
    process.execPath,
    [dispatcher, provider, lifecycle, handler],
    { encoding: "utf8", input: JSON.stringify(input) },
  );
}

describe("adaptive interaction hook", () => {
  it("leaves a small deterministic request unchanged", async () => {
    // GIVEN: A user asks for one clear literal file operation.
    const input = { prompt: "Rename old-name.ts to new-name.ts." };

    // WHEN: Codex invokes the request handler through the portable runtime.
    const output = await dispatch(
      "codex",
      "before-request",
      requestHandler,
      input,
    );

    // THEN: No context or rewritten prompt is returned.
    assert.deepEqual(output, {});
  });

  it("enriches a complex request without replacing its intent", async () => {
    // GIVEN: A user asks for architecture, trade-off, and verification work.
    const input = {
      prompt:
        "Design a portable hook architecture, compare provider trade-offs, implement it, and verify drift behavior.",
      transformedPrompt: "ORIGINAL TRANSFORMED REQUEST",
    };

    // WHEN: Copilot invokes its prompt-mutation lifecycle through the dispatcher.
    const output = await dispatch(
      "copilot",
      "before-request",
      requestHandler,
      input,
    );

    // THEN: The original request remains intact and bounded adaptation context is appended.
    const transformed = output["modifiedTransformedPrompt"];
    assert.equal(typeof transformed, "string");
    assert.match(String(transformed), /^ORIGINAL TRANSFORMED REQUEST/u);
    assert.match(String(transformed), /Preserve the user's underlying intent/u);
    assert.doesNotMatch(String(transformed), /You are a/u);
  });

  it("requests one response revision for unrequested emojis and then self-limits", async () => {
    // GIVEN: A final draft contains an emoji the user did not request.
    const firstInput = {
      prompt: "Summarize the implementation.",
      last_assistant_message: "Done. ✅",
      stop_hook_active: false,
    };

    // WHEN: The response handler runs before and after its one allowed retry.
    const first = await dispatch(
      "codex",
      "before-response",
      responseHandler,
      firstInput,
    );
    const second = await dispatch("codex", "before-response", responseHandler, {
      ...firstInput,
      stop_hook_active: true,
    });

    // THEN: The first run asks for a precise revision and the retry is allowed through.
    assert.equal(first["decision"], "block");
    assert.match(String(first["reason"]), /remove unrequested emojis/u);
    assert.deepEqual(second, {});
  });

  it("uses Kimi's text context and structured blocking contracts", async () => {
    // GIVEN: Kimi receives a complex request but its Stop event omits draft text.
    const input = {
      prompt: "Design and verify a portable lifecycle architecture.",
    };

    // WHEN: Both adaptive stages cross the Kimi runtime boundary.
    const request = dispatchText(
      "kimi",
      "before-request",
      requestHandler,
      input,
    );
    const response = await dispatch(
      "kimi",
      "before-response",
      responseHandler,
      input,
    );

    // THEN: Context is plain stdout and the response pass uses Kimi's deny shape.
    assert.match(request, /Preserve the user's underlying intent/u);
    assert.deepEqual(response, {
      hookSpecificOutput: {
        permissionDecision: "deny",
        permissionDecisionReason:
          "Revise the final response once: the provider did not expose the draft, so perform one presentation pass. Preserve technical accuracy, required information, the user's requested format, and their apparent technical level. Prefer a diagram only for relationships or flows, otherwise a table for repeated comparisons, a list for grouped steps, or prose when structure adds no value.",
      },
    });
  });
});
