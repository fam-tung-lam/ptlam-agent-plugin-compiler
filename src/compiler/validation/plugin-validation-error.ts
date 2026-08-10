/** Reports all independent authored-source errors found by pure validation. */
export class PluginValidationError extends Error {
  /** Stable error class name. */
  override readonly name = "PluginValidationError";
  /** Deduplicated authored-source diagnostics in discovery order. */
  readonly errors: readonly string[];

  /**
   * @param errors - Authored-source diagnostics to normalize and snapshot.
   */
  constructor(errors: Iterable<string>) {
    const normalizedErrors = Object.freeze(
      [...new Set(errors)].filter(Boolean),
    );
    super(
      `Plugin validation failed with ${normalizedErrors.length} error${normalizedErrors.length === 1 ? "" : "s"}:\n${normalizedErrors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
    this.errors = normalizedErrors;
  }
}
