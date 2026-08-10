import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MODULE_NAMES = [
  "schemas",
  "core",
  "compiler/validation",
  "compiler/rendering",
  "compiler/planning",
  "compiler",
  "providers",
  "filesystem",
  "cli",
] as const;

type ModuleName = (typeof MODULE_NAMES)[number];

const ALLOWED_MODULE_IMPORTS: Readonly<
  Record<ModuleName, readonly ModuleName[]>
> = {
  schemas: [],
  core: [],
  "compiler/validation": ["core", "schemas"],
  "compiler/rendering": ["core", "compiler/validation"],
  "compiler/planning": ["core"],
  compiler: [
    "core",
    "compiler/validation",
    "compiler/rendering",
    "compiler/planning",
    "providers",
    "filesystem",
  ],
  providers: ["core"],
  filesystem: ["core"],
  cli: ["compiler", "providers"],
};

/**
 * One import that violates the configured source-module graph.
 *
 * @internal
 */
export interface BoundaryViolation {
  /** Source file relative to the checked source root. */
  readonly file: string;
  /** Actionable dependency-rule explanation. */
  readonly message: string;
  /** Relative module specifier found in the source file. */
  readonly specifier: string;
}

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.toSorted((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
  )) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(absolutePath)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function findRelativeSpecifiers(source: string): string[] {
  return [
    ...source.matchAll(
      /(?:from\s+|import\s*(?:\(\s*)?|require\s*\(\s*)(["'])(?<specifier>[^"']+)\1/gu,
    ),
  ]
    .flatMap((match) => {
      const specifier = match.groups?.["specifier"];
      return specifier?.startsWith(".") === true ? [specifier] : [];
    })
    .toSorted();
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function classifyModule(relativePath: string): ModuleName | undefined {
  return MODULE_NAMES.find(
    (moduleName) =>
      relativePath === moduleName || relativePath.startsWith(`${moduleName}/`),
  );
}

function isCompilerModule(moduleName: ModuleName): boolean {
  return moduleName === "compiler" || moduleName.startsWith("compiler/");
}

function checkImport(
  sourceModule: ModuleName,
  targetModule: ModuleName,
  targetPath: string,
): string | undefined {
  if (sourceModule === targetModule) {
    return undefined;
  }

  if (isCompilerModule(targetModule) && !isCompilerModule(sourceModule)) {
    if (targetModule !== "compiler" || targetPath !== "compiler/index.js") {
      return `Compiler internals are private; import "compiler/index.js" instead of "${targetPath}"`;
    }
  }

  const allowedTargets = ALLOWED_MODULE_IMPORTS[sourceModule];
  if (!allowedTargets.includes(targetModule)) {
    return `Module "${sourceModule}" cannot import "${targetModule}"; allowed module imports: ${allowedTargets.join(", ") || "none"}`;
  }

  if (targetModule === "schemas") {
    if (!targetPath.endsWith(".json")) {
      return `Schema import must target a JSON resource, not "${targetPath}"`;
    }
    return undefined;
  }

  const expectedTarget = `${targetModule}/index.js`;
  if (targetPath !== expectedTarget) {
    return `Cross-module import must target "${expectedTarget}", not "${targetPath}"`;
  }

  return undefined;
}

/**
 * Check relative TypeScript imports below one source root.
 *
 * @param sourceRoot - Absolute directory whose children use the configured module layout.
 * @returns Deterministically ordered violations; an empty array means the graph is valid.
 * @throws If the source tree cannot be traversed or read.
 * @internal
 */
export async function checkModuleBoundaries(
  sourceRoot: string,
): Promise<BoundaryViolation[]> {
  const violations: BoundaryViolation[] = [];

  for (const absolutePath of await collectTypeScriptFiles(sourceRoot)) {
    const relativePath = toPosixPath(path.relative(sourceRoot, absolutePath));
    const sourceModule = classifyModule(relativePath);
    if (sourceModule === undefined) {
      continue;
    }

    const source = await readFile(absolutePath, "utf8");
    for (const specifier of findRelativeSpecifiers(source)) {
      const targetPath = toPosixPath(
        path.relative(
          sourceRoot,
          path.resolve(path.dirname(absolutePath), specifier),
        ),
      );
      const targetModule = classifyModule(targetPath);
      if (targetModule === undefined) {
        continue;
      }

      const message = checkImport(sourceModule, targetModule, targetPath);
      if (message !== undefined) {
        violations.push({ file: relativePath, message, specifier });
      }
    }
  }

  return violations;
}

async function run(): Promise<void> {
  const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
  const violations = await checkModuleBoundaries(sourceRoot);

  if (violations.length > 0) {
    const details = violations
      .map(
        ({ file, message, specifier }) =>
          `- ${file}: ${JSON.stringify(specifier)}\n  ${message}`,
      )
      .join("\n");
    throw new Error(
      `Module boundary check found ${violations.length} violation(s):\n${details}`,
    );
  }

  console.log("Module boundaries verified.");
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url === pathToFileURL(invokedPath).href
) {
  await run();
}
