import {
  createOutputDifference,
  type OutputDifference,
  type ValidatedPlugin,
} from "../../core/index.js";
import {
  createWriteResult,
  type WriteResultInput,
} from "../../filesystem/index.js";

interface DeclarationPluginAuthor {
  readonly name: string;
  readonly email?: string;
  readonly url?: string;
}

interface DeclarationPluginMarketplace {
  readonly name: string;
  readonly description: string;
  readonly plugin_description: string;
  readonly category: string;
  readonly keywords: readonly string[];
}

interface DeclarationPluginCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

interface DeclarationSkillRequirement {
  readonly skill_id: string;
  readonly reason: string;
  readonly instructions: string;
}

interface DeclarationSkillDeprecation {
  readonly reason: string;
  readonly instructions: string;
  readonly replacement_skill_id?: string;
}

interface DeclarationSkillArchive {
  readonly reason: string;
  readonly replacement_skill_id?: string;
}

interface DeclarationSkillResource {
  readonly path: string;
  readonly content: Uint8Array;
}

interface DeclarationValidatedSkill {
  readonly id: string;
  readonly description: string;
  readonly category_id: string;
  readonly visibility: "internal" | "public";
  readonly status: "draft" | "active" | "deprecated" | "archived";
  readonly required_skills: readonly DeclarationSkillRequirement[];
  readonly deprecation?: DeclarationSkillDeprecation;
  readonly archive?: DeclarationSkillArchive;
  readonly source_path: string;
  readonly source_body: string;
  readonly resources: readonly DeclarationSkillResource[];
}

interface DeclarationValidatedPlugin {
  readonly schema_version: 1;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly author: DeclarationPluginAuthor;
  readonly homepage: string;
  readonly repository: string;
  readonly license: string;
  readonly keywords: readonly string[];
  readonly marketplace: DeclarationPluginMarketplace;
  readonly categories: readonly DeclarationPluginCategory[];
  readonly skills: readonly DeclarationValidatedSkill[];
}

interface DeclarationOutputDifference {
  readonly path: string;
  readonly reason:
    | "content-differs"
    | "kind-differs"
    | "missing"
    | "unexpected";
}

interface DeclarationWriteResult {
  readonly changedPaths: readonly string[];
  readonly unchangedPaths: readonly string[];
}

export interface ValidateResult {
  readonly plugin: DeclarationValidatedPlugin;
  readonly warnings: readonly string[];
}

export interface CheckResult extends ValidateResult {
  readonly upToDate: boolean;
  readonly differences: readonly DeclarationOutputDifference[];
}

export interface GenerateResult extends ValidateResult {
  readonly writeResult: DeclarationWriteResult;
  readonly verified: boolean;
  readonly differences: readonly DeclarationOutputDifference[];
}

/** @internal */
export interface ValidateResultInput {
  readonly plugin: ValidatedPlugin;
  readonly warnings: readonly string[];
}

/** @internal */
export interface CheckResultInput extends ValidateResultInput {
  readonly differences: readonly OutputDifference[];
}

/** @internal */
export interface GenerateResultInput extends ValidateResultInput {
  readonly writeResult: WriteResultInput;
  readonly differences: readonly OutputDifference[];
}

/** @internal */
export function createValidateResult(
  input: ValidateResultInput,
): ValidateResult {
  return Object.freeze({
    plugin: input.plugin,
    warnings: Object.freeze([...input.warnings]),
  });
}

/** @internal */
export function createCheckResult(input: CheckResultInput): CheckResult {
  const differences = Object.freeze(
    input.differences.map(createOutputDifference),
  );
  return Object.freeze({
    plugin: input.plugin,
    warnings: Object.freeze([...input.warnings]),
    upToDate: differences.length === 0,
    differences,
  });
}

/** @internal */
export function createGenerateResult(
  input: GenerateResultInput,
): GenerateResult {
  const differences = Object.freeze(
    input.differences.map(createOutputDifference),
  );
  return Object.freeze({
    plugin: input.plugin,
    warnings: Object.freeze([...input.warnings]),
    writeResult: createWriteResult(input.writeResult),
    verified: differences.length === 0,
    differences,
  });
}
