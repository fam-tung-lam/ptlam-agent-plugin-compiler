import { pathToFileURL } from "node:url";

async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const source = Buffer.concat(chunks).toString("utf8").trim();
  return source === "" ? {} : JSON.parse(source);
}

function normalizedContext(provider, event, input) {
  return Object.freeze({
    provider,
    event,
    input: Object.freeze({ ...input }),
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
    return result ?? {};
  }
  const additionalContext = result.additionalContext.trim();
  if (provider === "kimi") return additionalContext;
  if (provider === "copilot") return result;
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
    return result ?? {};
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
  const [, , provider, event, handlerPath] = process.argv;
  if (!provider || !event || !handlerPath) throw new Error("Missing dispatcher arguments");
  const input = await readInput();
  const handlerModule = await import(pathToFileURL(handlerPath).href);
  if (typeof handlerModule.handle !== "function") {
    throw new TypeError("Hook handler must export an async handle(context) function");
  }
  const result = await handlerModule.handle(normalizedContext(provider, event, input));
  const output = event === "userPromptSubmit"
    ? requestOutput(provider, input, result)
    : event === "stop"
      ? responseOutput(provider, result)
      : result ?? {};
  process.stdout.write(typeof output === "string" ? output : JSON.stringify(output));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.stdout.write("{}");
}
