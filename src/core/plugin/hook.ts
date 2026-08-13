import type { ProjectPath } from "../identifiers.js";

/** Provider-neutral hook events supported by the schema-v2 contract. */
export enum UniversalHookEvent {
  SessionStart = "sessionStart",
  SessionEnd = "sessionEnd",
  UserPromptSubmit = "userPromptSubmit",
  UserPromptExpansion = "userPromptExpansion",
  PreToolUse = "preToolUse",
  PostToolUse = "postToolUse",
  PostToolUseFailure = "postToolUseFailure",
  PermissionRequest = "permissionRequest",
  PermissionDenied = "permissionDenied",
  SubagentStart = "subagentStart",
  SubagentStop = "subagentStop",
  PreCompact = "preCompact",
  PostCompact = "postCompact",
  Stop = "stop",
  StopFailure = "stopFailure",
  Notification = "notification",
  FileChanged = "fileChanged",
  CwdChanged = "cwdChanged",
  Setup = "setup",
}

/** One handler registered under a universal event in the authored manifest. */
export interface HookHandler {
  /** Path to an ES module relative to `plugin/hooks/`. */
  readonly handler: ProjectPath;
}

/** Event-keyed authored hook declarations. */
export type HookManifest = Readonly<
  Partial<Record<UniversalHookEvent, readonly HookHandler[]>>
>;

/** One normalized universal-event-to-handler registration. */
export interface HookRegistration extends HookHandler {
  /** Provider-neutral event whose native equivalent invokes the handler. */
  readonly event: UniversalHookEvent;
}

/** Mutable-input form of a normalized hook registration. */
export type HookInput = HookRegistration;

/** Immutable normalized hook registration used by providers. */
export type Hook = HookRegistration;

/** Mutable-input form of one authored hook resource. */
export interface HookResourceInput {
  /** Path relative to `plugin/hooks/`. */
  readonly path: ProjectPath;
  /** Resource bytes copied into the immutable plugin model. */
  readonly content: Uint8Array;
}

/** Immutable authored hook resource. */
export interface HookResource {
  /** Path relative to `plugin/hooks/`. */
  readonly path: ProjectPath;
  /** A fresh copy of resource bytes on every read. */
  readonly content: Buffer;
}

/** Create one immutable normalized hook registration. */
export function createHook(input: HookInput): Hook {
  return Object.freeze({ ...input });
}

/** Create one immutable hook resource with defensive byte copies. */
export function createHookResource(input: HookResourceInput): HookResource {
  const bytes = Buffer.from(input.content);
  return Object.freeze({
    path: input.path,
    get content(): Buffer {
      return Buffer.from(bytes);
    },
  });
}
