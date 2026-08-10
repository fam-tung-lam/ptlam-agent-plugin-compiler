declare const categoryIdBrand: unique symbol;
declare const projectPathBrand: unique symbol;
declare const providerIdBrand: unique symbol;
declare const skillIdBrand: unique symbol;

/** A manifest-v1 category identifier validated by {@link createCategoryId}. */
export type CategoryId = string & { readonly [categoryIdBrand]: true };

/**
 * A normalized, repository-relative POSIX path.
 *
 * @example
 * ```ts
 * const manifestPath: ProjectPath = createProjectPath("plugin/plugin.yml");
 * ```
 */
export type ProjectPath = string & { readonly [projectPathBrand]: true };

/**
 * A provider identifier validated by {@link createProviderId}.
 *
 * @example
 * ```ts
 * const externalProvider: ProviderId = createProviderId("external");
 * ```
 */
export type ProviderId = string & { readonly [providerIdBrand]: true };
/** A manifest-v1 skill identifier validated by {@link createSkillId}. */
export type SkillId = string & { readonly [skillIdBrand]: true };

/** The logical identifier family reported by {@link InvalidIdentifierError}. */
export type IdentifierKind = "category" | "provider" | "skill";

/** An invalid logical identifier, including its expected kind and input value. */
export class InvalidIdentifierError extends TypeError {
  override readonly name = "InvalidIdentifierError";

  /**
   * @param kind - Identifier family whose syntax was checked.
   * @param value - Rejected input value.
   */
  constructor(
    /** The identifier family whose syntax was checked. */
    readonly kind: IdentifierKind,
    /** The rejected input value. */
    readonly value: string,
  ) {
    super(`${JSON.stringify(value)} is not a valid ${kind} identifier`);
  }
}

/** An unsafe project path, including the rejected input value. */
export class InvalidProjectPathError extends Error {
  override readonly name = "InvalidProjectPathError";

  /** @param value - Rejected path input. */
  constructor(
    /** The rejected input value. */
    readonly value: string,
  ) {
    super(`${JSON.stringify(value)} is not a normalized project-relative path`);
  }
}

/**
 * Validate a logical path before any filesystem implementation may resolve it.
 *
 * @param value - Repository-relative POSIX path to validate.
 * @returns The branded path accepted by compiler APIs.
 * @throws {@link InvalidProjectPathError} When the value is empty, absolute,
 * contains traversal or empty segments, a NUL, a backslash, or a drive prefix.
 *
 * @example
 * ```ts
 * const outputPath = createProjectPath(".external-plugin/plugin.json");
 * ```
 */
export function createProjectPath(value: string): ProjectPath {
  const segments = value.split("/");
  if (
    value.length === 0 ||
    value.includes("\0") ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[A-Za-z]:/u.test(value) ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw new InvalidProjectPathError(value);
  }
  return value as ProjectPath;
}

function createManifestIdentifier(
  kind: "category" | "skill",
  value: string,
): string {
  if (value.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) {
    throw new InvalidIdentifierError(kind, value);
  }
  return value;
}

/**
 * Validate one category identifier against the manifest-v1 contract.
 *
 * @param value - Candidate category identifier.
 * @returns The validated category identifier.
 * @throws {@link InvalidIdentifierError} When the value violates manifest-v1 syntax.
 */
export function createCategoryId(value: string): CategoryId {
  return createManifestIdentifier("category", value) as CategoryId;
}

/**
 * Validate one extensible provider identifier.
 *
 * @param value - Candidate lower-case provider identifier.
 * @returns The branded identifier accepted by provider registries and compiler options.
 * @throws {@link InvalidIdentifierError} When the value does not start with a
 * lower-case letter or contains characters other than lower-case letters,
 * digits, and hyphens.
 *
 * @example
 * ```ts
 * const EXTERNAL = createProviderId("external");
 * ```
 */
export function createProviderId(value: string): ProviderId {
  if (!/^[a-z][a-z0-9-]*$/u.test(value)) {
    throw new InvalidIdentifierError("provider", value);
  }
  return value as ProviderId;
}

/**
 * Validate one skill identifier against the manifest-v1 contract.
 *
 * @param value - Candidate skill identifier.
 * @returns The validated skill identifier.
 * @throws {@link InvalidIdentifierError} When the value violates manifest-v1 syntax.
 */
export function createSkillId(value: string): SkillId {
  return createManifestIdentifier("skill", value) as SkillId;
}

/** Identifier of the built-in Claude provider adapter. */
export const CLAUDE = createProviderId("claude");
/** Identifier of the built-in Codex provider adapter. */
export const CODEX = createProviderId("codex");

/**
 * Compare two logical project paths without locale-dependent ordering.
 *
 * @param left - First path.
 * @param right - Second path.
 * @returns A negative number, zero, or a positive number for less-than, equal,
 * or greater-than ordering.
 */
export function compareProjectPaths(
  left: ProjectPath,
  right: ProjectPath,
): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
