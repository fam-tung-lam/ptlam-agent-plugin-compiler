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

/** Orchestrate validation, read-only checking, and verified compilation. */
export class AgentPluginCompiler {
  private readonly options: CompilerOptions;
  private readonly providers: readonly ProviderAdapter[];

  constructor(
    input: CompilerOptionsInput,
    registry = ProviderAdapterRegistry.withBuiltIns(),
  ) {
    this.options = new CompilerOptions(input);
    this.providers = registry.resolve(this.options.providers);
    Object.freeze(this);
  }

  /** Read and validate authored sources without inspecting compiled outputs. */
  async validate(): Promise<ValidateResult> {
    return createValidateResult(await loadPlugin(this.options.rootDir));
  }

  /** Compare the complete selected write plan without writing. */
  async check(): Promise<CheckResult> {
    const validation = await loadPlugin(this.options.rootDir);
    const plan = await buildPlan(validation.plugin, this.providers);
    const snapshot = await readGeneratedSnapshot(this.options.rootDir, plan);
    const drift = compareWritePlan({ plan, snapshot });
    return createCheckResult({ ...validation, drift });
  }

  /** Write one validated plan, reread it, and report post-write verification. */
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
