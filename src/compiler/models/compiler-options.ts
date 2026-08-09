import { createProviderIds, type ProviderId } from "../../providers/index.js";

export interface CompilerOptionsInput {
  readonly rootDir: string;
  readonly providerIds: Iterable<string>;
}

/**
 * Immutable explicit scope for one compiler facade instance.
 * @internal
 */
export class CompilerOptions {
  readonly rootDir: string;
  readonly providerIds: readonly ProviderId[];

  constructor(input: CompilerOptionsInput) {
    if (input.rootDir.length === 0) {
      throw new TypeError("Compiler rootDir must not be empty");
    }
    this.rootDir = input.rootDir;
    this.providerIds = createProviderIds(input.providerIds);
    Object.freeze(this);
  }
}
