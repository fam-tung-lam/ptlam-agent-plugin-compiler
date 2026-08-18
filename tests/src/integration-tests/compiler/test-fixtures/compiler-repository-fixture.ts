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

/** Upgrade a compiler repository fixture to the hook-optional v2 schema. */
export async function useSchemaVersion2(rootDir: string): Promise<void> {
  const manifestPath = path.join(rootDir, "plugin", "plugin.yml");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    schema_version: number;
  };
  manifest.schema_version = 2;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Replace the fixture catalog with every supported dependency-graph shape. */
export async function useSkillDependencyGraph(rootDir: string): Promise<void> {
  const manifestPath = path.join(rootDir, "plugin", "plugin.yml");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    categories: Record<string, unknown>[];
    skills: Record<string, unknown>[];
  };
  manifest.categories.push({
    id: "foundations",
    name: "Foundations",
    description: "Foundational skills.",
  });
  manifest.skills = [
    {
      id: "shared-skill",
      description: "Shared internal dependency.",
      category_id: "foundations",
      visibility: "internal",
      status: "active",
      required_skills: [],
    },
    {
      id: "middle-skill",
      description: "Transitive internal dependency.",
      category_id: "foundations",
      visibility: "internal",
      status: "active",
      required_skills: [
        {
          skill_id: "shared-skill",
          reason: "Provides shared rules.",
          instructions: "Read the shared skill first.",
        },
      ],
    },
    {
      id: "alpha-skill",
      description: "Dependent public skill.",
      category_id: "engineering",
      visibility: "public",
      status: "active",
      required_skills: [
        {
          skill_id: "middle-skill",
          reason: "Provides the intermediate workflow.",
          instructions: "Read the middle skill first.",
        },
        {
          skill_id: "shared-skill",
          reason: "Provides shared rules directly.",
          instructions: "Also read the shared skill.",
        },
      ],
    },
    {
      id: "legacy-skill",
      description: "Deprecated public skill.",
      category_id: "engineering",
      visibility: "public",
      status: "deprecated",
      required_skills: [
        {
          skill_id: "shared-skill",
          reason: "Provides legacy shared rules.",
          instructions: "Read the shared skill first.",
        },
      ],
      deprecation: {
        reason: "A replacement exists.",
        instructions: "Use alpha-skill.",
        replacement_skill_id: "alpha-skill",
      },
    },
    {
      id: "isolated-skill",
      description: "Independent public skill.",
      category_id: "engineering",
      visibility: "public",
      status: "active",
      required_skills: [],
    },
    {
      id: "draft-skill",
      description: "Unpublished draft skill.",
      category_id: "engineering",
      visibility: "public",
      status: "draft",
      required_skills: [],
    },
    {
      id: "unreachable-skill",
      description: "Unreachable internal skill.",
      category_id: "engineering",
      visibility: "internal",
      status: "active",
      required_skills: [],
    },
    {
      id: "archived-skill",
      description: "Archived internal skill.",
      category_id: "engineering",
      visibility: "internal",
      status: "archived",
      required_skills: [],
      archive: { reason: "No longer supported." },
    },
  ];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  for (const skill of manifest.skills) {
    const skillId = String(skill["id"]);
    const skillRoot = path.join(rootDir, "plugin", "skills", skillId);
    await mkdir(skillRoot, { recursive: true });
    await writeFile(
      path.join(skillRoot, "SKILL.md"),
      `# ${skillId}\n\n${REQUIRED_SKILLS_MARKER}\n`,
    );
  }
}

/** Add one valid adaptive hook to a compiler repository fixture. */
export async function addAdaptiveHook(
  rootDir: string,
  handlers: readonly {
    readonly event: string;
    readonly handler: "request.mjs" | "response.mjs";
  }[] = [
    { event: "userPromptSubmit", handler: "request.mjs" },
    { event: "stop", handler: "response.mjs" },
  ],
): Promise<void> {
  const manifestPath = path.join(rootDir, "plugin", "plugin.yml");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    schema_version: number;
    hooks?: Record<string, unknown>;
  };
  manifest.schema_version = 2;
  manifest.hooks = Object.fromEntries(
    handlers.map(({ event, handler }) => [
      event,
      [{ handler: `adaptive-interaction/${handler}` }],
    ]),
  );
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
