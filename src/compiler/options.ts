import type { ProviderId } from "../core/index.js";

export interface CompilerOptionsInput {
  readonly rootDir: string;
  readonly providers: readonly ProviderId[];
}

/**
 * Immutable explicit scope for one compiler facade instance.
 * @internal
 */
export class CompilerOptions {
  readonly rootDir: string;
  readonly providers: readonly ProviderId[];

  constructor(input: CompilerOptionsInput) {
    if (input.rootDir.length === 0) {
      throw new TypeError("Compiler rootDir must not be empty");
    }
    this.rootDir = input.rootDir;
    this.providers = Object.freeze([...input.providers]);
    Object.freeze(this);
  }
}
