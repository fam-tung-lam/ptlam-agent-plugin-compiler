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
 * const compiler = new AgentPluginCompiler({
 *   rootDir: process.cwd(),
 *   providers: [CODEX],
 * });
 * const result = await compiler.check();
 * ```
 *
 * @packageDocumentation
 */
export type {
  CheckResult,
  CompileResult,
  CompilerOptionsInput,
  ValidateResult,
} from "./compiler/index.js";
export { AgentPluginCompiler } from "./compiler/index.js";
export type {
  Artifact,
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
  createPlanFragment,
  createProjectPath,
  createProviderId,
  OwnershipKind,
} from "./core/index.js";
export {
  ClaudeProviderAdapter,
  CodexProviderAdapter,
  ProviderAdapterRegistry,
} from "./providers/index.js";
