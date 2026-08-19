import { chmod, copyFile, mkdir, readFile } from "node:fs/promises";

const binUrl = new URL("../dist/bin.js", import.meta.url);
const source = await readFile(binUrl, "utf8");

if (!source.startsWith("#!/usr/bin/env node\n")) {
  throw new Error("Emitted plugin-compiler binary is missing its Node shebang");
}

await chmod(binUrl, 0o755);
for (const version of ["v1", "v2"]) {
  const schemaDirectoryUrl = new URL(
    `../dist/schemas/${version}/`,
    import.meta.url,
  );
  await mkdir(schemaDirectoryUrl, { recursive: true });
  await copyFile(
    new URL(
      `../src/schemas/${version}/plugin-manifest.schema.json`,
      import.meta.url,
    ),
    new URL(
      `../dist/schemas/${version}/plugin-manifest.schema.json`,
      import.meta.url,
    ),
  );
}
