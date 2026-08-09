import {
  buildOutputPlan,
  compareOutputPlan,
  compileSharedSkills,
  PluginValidationError,
  type ValidateAuthoredPluginResult,
  type ValidatedPlugin,
  validateAuthoredPlugin,
} from "../core/index.js";
import {
  readOutputState,
  readPluginSource,
  writeOutputPlan,
} from "../filesystem/index.js";
import {
  type CompilerProvider,
  createProviderContext,
  resolveProviders,
} from "../providers/index.js";
import {
  CompilerOptions,
  type CompilerOptionsInput,
} from "./models/compiler-options.js";
import {
  type CheckResult,
  type CompileResult,
  createCheckResult,
  createCompileResult,
  createValidateResult,
  type ValidateResult,
} from "./models/operation-results.js";

async function loadValidatedPlugin(
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
  let coreErrors: readonly string[] = [];
  try {
    validation = validateAuthoredPlugin(snapshot.source);
  } catch (error) {
    if (!(error instanceof PluginValidationError)) throw error;
    coreErrors = error.errors;
  }

  const errors = [
    ...snapshot.diagnostics.map((diagnostic) => diagnostic.message),
    ...coreErrors,
  ];
  if (errors.length > 0) throw new PluginValidationError(errors);
  if (validation === undefined) {
    throw new Error("Plugin validation produced neither a result nor errors");
  }
  return validation;
}

async function buildPlan(
  plugin: ValidatedPlugin,
  providers: readonly CompilerProvider[],
) {
  const context = createProviderContext(plugin);
  const sharedSkills = await compileSharedSkills(plugin);
  const providerFragments = providers.map((provider) =>
    provider.compile(context),
  );
  return buildOutputPlan({
    fragments: [sharedSkills, ...providerFragments],
  });
}

/** Orchestrate validation, read-only checking, and verified compilation. */
export class AgentPluginCompiler {
  private readonly options: CompilerOptions;
  private readonly providers: readonly CompilerProvider[];

  constructor(input: CompilerOptionsInput) {
    this.options = new CompilerOptions(input);
    this.providers = resolveProviders(this.options.providers);
    Object.freeze(this);
  }

  /** Read and validate authored sources without inspecting compiled outputs. */
  async validate(): Promise<ValidateResult> {
    return createValidateResult(
      await loadValidatedPlugin(this.options.rootDir),
    );
  }

  /** Compare the complete selected output plan without writing. */
  async check(): Promise<CheckResult> {
    const validation = await loadValidatedPlugin(this.options.rootDir);
    const plan = await buildPlan(validation.plugin, this.providers);
    const state = await readOutputState(this.options.rootDir, plan);
    const differences = compareOutputPlan({ plan, state });
    return createCheckResult({ ...validation, differences });
  }

  /** Write one validated plan, reread it, and report post-write verification. */
  async compile(): Promise<CompileResult> {
    const validation = await loadValidatedPlugin(this.options.rootDir);
    const plan = await buildPlan(validation.plugin, this.providers);
    const writeResult = await writeOutputPlan(this.options.rootDir, plan);
    const state = await readOutputState(this.options.rootDir, plan);
    const differences = compareOutputPlan({ plan, state });
    return createCompileResult({
      ...validation,
      writeResult,
      differences,
    });
  }
}
