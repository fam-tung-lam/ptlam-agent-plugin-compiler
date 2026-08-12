import { pathToFileURL } from "node:url";

async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const source = Buffer.concat(chunks).toString("utf8").trim();
  return source === "" ? {} : JSON.parse(source);
}

function normalizedContext(lifecycle, input) {
  return Object.freeze({
    lifecycle,
    prompt: input.prompt ?? input.transformedPrompt ?? input.transformed_prompt,
    response:
      input.last_assistant_message ??
      input.prompt_response ??
      input.response ??
      input.modifiedResponse,
    retry: Boolean(input.stop_hook_active),
  });
}

function requestOutput(provider, input, result) {
  if (typeof result?.additionalContext !== "string" || result.additionalContext.trim() === "") {
    return provider === "kimi" ? "" : {};
  }
  const additionalContext = result.additionalContext.trim();
  if (provider === "kimi") return additionalContext;
  if (provider === "copilot") {
    const original = input.transformedPrompt ?? input.transformed_prompt ?? input.prompt ?? "";
    return {
      modifiedTransformedPrompt:
        original + "\n\n<portable-hook-context>\n" +
        additionalContext +
        "\n</portable-hook-context>",
    };
  }
  return {
    hookSpecificOutput: {
      ...(provider === "claude" || provider === "codex"
        ? { hookEventName: "UserPromptSubmit" }
        : { hookEventName: "BeforeAgent" }),
      additionalContext,
    },
  };
}

function responseOutput(provider, result) {
  if (result?.retry !== true || typeof result.reason !== "string" || result.reason.trim() === "") {
    return {};
  }
  if (provider === "kimi") {
    return {
      hookSpecificOutput: {
        permissionDecision: "deny",
        permissionDecisionReason: result.reason.trim(),
      },
    };
  }
  return {
    decision: provider === "gemini" ? "deny" : "block",
    reason: result.reason.trim(),
  };
}

async function main() {
  const [, , provider, lifecycle, handlerPath] = process.argv;
  if (!provider || !lifecycle || !handlerPath) throw new Error("Missing dispatcher arguments");
  const input = await readInput();
  const handlerModule = await import(pathToFileURL(handlerPath).href);
  if (typeof handlerModule.handle !== "function") {
    throw new TypeError("Hook handler must export an async handle(context) function");
  }
  const result = await handlerModule.handle(normalizedContext(lifecycle, input));
  const output = lifecycle === "before-request"
    ? requestOutput(provider, input, result)
    : responseOutput(provider, result);
  process.stdout.write(typeof output === "string" ? output : JSON.stringify(output));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.stdout.write("{}");
}
