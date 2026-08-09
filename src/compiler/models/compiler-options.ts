import { createProviders } from "../../providers/models/provider.js";
import type { Provider } from "../../providers/provider.js";

export interface CompilerOptionsInput {
  readonly rootDir: string;
  readonly providers: readonly Provider[];
}

/**
 * Immutable explicit scope for one compiler facade instance.
 * @internal
 */
export class CompilerOptions {
  readonly rootDir: string;
  readonly providers: readonly Provider[];

  constructor(input: CompilerOptionsInput) {
    if (input.rootDir.length === 0) {
      throw new TypeError("Compiler rootDir must not be empty");
    }
    this.rootDir = input.rootDir;
    this.providers = createProviders(input.providers);
    Object.freeze(this);
  }
}
