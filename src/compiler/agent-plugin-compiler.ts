import {
  createPlanFragment,
  createProviderContext,
  OwnershipKind,
  type Plugin,
  PluginSchemaVersion,
  type ProviderAdapter,
  type ProviderId,
  type UniversalHookEvent,
} from "../core/index.js";
import {
  initializePluginSource,
  readGeneratedSnapshot,
  readPluginSource,
  writePlan,
} from "../filesystem/index.js";
import { ProviderAdapterRegistry } from "../providers/index.js";
import { CompilerOptions, type CompilerOptionsInput } from "./options.js";
import { buildWritePlan, compareWritePlan } from "./planning/index.js";
import { compileSharedHooks, compileSharedSkills } from "./rendering/index.js";
import {
  type CheckResult,
  type CompileResult,
  createCheckResult,
  createCompileResult,
  createInitResult,
  createValidateResult,
  type HookDiagnostic,
  HookDiagnosticReason,
  HookDiagnosticStatus,
  type InitResult,
  type ProviderSelectionSource,
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
  registry: ProviderAdapterRegistry,
  selectedProviders: readonly ProviderId[],
) {
  const sharedSkills = await compileSharedSkills(plugin);
  const selected = new Set<string>(selectedProviders);
  const providerFragments = registry.list().map((provider) => {
    const providerContext = createProviderContext(
      filterPluginHooks(plugin, provider.supportedHookEvents ?? []),
    );
    const fragment = provider.compile(providerContext);
    if (fragment.ownership.kind !== OwnershipKind.ExactFiles) {
      throw new TypeError(
        `Provider adapter ${JSON.stringify(provider.id)} must declare exact-file ownership`,
      );
    }
    return selected.has(provider.id)
      ? fragment
      : createPlanFragment({
          ownerId: fragment.ownerId,
          ownership: fragment.ownership,
          artifacts: [],
        });
  });
  const selectedEvents = new Set(
    registry
      .resolve(selectedProviders)
      .flatMap((provider) => provider.supportedHookEvents ?? []),
  );
  const sharedHooks =
    plugin.schema_version === PluginSchemaVersion.V2
      ? compileSharedHooks(filterPluginHooks(plugin, selectedEvents))
      : null;
  return buildWritePlan({
    fragments: [
      sharedSkills,
      ...(sharedHooks === null ? [] : [sharedHooks]),
      ...providerFragments,
    ],
  });
}

function filterPluginHooks(
  plugin: Plugin,
  supportedEvents: Iterable<UniversalHookEvent>,
): Plugin {
  const supported = new Set(supportedEvents);
  return Object.freeze({
    ...plugin,
    hooks: Object.freeze(
      plugin.hooks.flatMap((hook) => {
        const bindings = hook.bindings.filter((binding) =>
          supported.has(binding.event),
        );
        return bindings.length === 0
          ? []
          : [Object.freeze({ ...hook, bindings: Object.freeze(bindings) })];
      }),
    ),
  });
}

function providerSupportsEvent(
  provider: ProviderAdapter,
  event: UniversalHookEvent,
): boolean {
  return provider.supportedHookEvents?.includes(event) === true;
}

interface ProviderSelection {
  readonly providers: readonly ProviderId[];
  readonly providerSelectionSource: ProviderSelectionSource;
  readonly hookDiagnostics: readonly HookDiagnostic[];
}

function resolveProviderSelection(
  plugin: Plugin,
  override: readonly ProviderId[] | undefined,
  registry: ProviderAdapterRegistry,
): ProviderSelection {
  const requested = override ?? plugin.providers;
  const adapters = registry.resolve(requested);
  const hookDiagnostics: HookDiagnostic[] = [];
  for (const provider of adapters) {
    for (const hook of plugin.hooks) {
      for (const binding of hook.bindings) {
        hookDiagnostics.push(
          providerSupportsEvent(provider, binding.event)
            ? {
                provider: provider.id,
                hook: hook.id,
                event: binding.event,
                status: HookDiagnosticStatus.Generated,
              }
            : {
                provider: provider.id,
                hook: hook.id,
                event: binding.event,
                status: HookDiagnosticStatus.Skipped,
                reason: HookDiagnosticReason.ProviderDoesNotSupportHookEvent,
              },
        );
      }
    }
  }
  return Object.freeze({
    providers: Object.freeze(adapters.map((provider) => provider.id)),
    providerSelectionSource: override === undefined ? "manifest" : "override",
    hookDiagnostics: Object.freeze(
      hookDiagnostics.map((diagnostic) => Object.freeze(diagnostic)),
    ),
  });
}

/**
 * Validates authored plugin sources and reconciles generated provider outputs.
 *
 * One instance keeps a fixed repository, optional provider override, and adapter registry. Use
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
  private readonly registry: ProviderAdapterRegistry;

  /**
   * Creates a compiler with a fixed repository and optional provider override.
   *
   * @param input - Repository path and optional provider IDs for this instance.
   * @param registry - Per-instance adapter registry; defaults to all built-in adapters.
   * @throws {TypeError} If the repository path is empty.
   */
  constructor(
    input: CompilerOptionsInput,
    registry = ProviderAdapterRegistry.withBuiltIns(),
  ) {
    this.options = new CompilerOptions(input);
    this.registry = registry;
    Object.freeze(this);
  }

  /**
   * Creates the minimal authored source layout without replacing existing paths.
   *
   * @returns Paths created or left unchanged by initialization.
   * @throws {Error} If the repository cannot be inspected or a path has the wrong kind.
   *
   * @example
   * ```ts
   * const result = await compiler.init();
   * console.log(result.createdPaths);
   * ```
   */
  async init(): Promise<InitResult> {
    const result = await initializePluginSource(this.options.rootDir);
    return createInitResult({ ...result, warnings: [] });
  }

  /**
   * Reads and validates authored sources without inspecting generated outputs.
   *
   * @returns The immutable plugin, effective providers, selection source, and warnings.
   * @throws {Error} If the repository cannot be read or authored sources are invalid.
   *
   * @example
   * ```ts
   * const { plugin, warnings } = await compiler.validate();
   * ```
   */
  async validate(): Promise<ValidateResult> {
    const validation = await loadPlugin(this.options.rootDir);
    const selection = resolveProviderSelection(
      validation.plugin,
      this.options.providers,
      this.registry,
    );
    return createValidateResult({ ...validation, ...selection });
  }

  /**
   * Compares managed generated paths with the complete selected write plan without writing.
   *
   * @returns The plugin, effective selection, warnings, current status, and deterministic drift.
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
    const selection = resolveProviderSelection(
      validation.plugin,
      this.options.providers,
      this.registry,
    );
    const plan = await buildPlan(
      validation.plugin,
      this.registry,
      selection.providers,
    );
    const snapshot = await readGeneratedSnapshot(this.options.rootDir, plan);
    const drift = compareWritePlan({ plan, snapshot });
    return createCheckResult({ ...validation, ...selection, drift });
  }

  /**
   * Applies the complete selected write plan and verifies it from a fresh filesystem snapshot.
   *
   * @returns The plugin, effective selection, write facts, warnings, and verification state.
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
    const selection = resolveProviderSelection(
      validation.plugin,
      this.options.providers,
      this.registry,
    );
    const plan = await buildPlan(
      validation.plugin,
      this.registry,
      selection.providers,
    );
    const writeResult = await writePlan(this.options.rootDir, plan);
    const snapshot = await readGeneratedSnapshot(this.options.rootDir, plan);
    const drift = compareWritePlan({ plan, snapshot });
    return createCompileResult({
      ...validation,
      ...selection,
      writeResult,
      drift,
    });
  }
}
