import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { onTestFinished } from "vitest";

import { REQUIRED_SKILLS_MARKER } from "../../../../../src/core/index.ts";

export const DISABLED_CLAUDE_BYTES = "disabled-claude-provider\n";
export const DISABLED_CLAUDE_MARKETPLACE_BYTES =
  "disabled-claude-marketplace\n";

const validManifest = {
  schema_version: 1,
  providers: ["codex"],
  name: "fixture-skills",
  description: "Fixture plugin.",
  version: "1.2.3",
  author: {
    name: "Fixture Owner",
    email: "owner@example.test",
    url: "https://example.test/owner",
  },
  homepage: "https://example.test/plugin",
  repository: "https://example.test/repository",
  license: "MIT",
  keywords: ["agent-skills"],
  categories: [
    {
      id: "engineering",
      name: "Engineering",
      description: "Engineering skills.",
    },
  ],
  skills: [
    {
      id: "alpha-skill",
      description: "Alpha fixture skill.",
      category_id: "engineering",
      visibility: "public",
      status: "active",
      required_skills: [],
    },
  ],
};

export async function createCompilerRepository(): Promise<string> {
  const rootDir = await mkdtemp(path.join(tmpdir(), "plugin-compiler-test-"));
  onTestFinished(() => rm(rootDir, { force: true, recursive: true }));
  await mkdir(path.join(rootDir, "plugin", "skills", "alpha-skill"), {
    recursive: true,
  });
  await mkdir(path.join(rootDir, ".claude-plugin"), { recursive: true });
  await writeFile(
    path.join(rootDir, "plugin", "plugin.yml"),
    `${JSON.stringify(validManifest, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(rootDir, "plugin", "skills", "alpha-skill", "SKILL.md"),
    `# Alpha skill\n\n${REQUIRED_SKILLS_MARKER}\n`,
    "utf8",
  );
  await writeFile(
    path.join(rootDir, ".claude-plugin", "plugin.json"),
    DISABLED_CLAUDE_BYTES,
    "utf8",
  );
  await writeFile(
    path.join(rootDir, ".claude-plugin", "marketplace.json"),
    DISABLED_CLAUDE_MARKETPLACE_BYTES,
    "utf8",
  );
  await symlink(
    path.join(rootDir, "missing-readme-target"),
    path.join(rootDir, "README.md"),
    "file",
  );
  return rootDir;
}

/** Add one valid two-stage adaptive hook to a compiler repository fixture. */
export async function addAdaptiveHook(rootDir: string): Promise<void> {
  const manifestPath = path.join(rootDir, "plugin", "plugin.yml");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    schema_version: number;
    hooks?: unknown[];
  };
  manifest.schema_version = 2;
  manifest.hooks = [
    {
      id: "adaptive-interaction",
      bindings: [
        { lifecycle: "before-request", handler: "request.mjs" },
        { lifecycle: "before-response", handler: "response.mjs" },
      ],
    },
  ];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const hookRoot = path.join(
    rootDir,
    "plugin",
    "hooks",
    "adaptive-interaction",
  );
  await mkdir(hookRoot, { recursive: true });
  await writeFile(
    path.join(hookRoot, "request.mjs"),
    "export async function handle() { return {}; }\n",
  );
  await writeFile(
    path.join(hookRoot, "response.mjs"),
    "export async function handle() { return {}; }\n",
  );
}

/** Remove the adaptive hook declaration and its authored source directory. */
export async function removeAdaptiveHook(rootDir: string): Promise<void> {
  const manifestPath = path.join(rootDir, "plugin", "plugin.yml");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    hooks?: unknown[];
  };
  delete manifest.hooks;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await rm(path.join(rootDir, "plugin", "hooks"), {
    force: true,
    recursive: true,
  });
}
