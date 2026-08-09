declare const projectPathBrand: unique symbol;

/** A normalized, repository-relative POSIX path. */
export type ProjectPath = string & { readonly [projectPathBrand]: true };

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

/** Locale-independent ordering used by every logical compiler collection. */
export function compareProjectPaths(
  left: ProjectPath,
  right: ProjectPath,
): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
