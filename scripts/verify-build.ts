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
  "CheckResult",
  "CompileResult",
  "CompilerOptionsInput",
  "Provider",
  "ValidateResult",
];

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

function findSpecifiers(source: string): string[] {
  return [
    ...source.matchAll(
      /(?:from\s+|import\s*(?:\(\s*)?)(["'])(?<specifier>[^"']+)\1/gu,
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

const files = await collectFiles(distRoot);
const javascriptFiles = files.filter((file) => file.endsWith(".js"));
const declarationFiles = files.filter((file) => file.endsWith(".d.ts"));
if (
  javascriptFiles.length === 0 ||
  javascriptFiles.length !== declarationFiles.length
) {
  throw new Error(
    `Build must emit matching JavaScript and declarations; received ${javascriptFiles.length} JavaScript and ${declarationFiles.length} declaration files`,
  );
}

const bareRuntimePackages = new Set();
for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const specifier of findSpecifiers(source)) {
    if (/\.(?:cts|mts|tsx?|d\.ts)$/u.test(specifier)) {
      throw new Error(
        `Emitted TypeScript specifier ${JSON.stringify(specifier)} in ${path.relative(projectRoot, file)}`,
      );
    }
    if (file.endsWith(".js") && specifier.startsWith(".")) {
      const target = path.resolve(path.dirname(file), specifier);
      if (!javascriptFiles.includes(target)) {
        throw new Error(
          `Unresolved emitted runtime specifier ${JSON.stringify(specifier)} in ${path.relative(projectRoot, file)}`,
        );
      }
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
  '["AgentPluginCompiler","Provider"]'
) {
  throw new Error(
    `Root runtime exports differ: ${JSON.stringify(Object.keys(namespace).toSorted())}`,
  );
}

const rootDeclaration = await readFile(
  path.join(distRoot, "index.d.ts"),
  "utf8",
);
if (/export\s+(?:default|\*)/u.test(rootDeclaration)) {
  throw new Error("Root declaration contains a default or wildcard export");
}
const declarationExportPattern =
  /export\s+(?:type\s+)?\{(?<clause>[^}]*)\}\s+from\s+["'][^"']+["'];/gu;
const declarationExports = [
  ...rootDeclaration.matchAll(declarationExportPattern),
];
const unparsedDeclaration = rootDeclaration
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

console.log(
  `Verified ${javascriptFiles.length} JavaScript files, ${declarationFiles.length} declarations, five direct runtime dependencies, and the closed root interface.`,
);
