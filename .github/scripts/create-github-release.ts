import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { extractReleaseNotes } from "./release-notes.ts";
import {
  appendGitHubOutput,
  appendGitHubSummary,
  type CommandRunner,
  requireEnvironment,
  requireSuccess,
  runScript,
  systemCommandRunner,
} from "./run-script.ts";

interface GitObject {
  readonly sha: string;
  readonly type: string;
}

export interface GitTagReference {
  readonly object: GitObject;
}

export interface AnnotatedGitTag {
  readonly object: GitObject;
  readonly tag: string;
}

export interface GitHubReleaseRecord {
  readonly draft: boolean;
  readonly prerelease: boolean;
}

export interface GitHubReleaseClient {
  createAnnotatedTag(
    tagName: string,
    targetSha: string,
  ): Promise<{ readonly sha: string }>;
  completeDraftRelease(
    tagName: string,
    notesPath: string,
    assetPath: string,
  ): Promise<void>;
  createRelease(
    tagName: string,
    prerelease: boolean,
    notesPath: string,
    assetPath: string,
  ): Promise<void>;
  createTagReference(tagName: string, tagObjectSha: string): Promise<void>;
  getAnnotatedTag(tagObjectSha: string): Promise<AnnotatedGitTag>;
  getRelease(tagName: string): Promise<GitHubReleaseRecord | undefined>;
  getTagReference(tagName: string): Promise<GitTagReference | undefined>;
  verifyAsset(tagName: string, assetPath: string): Promise<void>;
}

export async function createOrVerifyGitHubRelease(
  input: {
    readonly packageVersion: string;
    readonly prerelease: boolean;
    readonly releaseSha: string;
    readonly notesPath: string;
    readonly assetPath: string;
  },
  client: GitHubReleaseClient,
): Promise<string> {
  const tagName = `v${input.packageVersion}`;
  const reference = await client.getTagReference(tagName);
  if (reference === undefined) {
    const tag = await client.createAnnotatedTag(tagName, input.releaseSha);
    await client.createTagReference(tagName, tag.sha);
  } else {
    if (reference.object.type !== "tag") {
      throw new Error(`${tagName} is not an annotated Git tag.`);
    }
    const tag = await client.getAnnotatedTag(reference.object.sha);
    if (
      tag.tag !== tagName ||
      tag.object.type !== "commit" ||
      tag.object.sha !== input.releaseSha
    ) {
      throw new Error(`${tagName} does not point to the release commit.`);
    }
  }

  const release = await client.getRelease(tagName);
  if (release === undefined) {
    await client.createRelease(
      tagName,
      input.prerelease,
      input.notesPath,
      input.assetPath,
    );
  } else if (release.prerelease !== input.prerelease) {
    throw new Error(
      `Existing GitHub Release ${tagName} has incompatible state.`,
    );
  } else if (release.draft) {
    await client.completeDraftRelease(
      tagName,
      input.notesPath,
      input.assetPath,
    );
  }
  await client.verifyAsset(tagName, input.assetPath);
  return tagName;
}

function parseObject(
  value: unknown,
  label: string,
): Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function parseGitObject(value: unknown): GitObject {
  const object = parseObject(value, "Git object");
  if (typeof object["sha"] !== "string" || typeof object["type"] !== "string") {
    throw new Error("Git object must contain string sha and type.");
  }
  return { sha: object["sha"], type: object["type"] };
}

function commandClient(
  runner: CommandRunner,
  repository: string,
): GitHubReleaseClient {
  async function optionalApi(path: string): Promise<unknown | undefined> {
    const result = await runner.run("gh", ["api", path]);
    if (result.exitCode === 0) return JSON.parse(result.stdout) as unknown;
    if (result.stderr.includes("HTTP 404")) return undefined;
    requireSuccess(result, `Call GitHub API ${path}`);
    throw new Error("Unreachable GitHub API state.");
  }
  return {
    async completeDraftRelease(tagName, notesPath, assetPath) {
      requireSuccess(
        await runner.run("gh", [
          "release",
          "upload",
          tagName,
          assetPath,
          "--clobber",
        ]),
        `Upload release asset for ${tagName}`,
      );
      requireSuccess(
        await runner.run("gh", [
          "release",
          "edit",
          tagName,
          "--verify-tag",
          "--title",
          tagName,
          "--notes-file",
          notesPath,
          "--draft=false",
        ]),
        `Publish draft release ${tagName}`,
      );
    },
    async createAnnotatedTag(tagName, targetSha) {
      const result = requireSuccess(
        await runner.run("gh", [
          "api",
          "--method",
          "POST",
          `repos/${repository}/git/tags`,
          "-f",
          `tag=${tagName}`,
          "-f",
          `message=Release ${tagName}`,
          "-f",
          `object=${targetSha}`,
          "-f",
          "type=commit",
        ]),
        `Create annotated tag ${tagName}`,
      );
      const object = parseObject(
        JSON.parse(result.stdout) as unknown,
        "Tag response",
      );
      if (typeof object["sha"] !== "string")
        throw new Error("Tag response has no sha.");
      return { sha: object["sha"] };
    },
    async createRelease(tagName, prerelease, notesPath, assetPath) {
      const arguments_ = [
        "release",
        "create",
        tagName,
        assetPath,
        "--verify-tag",
        "--notes-file",
        notesPath,
        "--title",
        tagName,
      ];
      if (prerelease) arguments_.push("--prerelease");
      requireSuccess(
        await runner.run("gh", arguments_),
        `Create release ${tagName}`,
      );
    },
    async createTagReference(tagName, tagObjectSha) {
      requireSuccess(
        await runner.run("gh", [
          "api",
          "--method",
          "POST",
          `repos/${repository}/git/refs`,
          "-f",
          `ref=refs/tags/${tagName}`,
          "-f",
          `sha=${tagObjectSha}`,
        ]),
        `Create reference ${tagName}`,
      );
    },
    async getAnnotatedTag(tagObjectSha) {
      const value = await optionalApi(
        `repos/${repository}/git/tags/${tagObjectSha}`,
      );
      const object = parseObject(value, "Annotated tag");
      if (typeof object["tag"] !== "string")
        throw new Error("Annotated tag has no name.");
      return { object: parseGitObject(object["object"]), tag: object["tag"] };
    },
    async getRelease(tagName) {
      const value = await optionalApi(
        `repos/${repository}/releases/tags/${tagName}`,
      );
      if (value === undefined) return undefined;
      const object = parseObject(value, "GitHub Release");
      if (
        typeof object["draft"] !== "boolean" ||
        typeof object["prerelease"] !== "boolean"
      ) {
        throw new Error("GitHub Release has invalid state fields.");
      }
      return { draft: object["draft"], prerelease: object["prerelease"] };
    },
    async getTagReference(tagName) {
      const value = await optionalApi(
        `repos/${repository}/git/ref/tags/${tagName}`,
      );
      if (value === undefined) return undefined;
      const object = parseObject(value, "Git tag reference");
      return { object: parseGitObject(object["object"]) };
    },
    async verifyAsset(tagName, assetPath) {
      requireSuccess(
        await runner.run("gh", ["release", "verify-asset", tagName, assetPath]),
        `Verify release asset for ${tagName}`,
      );
    },
  };
}

runScript(import.meta.url, async () => {
  const prerelease = requireEnvironment(process.env, "PRERELEASE");
  if (prerelease !== "true" && prerelease !== "false") {
    throw new Error("PRERELEASE must be true or false.");
  }
  const packageVersion = requireEnvironment(process.env, "PACKAGE_VERSION");
  const runnerTemp = requireEnvironment(process.env, "RUNNER_TEMP");
  const notesPath = path.join(runnerTemp, "release-notes.md");
  await writeFile(
    notesPath,
    extractReleaseNotes(await readFile("CHANGELOG.md", "utf8"), packageVersion),
    "utf8",
  );
  const tarballName = requireEnvironment(process.env, "TARBALL_NAME");
  const assetPath = path.join(
    requireEnvironment(process.env, "CANDIDATE_DIR"),
    tarballName,
  );
  const tagName = await createOrVerifyGitHubRelease(
    {
      assetPath,
      notesPath,
      packageVersion,
      prerelease: prerelease === "true",
      releaseSha: requireEnvironment(process.env, "RELEASE_SHA"),
    },
    commandClient(
      systemCommandRunner,
      requireEnvironment(process.env, "GITHUB_REPOSITORY"),
    ),
  );
  await appendGitHubOutput(requireEnvironment(process.env, "GITHUB_OUTPUT"), {
    name: tagName,
  });
  const packageName = requireEnvironment(process.env, "PACKAGE_NAME");
  const npmTag = requireEnvironment(process.env, "NPM_TAG");
  const releaseSha = requireEnvironment(process.env, "RELEASE_SHA");
  const publishedNow = requireEnvironment(process.env, "PUBLISHED_NOW");
  await appendGitHubSummary(
    requireEnvironment(process.env, "GITHUB_STEP_SUMMARY"),
    `## Release complete\n\n- npm: \`${packageName}@${packageVersion}\`\n- npm tag: \`${npmTag}\`\n- Git tag: \`${tagName}\`\n- Asset: \`${tarballName}\` (verified)\n- Commit: \`${releaseSha}\`\n- Published now: \`${publishedNow}\`\n`,
  );
});
