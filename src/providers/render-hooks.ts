import { type Hook, HookLifecycle, type Plugin } from "../core/index.js";

const dispatcher = "hooks/handlers/.runtime/portable-hook-dispatcher.mjs";
const extensionPath = `\${extensionPath}`;
const pluginRoot = `\${PLUGIN_ROOT}`;

interface HookInvocation {
  readonly hook: Hook;
  readonly lifecycle: HookLifecycle;
  readonly command: string;
}

function invocations(
  plugin: Plugin,
  provider: string,
  pluginRoot: string,
): readonly HookInvocation[] {
  return Object.freeze(
    plugin.hooks.flatMap((hook) =>
      hook.bindings.map((binding) => ({
        hook,
        lifecycle: binding.lifecycle,
        command: `node "${pluginRoot}/${dispatcher}" ${provider} ${binding.lifecycle} "${pluginRoot}/hooks/handlers/${hook.id}/${binding.handler}"`,
      })),
    ),
  );
}

function appendEvent(
  events: Record<string, unknown[]>,
  event: string,
  value: unknown,
): void {
  const values = events[event] ?? [];
  values.push(value);
  events[event] = values;
}

/** Render Claude/Codex nested command-hook configuration. */
export function renderNestedHookConfiguration({
  plugin,
  provider,
  pluginRoot,
  requestEvent,
  responseEvent,
}: {
  readonly plugin: Plugin;
  readonly provider: string;
  readonly pluginRoot: string;
  readonly requestEvent: string;
  readonly responseEvent: string;
}): Record<string, unknown> {
  const hooks: Record<string, unknown[]> = {};
  for (const invocation of invocations(plugin, provider, pluginRoot)) {
    const event =
      invocation.lifecycle === HookLifecycle.BeforeRequest
        ? requestEvent
        : responseEvent;
    appendEvent(hooks, event, {
      hooks: [
        {
          type: "command",
          command: invocation.command,
          timeout: 10,
          statusMessage:
            invocation.lifecycle === HookLifecycle.BeforeRequest
              ? "Running request hook"
              : "Running response hook",
        },
      ],
    });
  }
  return { hooks };
}

/** Render Gemini CLI extension hook configuration. */
export function renderGeminiHookConfiguration(
  plugin: Plugin,
): Record<string, unknown> {
  const hooks: Record<string, unknown[]> = {};
  for (const invocation of invocations(plugin, "gemini", extensionPath)) {
    const event =
      invocation.lifecycle === HookLifecycle.BeforeRequest
        ? "BeforeAgent"
        : "AfterAgent";
    appendEvent(hooks, event, {
      hooks: [
        {
          name: `${invocation.hook.id}-${invocation.lifecycle}`,
          type: "command",
          command: invocation.command,
          timeout: 10000,
        },
      ],
    });
  }
  return { hooks };
}

/** Render GitHub Copilot CLI flat command-hook configuration. */
export function renderCopilotHookConfiguration(
  plugin: Plugin,
): Record<string, unknown> {
  const hooks: Record<string, unknown[]> = {};
  for (const invocation of invocations(plugin, "copilot", pluginRoot)) {
    const event =
      invocation.lifecycle === HookLifecycle.BeforeRequest
        ? "userPromptTransformed"
        : "agentStop";
    appendEvent(hooks, event, {
      type: "command",
      command: invocation.command,
      timeoutSec: 10,
    });
  }
  return { version: 1, hooks };
}

/** Render Kimi Code CLI manifest-inline command hooks. */
export function renderKimiHooks(plugin: Plugin): readonly unknown[] {
  return Object.freeze(
    invocations(plugin, "kimi", ".").map((invocation) => ({
      event:
        invocation.lifecycle === HookLifecycle.BeforeRequest
          ? "UserPromptSubmit"
          : "Stop",
      command: invocation.command,
      timeout: 10,
    })),
  );
}
