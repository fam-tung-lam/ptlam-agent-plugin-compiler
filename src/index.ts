/**
 * Public Node API for validating and compiling PTLam-compatible agent plugins.
 *
 * Create an {@link AgentPluginCompiler} for the common workflow. Implement
 * {@link ProviderAdapter} and register it with {@link ProviderAdapterRegistry}
 * when a host needs an additional generated output contract.
 *
 * @example
 * ```ts
 * import {
 *   AgentPluginCompiler,
 *   CODEX,
 * } from "@fam-tung-lam/ptlam-agent-plugin-compiler";
 *
 * const fromManifest = new AgentPluginCompiler({ rootDir: process.cwd() });
 * const codexOnly = new AgentPluginCompiler({
 *   rootDir: process.cwd(),
 *   providers: [CODEX],
 * });
 * const sharedOnly = new AgentPluginCompiler({
 *   rootDir: process.cwd(),
 *   providers: [],
 * });
 * const result = await fromManifest.check();
 * console.log(result.providers, result.providerSelectionSource);
 * void [codexOnly, sharedOnly];
 * ```
 *
 * @packageDocumentation
 */
export type {
  CheckResult,
  CompileResult,
  CompilerOptionsInput,
  HookDiagnostic,
  InitResult,
  ProviderSelectionSource,
  ValidateResult,
} from "./compiler/index.js";
export {
  AgentPluginCompiler,
  HookDiagnosticReason,
  HookDiagnosticStatus,
} from "./compiler/index.js";
export type {
  Artifact,
  Hook,
  HookHandler,
  HookManifest,
  HookRegistration,
  Ownership,
  PlanFragment,
  PlanFragmentInput,
  Plugin,
  PluginManifest,
  ProjectPath,
  ProviderAdapter,
  ProviderContext,
  ProviderId,
} from "./core/index.js";
export {
  ArtifactKind,
  CLAUDE,
  CODEX,
  COPILOT,
  createPlanFragment,
  createProjectPath,
  createProviderId,
  GEMINI,
  KIMI,
  OwnershipKind,
  PluginSchemaVersion,
  UniversalHookEvent,
} from "./core/index.js";
export {
  ClaudeProviderAdapter,
  CodexProviderAdapter,
  CopilotProviderAdapter,
  GeminiProviderAdapter,
  KimiProviderAdapter,
  ProviderAdapterRegistry,
} from "./providers/index.js";
