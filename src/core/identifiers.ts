declare const categoryIdBrand: unique symbol;
declare const projectPathBrand: unique symbol;
declare const providerIdBrand: unique symbol;
declare const skillIdBrand: unique symbol;

export type CategoryId = string & { readonly [categoryIdBrand]: true };

/** A normalized, repository-relative POSIX path. */
export type ProjectPath = string & { readonly [projectPathBrand]: true };

export type ProviderId = string & { readonly [providerIdBrand]: true };
export type SkillId = string & { readonly [skillIdBrand]: true };

export type IdentifierKind = "category" | "provider" | "skill";

/** Raised when an untrusted string is not a valid logical identifier. */
export class InvalidIdentifierError extends TypeError {
  override readonly name = "InvalidIdentifierError";

  constructor(
    readonly kind: IdentifierKind,
    readonly value: string,
  ) {
    super(`${JSON.stringify(value)} is not a valid ${kind} identifier`);
  }
}

/** Raised when an untrusted string cannot safely identify a logical project path. */
export class InvalidProjectPathError extends Error {
  override readonly name = "InvalidProjectPathError";

  constructor(readonly value: string) {
    super(`${JSON.stringify(value)} is not a normalized project-relative path`);
  }
}

/** Validate a logical path before any filesystem implementation may resolve it. */
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

/** Validate one category identifier against the manifest-v1 contract. */
export function createCategoryId(value: string): CategoryId {
  return createManifestIdentifier("category", value) as CategoryId;
}

/** Validate one extensible provider identifier. */
export function createProviderId(value: string): ProviderId {
  if (!/^[a-z][a-z0-9-]*$/u.test(value)) {
    throw new InvalidIdentifierError("provider", value);
  }
  return value as ProviderId;
}

/** Validate one skill identifier against the manifest-v1 contract. */
export function createSkillId(value: string): SkillId {
  return createManifestIdentifier("skill", value) as SkillId;
}

export const CLAUDE = createProviderId("claude");
export const CODEX = createProviderId("codex");

/** Locale-independent ordering used by every logical compiler collection. */
export function compareProjectPaths(
  left: ProjectPath,
  right: ProjectPath,
): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
