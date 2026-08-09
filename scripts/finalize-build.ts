import { chmod, readFile } from "node:fs/promises";

const binUrl = new URL("../dist/bin.js", import.meta.url);
const source = await readFile(binUrl, "utf8");

if (!source.startsWith("#!/usr/bin/env node\n")) {
  throw new Error("Emitted plugin-compiler binary is missing its Node shebang");
}

await chmod(binUrl, 0o755);
