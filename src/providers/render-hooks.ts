import { type Hook, type Plugin, UniversalHookEvent } from "../core/index.js";

const dispatcher = "hooks/handlers/.runtime/portable-hook-dispatcher.mjs";
const extensionPath = `\${extensionPath}`;
const pluginRoot = `\${PLUGIN_ROOT}`;

type NativeHookEventMap = Readonly<Partial<Record<UniversalHookEvent, string>>>;

const universalHookEvents = Object.freeze(Object.values(UniversalHookEvent));

function pascalCase(event: UniversalHookEvent): string {
  return `${event[0]?.toUpperCase()}${event.slice(1)}`;
}

/** Claude and Codex use the universal vocabulary with PascalCase keys. */
export const NESTED_HOOK_EVENT_MAP: NativeHookEventMap = Object.freeze(
  Object.fromEntries(
    universalHookEvents.map((event) => [event, pascalCase(event)]),
  ),
);

/** Native GitHub Copilot events with equivalent universal semantics. */
export const COPILOT_HOOK_EVENT_MAP: NativeHookEventMap = Object.freeze({
  [UniversalHookEvent.SessionStart]: "sessionStart",
  [UniversalHookEvent.SessionEnd]: "sessionEnd",
  [UniversalHookEvent.UserPromptSubmit]: "userPromptSubmitted",
  [UniversalHookEvent.PreToolUse]: "preToolUse",
  [UniversalHookEvent.PostToolUse]: "postToolUse",
  [UniversalHookEvent.PostToolUseFailure]: "postToolUseFailure",
  [UniversalHookEvent.PermissionRequest]: "permissionRequest",
  [UniversalHookEvent.SubagentStart]: "subagentStart",
  [UniversalHookEvent.SubagentStop]: "subagentStop",
  [UniversalHookEvent.PreCompact]: "preCompact",
  [UniversalHookEvent.Stop]: "agentStop",
  [UniversalHookEvent.Notification]: "notification",
});

/** Native Gemini CLI events with equivalent universal semantics. */
export const GEMINI_HOOK_EVENT_MAP: NativeHookEventMap = Object.freeze({
  [UniversalHookEvent.SessionStart]: "SessionStart",
  [UniversalHookEvent.SessionEnd]: "SessionEnd",
  [UniversalHookEvent.UserPromptSubmit]: "BeforeAgent",
  [UniversalHookEvent.PreToolUse]: "BeforeTool",
  [UniversalHookEvent.PostToolUse]: "AfterTool",
  [UniversalHookEvent.PreCompact]: "PreCompress",
  [UniversalHookEvent.Stop]: "AfterAgent",
  [UniversalHookEvent.Notification]: "Notification",
});

/** Native Kimi Code events with equivalent universal semantics. */
export const KIMI_HOOK_EVENT_MAP: NativeHookEventMap = Object.freeze({
  [UniversalHookEvent.SessionStart]: "SessionStart",
  [UniversalHookEvent.SessionEnd]: "SessionEnd",
  [UniversalHookEvent.UserPromptSubmit]: "UserPromptSubmit",
  [UniversalHookEvent.PreToolUse]: "PreToolUse",
  [UniversalHookEvent.PostToolUse]: "PostToolUse",
  [UniversalHookEvent.PostToolUseFailure]: "PostToolUseFailure",
  [UniversalHookEvent.PermissionRequest]: "PermissionRequest",
  [UniversalHookEvent.SubagentStart]: "SubagentStart",
  [UniversalHookEvent.SubagentStop]: "SubagentStop",
  [UniversalHookEvent.PreCompact]: "PreCompact",
  [UniversalHookEvent.PostCompact]: "PostCompact",
  [UniversalHookEvent.Stop]: "Stop",
  [UniversalHookEvent.StopFailure]: "StopFailure",
  [UniversalHookEvent.Notification]: "Notification",
});

/** Return universal events supported by one immutable native mapping. */
export function supportedHookEvents(
  events: NativeHookEventMap,
): readonly UniversalHookEvent[] {
  return Object.freeze(
    universalHookEvents.filter((event) => events[event] !== undefined),
  );
}

interface HookInvocation {
  readonly hook: Hook;
  readonly event: UniversalHookEvent;
  readonly nativeEvent: string;
  readonly matcher?: string;
  readonly command: string;
}

function invocations(
  plugin: Plugin,
  provider: string,
  pluginRoot: string,
  eventMap: NativeHookEventMap,
): readonly HookInvocation[] {
  return Object.freeze(
    plugin.hooks.flatMap((hook) =>
      hook.bindings.flatMap((binding) => {
        const nativeEvent = eventMap[binding.event];
        return nativeEvent === undefined
          ? []
          : [
              {
                hook,
                event: binding.event,
                nativeEvent,
                ...(binding.matcher === undefined
                  ? {}
                  : { matcher: binding.matcher }),
                command: `node "${pluginRoot}/${dispatcher}" ${provider} ${binding.event} "${pluginRoot}/hooks/handlers/${hook.id}/${binding.handler}"`,
              },
            ];
      }),
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

/** Whether a plugin contains at least one binding supported by a native map. */
export function hasMappedHookBindings(
  plugin: Plugin,
  eventMap: NativeHookEventMap,
): boolean {
  return plugin.hooks.some((hook) =>
    hook.bindings.some((binding) => eventMap[binding.event] !== undefined),
  );
}

/** Render Claude/Codex nested command-hook configuration. */
export function renderNestedHookConfiguration({
  plugin,
  provider,
  pluginRoot,
}: {
  readonly plugin: Plugin;
  readonly provider: string;
  readonly pluginRoot: string;
}): Record<string, unknown> {
  const hooks: Record<string, unknown[]> = {};
  for (const invocation of invocations(
    plugin,
    provider,
    pluginRoot,
    NESTED_HOOK_EVENT_MAP,
  )) {
    appendEvent(hooks, invocation.nativeEvent, {
      ...(invocation.matcher === undefined
        ? {}
        : { matcher: invocation.matcher }),
      hooks: [
        {
          type: "command",
          command: invocation.command,
          timeout: 10,
          statusMessage: `Running ${invocation.event} hook`,
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
  for (const invocation of invocations(
    plugin,
    "gemini",
    extensionPath,
    GEMINI_HOOK_EVENT_MAP,
  )) {
    appendEvent(hooks, invocation.nativeEvent, {
      ...(invocation.matcher === undefined
        ? {}
        : { matcher: invocation.matcher }),
      hooks: [
        {
          name: `${invocation.hook.id}-${invocation.event}`,
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
  for (const invocation of invocations(
    plugin,
    "copilot",
    pluginRoot,
    COPILOT_HOOK_EVENT_MAP,
  )) {
    appendEvent(hooks, invocation.nativeEvent, {
      type: "command",
      command: invocation.command,
      ...(invocation.matcher === undefined
        ? {}
        : { matcher: invocation.matcher }),
      timeoutSec: 10,
    });
  }
  return { version: 1, hooks };
}

/** Render Kimi Code CLI manifest-inline command hooks. */
export function renderKimiHooks(plugin: Plugin): readonly unknown[] {
  return Object.freeze(
    invocations(plugin, "kimi", ".", KIMI_HOOK_EVENT_MAP).map((invocation) => ({
      event: invocation.nativeEvent,
      ...(invocation.matcher === undefined
        ? {}
        : { matcher: invocation.matcher }),
      command: invocation.command,
      timeout: 10,
    })),
  );
}
