import { chmod, copyFile, mkdir, readFile } from "node:fs/promises";

const binUrl = new URL("../dist/bin.js", import.meta.url);
const schemaDirectoryUrl = new URL("../dist/schemas/v1/", import.meta.url);
const schemaSourceUrl = new URL(
  "../src/schemas/v1/plugin-manifest.schema.json",
  import.meta.url,
);
const schemaTargetUrl = new URL(
  "../dist/schemas/v1/plugin-manifest.schema.json",
  import.meta.url,
);
const source = await readFile(binUrl, "utf8");

if (!source.startsWith("#!/usr/bin/env node\n")) {
  throw new Error("Emitted plugin-compiler binary is missing its Node shebang");
}

await chmod(binUrl, 0o755);
await mkdir(schemaDirectoryUrl, { recursive: true });
await copyFile(schemaSourceUrl, schemaTargetUrl);
