import path from "node:path";

import {
  type ArtifactInput,
  ArtifactKind,
  createPlanFragment,
  createProjectPath,
  OwnershipKind,
  type PlanFragment,
  type Plugin,
  PluginSchemaVersion,
} from "../../core/index.js";

const HANDLERS_ROOT = createProjectPath("hooks/handlers");
const RUNTIME_PATH = "hooks/handlers/.runtime/portable-hook-dispatcher.mjs";

function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function collectDirectories(filePaths: Iterable<string>): string[] {
  const directories = new Set<string>(["hooks/handlers"]);
  for (const filePath of filePaths) {
    let directory = path.posix.dirname(filePath);
    while (directory === "hooks" || directory.startsWith("hooks/")) {
      if (directory !== "hooks") directories.add(directory);
      if (directory === "hooks") break;
      directory = path.posix.dirname(directory);
    }
  }
  return [...directories].sort(compareCodePoints);
}

/**
 * Portable runtime loaded by provider-native command hook definitions.
 *
 * It normalizes native event input, calls one authored handler, and maps the
 * provider-neutral result back to the selected host's output contract. Handler
 * failures deliberately fail open so presentation assistance cannot block work.
 */
export const PORTABLE_HOOK_DISPATCHER = `import { pathToFileURL } from "node:url";

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
`;

/**
 * Compile one shared handler tree reused by every compatible selected provider.
 *
 * @param plugin - Validated plugin with loaded authored hooks.
 * @returns The v2-owned complete tree, or `null` for a legacy v1 plugin.
 */
export function compileSharedHooks(plugin: Plugin): PlanFragment | null {
  if (plugin.schema_version === PluginSchemaVersion.V1) return null;

  const files = new Map<string, Buffer>();
  if (plugin.hooks.length > 0) {
    files.set(RUNTIME_PATH, Buffer.from(PORTABLE_HOOK_DISPATCHER));
    for (const resource of plugin.hook_resources) {
      const outputPath = `hooks/handlers/${resource.path}`;
      if (files.has(outputPath)) {
        throw new Error(`${outputPath}: duplicate generated hook resource`);
      }
      files.set(outputPath, resource.content);
    }
  }

  const artifacts: ArtifactInput[] = [
    ...collectDirectories(files.keys()).map((directory) => ({
      kind: ArtifactKind.Directory as const,
      path: createProjectPath(directory),
    })),
    ...[...files].map(([filePath, content]) => ({
      kind: ArtifactKind.File as const,
      path: createProjectPath(filePath),
      content,
    })),
  ];
  return createPlanFragment({
    ownerId: "shared-hooks",
    ownership: {
      kind: OwnershipKind.CompleteTree,
      root: HANDLERS_ROOT,
    },
    artifacts: artifacts.filter(
      (artifact) =>
        String(artifact.path) === String(HANDLERS_ROOT) ||
        String(artifact.path).startsWith(`${HANDLERS_ROOT}/`),
    ),
  });
}
