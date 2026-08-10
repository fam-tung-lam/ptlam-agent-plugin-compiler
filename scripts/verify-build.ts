import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = path.join(projectRoot, "dist");
const runtimeDependencyNames = [
  "ajv",
  "mdast-util-from-markdown",
  "prettier",
  "string-width",
  "yaml",
];
const expectedDeclarationNames = [
  "AgentPluginCompiler",
  "Artifact",
  "ArtifactKind",
  "CLAUDE",
  "CODEX",
  "CheckResult",
  "ClaudeProviderAdapter",
  "CodexProviderAdapter",
  "CompileResult",
  "CompilerOptionsInput",
  "Ownership",
  "OwnershipKind",
  "PlanFragment",
  "PlanFragmentInput",
  "Plugin",
  "PluginManifest",
  "ProjectPath",
  "ProviderAdapter",
  "ProviderAdapterRegistry",
  "ProviderContext",
  "ProviderId",
  "ValidateResult",
  "createPlanFragment",
  "createProjectPath",
  "createProviderId",
];
const expectedRuntimeNames = [
  "AgentPluginCompiler",
  "ArtifactKind",
  "CLAUDE",
  "CODEX",
  "ClaudeProviderAdapter",
  "CodexProviderAdapter",
  "OwnershipKind",
  "ProviderAdapterRegistry",
  "createPlanFragment",
  "createProjectPath",
  "createProviderId",
];

function removeJsDocComments(source: string): string {
  return source.replace(/\/\*\*[\s\S]*?\*\//gu, "");
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.toSorted((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
  )) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

/**
 * Extract static, dynamic, and CommonJS runtime specifiers from emitted source,
 * excluding JSDoc usage examples.
 *
 * @param source - Emitted JavaScript or declaration text.
 * @returns Specifiers in source order.
 * @internal
 */
export function findRuntimeSpecifiers(source: string): string[] {
  const executableSource = removeJsDocComments(source);
  return [
    ...executableSource.matchAll(
      /(?:from\s+|import\s*(?:\(\s*)?|require\s*\(\s*)(["'])(?<specifier>[^"']+)\1/gu,
    ),
  ].flatMap((match) =>
    match.groups?.["specifier"] === undefined
      ? []
      : [match.groups["specifier"]],
  );
}

function packageName(specifier: string): string {
  if (specifier.startsWith("@")) {
    return specifier.split("/").slice(0, 2).join("/");
  }
  return specifier.split("/")[0] ?? specifier;
}

/**
 * Decide whether an emitted file contains importable source text.
 *
 * @param file - Absolute or relative emitted file path.
 * @returns `true` for JavaScript and declaration files.
 * @internal
 */
export function isScannableBuildSource(file: string): boolean {
  return file.endsWith(".js") || file.endsWith(".d.ts");
}

/**
 * Require one relative runtime specifier to resolve to an emitted file.
 *
 * @param file - Emitted JavaScript file containing the specifier.
 * @param specifier - Relative runtime specifier to resolve.
 * @param runtimeFiles - Absolute emitted JavaScript and JSON paths.
 * @param root - Base path used to shorten diagnostics.
 * @returns When the resolved target exists in `runtimeFiles`.
 * @throws If the resolved target was not emitted.
 * @internal
 */
export function assertEmittedRuntimeTarget(
  file: string,
  specifier: string,
  runtimeFiles: ReadonlySet<string>,
  root: string = projectRoot,
): void {
  const target = path.resolve(path.dirname(file), specifier);
  if (!runtimeFiles.has(target)) {
    throw new Error(
      `Unresolved emitted runtime specifier ${JSON.stringify(specifier)} in ${path.relative(root, file)}`,
    );
  }
}

/**
 * Verify the complete `dist` artifact and package-root interface.
 *
 * @returns A human-readable verification summary.
 * @throws If emitted files, dependencies, runtime targets, or root exports differ from the contract.
 * @internal
 */
export async function verifyBuild(): Promise<string> {
  const files = await collectFiles(distRoot);
  const javascriptFiles = files.filter((file) => file.endsWith(".js"));
  const declarationFiles = files.filter((file) => file.endsWith(".d.ts"));
  const jsonFiles = files.filter((file) => file.endsWith(".json"));
  if (
    javascriptFiles.length === 0 ||
    javascriptFiles.length !== declarationFiles.length
  ) {
    throw new Error(
      `Build must emit matching JavaScript and declarations; received ${javascriptFiles.length} JavaScript and ${declarationFiles.length} declaration files`,
    );
  }

  const runtimeFiles = new Set([...javascriptFiles, ...jsonFiles]);
  const bareRuntimePackages = new Set<string>();
  for (const file of files.filter(isScannableBuildSource)) {
    const source = await readFile(file, "utf8");
    for (const specifier of findRuntimeSpecifiers(source)) {
      if (/\.(?:cts|mts|tsx?|d\.ts)$/u.test(specifier)) {
        throw new Error(
          `Emitted TypeScript specifier ${JSON.stringify(specifier)} in ${path.relative(projectRoot, file)}`,
        );
      }
      if (file.endsWith(".js") && specifier.startsWith(".")) {
        assertEmittedRuntimeTarget(file, specifier, runtimeFiles);
      } else if (
        file.endsWith(".js") &&
        !specifier.startsWith("node:") &&
        !specifier.startsWith(".")
      ) {
        bareRuntimePackages.add(packageName(specifier));
      }
    }
  }

  const actualRuntimePackages = [...bareRuntimePackages].toSorted();
  if (
    JSON.stringify(actualRuntimePackages) !==
    JSON.stringify(runtimeDependencyNames)
  ) {
    throw new Error(
      `Emitted runtime dependencies differ: ${JSON.stringify(actualRuntimePackages)}`,
    );
  }

  const namespace = await import(
    pathToFileURL(path.join(distRoot, "index.js")).href
  );
  if (
    JSON.stringify(Object.keys(namespace).toSorted()) !==
    JSON.stringify(expectedRuntimeNames)
  ) {
    throw new Error(
      `Root runtime exports differ: ${JSON.stringify(Object.keys(namespace).toSorted())}`,
    );
  }

  const rootDeclaration = await readFile(
    path.join(distRoot, "index.d.ts"),
    "utf8",
  );
  const declarationSurface = removeJsDocComments(rootDeclaration);
  if (/export\s+(?:default|\*)/u.test(declarationSurface)) {
    throw new Error("Root declaration contains a default or wildcard export");
  }
  const declarationExportPattern =
    /export\s+(?:type\s+)?\{(?<clause>[^}]*)\}\s+from\s+["'][^"']+["'];/gu;
  const declarationExports = [
    ...declarationSurface.matchAll(declarationExportPattern),
  ];
  const unparsedDeclaration = declarationSurface
    .replace(declarationExportPattern, "")
    .trim();
  if (unparsedDeclaration.length > 0) {
    throw new Error(
      `Root declaration contains an unsupported export form: ${JSON.stringify(unparsedDeclaration)}`,
    );
  }
  const declaredNames = declarationExports
    .flatMap((match) => match.groups?.["clause"]?.split(",") ?? [])
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .map((name) =>
      name
        .replace(/^type\s+/u, "")
        .split(/\s+as\s+/u)
        .at(-1),
    )
    .filter((name) => name !== undefined)
    .toSorted();
  if (
    JSON.stringify(declaredNames) !== JSON.stringify(expectedDeclarationNames)
  ) {
    throw new Error(
      `Root declaration exports differ: ${JSON.stringify(declaredNames)}`,
    );
  }

  return `Verified ${javascriptFiles.length} JavaScript files, ${declarationFiles.length} declarations, ${jsonFiles.length} JSON resources, five direct runtime dependencies, and the explicit open provider interface.`;
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  console.log(await verifyBuild());
}
