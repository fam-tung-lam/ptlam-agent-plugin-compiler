import {
  createProviderContext,
  type Plugin,
  type ProviderAdapter,
} from "../core/index.js";
import {
  readGeneratedSnapshot,
  readPluginSource,
  writePlan,
} from "../filesystem/index.js";
import { ProviderAdapterRegistry } from "../providers/index.js";
import { CompilerOptions, type CompilerOptionsInput } from "./options.js";
import { buildWritePlan, compareWritePlan } from "./planning/index.js";
import { compileSharedSkills } from "./rendering/index.js";
import {
  type CheckResult,
  type CompileResult,
  createCheckResult,
  createCompileResult,
  createValidateResult,
  type ValidateResult,
} from "./results.js";
import {
  PluginValidationError,
  type ValidateAuthoredPluginResult,
  validateAuthoredPlugin,
} from "./validation/index.js";

async function loadPlugin(
  rootDir: string,
): Promise<ValidateAuthoredPluginResult> {
  const snapshot = await readPluginSource(rootDir);
  const manifestUnavailable =
    snapshot.source.manifest === null &&
    snapshot.diagnostics.some(
      (diagnostic) => String(diagnostic.path) === "plugin/plugin.yml",
    );
  if (manifestUnavailable) {
    throw new PluginValidationError(
      snapshot.diagnostics.map((diagnostic) => diagnostic.message),
    );
  }

  let validation: ValidateAuthoredPluginResult | undefined;
  let domainErrors: readonly string[] = [];
  try {
    validation = validateAuthoredPlugin(snapshot.source);
  } catch (error) {
    if (!(error instanceof PluginValidationError)) throw error;
    domainErrors = error.errors;
  }

  const errors = [
    ...snapshot.diagnostics.map((diagnostic) => diagnostic.message),
    ...domainErrors,
  ];
  if (errors.length > 0) throw new PluginValidationError(errors);
  if (validation === undefined) {
    throw new Error("Plugin validation produced neither a result nor errors");
  }
  return validation;
}

async function buildPlan(
  plugin: Plugin,
  providers: readonly ProviderAdapter[],
) {
  const context = createProviderContext(plugin);
  const sharedSkills = await compileSharedSkills(plugin);
  const providerFragments = providers.map((provider) =>
    provider.compile(context),
  );
  return buildWritePlan({
    fragments: [sharedSkills, ...providerFragments],
  });
}

/**
 * Validates authored plugin sources and manages generated outputs for selected providers.
 *
 * One instance keeps a fixed repository, provider selection, and adapter registry. Use
 * {@link validate} for authored-source checks, {@link check} for a read-only generated-state
 * comparison, and {@link compile} to write and verify generated files.
 *
 * @example
 * ```ts
 * import {
 *   AgentPluginCompiler,
 *   CODEX,
 * } from "@fam-tung-lam/ptlam-agent-plugin-compiler";
 *
 * const compiler = new AgentPluginCompiler({
 *   rootDir: "/path/to/plugin",
 *   providers: [CODEX],
 * });
 * const result = await compiler.compile();
 * if (!result.verified) console.error(result.drift);
 * ```
 */
export class AgentPluginCompiler {
  private readonly options: CompilerOptions;
  private readonly providers: readonly ProviderAdapter[];

  /**
   * Creates a compiler with a fixed repository and provider selection.
   *
   * @param input - Repository path and provider IDs for this instance.
   * @param registry - Per-instance adapter registry; defaults to Claude and Codex adapters.
   * @throws {TypeError} If the repository path is empty or a selected provider is unknown or duplicated.
   */
  constructor(
    input: CompilerOptionsInput,
    registry = ProviderAdapterRegistry.withBuiltIns(),
  ) {
    this.options = new CompilerOptions(input);
    this.providers = registry.resolve(this.options.providers);
    Object.freeze(this);
  }

  /**
   * Reads and validates authored sources without inspecting generated outputs.
   *
   * @returns The immutable domain plugin and non-fatal warnings.
   * @throws {Error} If the repository cannot be read or authored sources are invalid.
   *
   * @example
   * ```ts
   * const { plugin, warnings } = await compiler.validate();
   * ```
   */
  async validate(): Promise<ValidateResult> {
    return createValidateResult(await loadPlugin(this.options.rootDir));
  }

  /**
   * Compares managed generated paths with the complete selected write plan without writing.
   *
   * @returns The validated plugin, warnings, current status, and deterministic drift.
   * @throws {Error} If sources or generated state cannot be read, validation fails, or a provider produces an invalid plan fragment.
   *
   * @example
   * ```ts
   * const result = await compiler.check();
   * if (!result.upToDate) console.log(result.drift);
   * ```
   */
  async check(): Promise<CheckResult> {
    const validation = await loadPlugin(this.options.rootDir);
    const plan = await buildPlan(validation.plugin, this.providers);
    const snapshot = await readGeneratedSnapshot(this.options.rootDir, plan);
    const drift = compareWritePlan({ plan, snapshot });
    return createCheckResult({ ...validation, drift });
  }

  /**
   * Applies the complete selected write plan and verifies it from a fresh filesystem snapshot.
   *
   * @returns The validated plugin, write facts, warnings, and post-write verification state.
   * @throws {Error} If validation, rendering, planning, filesystem writing, or verification cannot complete.
   *
   * @example
   * ```ts
   * const result = await compiler.compile();
   * console.log(result.writeResult.changedPaths);
   * ```
   */
  async compile(): Promise<CompileResult> {
    const validation = await loadPlugin(this.options.rootDir);
    const plan = await buildPlan(validation.plugin, this.providers);
    const writeResult = await writePlan(this.options.rootDir, plan);
    const snapshot = await readGeneratedSnapshot(this.options.rootDir, plan);
    const drift = compareWritePlan({ plan, snapshot });
    return createCompileResult({
      ...validation,
      writeResult,
      drift,
    });
  }
}
