import type { ProviderId } from "../core/index.js";

/**
 * Selects the repository and optionally overrides its authored providers.
 *
 * @example
 * ```ts
 * import { CODEX, type CompilerOptionsInput } from "@fam-tung-lam/ptlam-agent-plugin-compiler";
 *
 * const options: CompilerOptionsInput = {
 *   rootDir: "/path/to/plugin",
 *   providers: [CODEX], // Omit to use plugin/plugin.yml.
 * };
 * ```
 */
export interface CompilerOptionsInput {
  /** Absolute or relative path to the plugin repository. */
  readonly rootDir: string;
  /** Provider IDs that replace the authored manifest selection when present. */
  readonly providers?: readonly ProviderId[];
}

/**
 * Immutable repository and optional provider override for one compiler facade.
 * @internal
 */
export class CompilerOptions {
  /** Repository path supplied to the compiler. */
  readonly rootDir: string;
  /** Immutable explicit provider override, or `undefined` to use the manifest. */
  readonly providers: readonly ProviderId[] | undefined;

  /**
   * @param input - Repository and optional provider override to snapshot.
   * @throws {TypeError} If `rootDir` is empty.
   */
  constructor(input: CompilerOptionsInput) {
    if (input.rootDir.length === 0) {
      throw new TypeError("Compiler rootDir must not be empty");
    }
    this.rootDir = input.rootDir;
    this.providers =
      input.providers === undefined
        ? undefined
        : Object.freeze([...input.providers]);
    Object.freeze(this);
  }
}
