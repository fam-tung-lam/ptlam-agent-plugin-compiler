import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { onTestFinished } from "vitest";

export async function createFilesystemRepository(): Promise<string> {
  const rootDir = await mkdtemp(path.join(tmpdir(), "plugin-filesystem-test-"));
  onTestFinished(() => rm(rootDir, { force: true, recursive: true }));
  await mkdir(
    path.join(rootDir, "plugin", "skills", "alpha-skill", "references"),
    {
      recursive: true,
    },
  );
  await writeFile(
    path.join(rootDir, "plugin", "plugin.yml"),
    'schema_version: 1\nname: "fixture"\n',
    "utf8",
  );
  await writeFile(
    path.join(rootDir, "plugin", "skills", "alpha-skill", "SKILL.md"),
    "# Alpha\n",
    "utf8",
  );
  await writeFile(
    path.join(
      rootDir,
      "plugin",
      "skills",
      "alpha-skill",
      "references",
      "data.bin",
    ),
    Buffer.from([0, 255, 1]),
  );
  return rootDir;
}
