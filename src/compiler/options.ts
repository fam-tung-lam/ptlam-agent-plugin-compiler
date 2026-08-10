import type { ProviderId } from "../core/index.js";

/**
 * Selects the repository and provider adapters used by one compiler instance.
 *
 * @example
 * ```ts
 * import { CODEX, type CompilerOptionsInput } from "@fam-tung-lam/ptlam-agent-plugin-compiler";
 *
 * const options: CompilerOptionsInput = {
 *   rootDir: "/path/to/plugin",
 *   providers: [CODEX],
 * };
 * ```
 */
export interface CompilerOptionsInput {
  /** Absolute or relative path to the plugin repository. */
  readonly rootDir: string;
  /** Provider IDs to generate, in any order. */
  readonly providers: readonly ProviderId[];
}

/**
 * Immutable explicit scope for one compiler facade instance.
 * @internal
 */
export class CompilerOptions {
  /** Repository path supplied to the compiler. */
  readonly rootDir: string;
  /** Immutable snapshot of the selected provider IDs. */
  readonly providers: readonly ProviderId[];

  /**
   * @param input - Repository and provider selection to snapshot.
   * @throws {TypeError} If `rootDir` is empty.
   */
  constructor(input: CompilerOptionsInput) {
    if (input.rootDir.length === 0) {
      throw new TypeError("Compiler rootDir must not be empty");
    }
    this.rootDir = input.rootDir;
    this.providers = Object.freeze([...input.providers]);
    Object.freeze(this);
  }
}
