import assert from "node:assert/strict";

import { describe, it } from "vitest";

import {
  createOrVerifyGitHubRelease,
  type GitHubReleaseClient,
} from "../../../../.github/scripts/create-github-release.ts";

function client(
  overrides: Partial<GitHubReleaseClient> = {},
): GitHubReleaseClient {
  return {
    async completeDraftRelease() {},
    async createAnnotatedTag() {
      return { sha: "tag-object" };
    },
    async createRelease() {},
    async createTagReference() {},
    async getAnnotatedTag() {
      return { object: { sha: "release", type: "commit" }, tag: "v1.0.0" };
    },
    async getRelease() {
      return undefined;
    },
    async getTagReference() {
      return undefined;
    },
    async verifyAsset() {},
    ...overrides,
  };
}

describe("create GitHub release", () => {
  it("creates an annotated tag before creating the release", async () => {
    // GIVEN: GitHub has neither release metadata nor a tag.
    const calls: string[] = [];
    const github = client({
      async createAnnotatedTag() {
        calls.push("tag-object");
        return { sha: "tag-object" };
      },
      async createRelease() {
        calls.push("release");
      },
      async createTagReference() {
        calls.push("tag-reference");
      },
      async verifyAsset() {
        calls.push("verify-asset");
      },
    });

    // WHEN: CD creates the release.
    const tagName = await createOrVerifyGitHubRelease(
      {
        assetPath: "package.tgz",
        notesPath: "release-notes.md",
        packageVersion: "1.0.0",
        prerelease: false,
        releaseSha: "release",
      },
      github,
    );

    // THEN: The immutable tag exists before the GitHub Release.
    assert.equal(tagName, "v1.0.0");
    assert.deepEqual(calls, [
      "tag-object",
      "tag-reference",
      "release",
      "verify-asset",
    ]);
  });

  it("rejects an existing tag on another commit", async () => {
    // GIVEN: An annotated tag resolves to a different commit.
    const github = client({
      async getAnnotatedTag() {
        return { object: { sha: "other", type: "commit" }, tag: "v1.0.0" };
      },
      async getTagReference() {
        return { object: { sha: "tag-object", type: "tag" } };
      },
    });

    // WHEN: CD attempts a safe resume.
    const creating = createOrVerifyGitHubRelease(
      {
        assetPath: "package.tgz",
        notesPath: "release-notes.md",
        packageVersion: "1.0.0",
        prerelease: false,
        releaseSha: "release",
      },
      github,
    );

    // THEN: The existing tag is never moved.
    await assert.rejects(creating, /does not point to the release commit/);
  });

  it("accepts existing compatible tag and release metadata", async () => {
    // GIVEN: GitHub already has the expected annotated tag and stable release.
    const calls: string[] = [];
    const github = client({
      async createAnnotatedTag() {
        calls.push("unexpected tag-object");
        return { sha: "new-tag-object" };
      },
      async createRelease() {
        calls.push("unexpected release");
      },
      async createTagReference() {
        calls.push("unexpected tag-reference");
      },
      async getAnnotatedTag() {
        return {
          object: { sha: "release", type: "commit" },
          tag: "v1.0.0",
        };
      },
      async getRelease() {
        return { draft: false, prerelease: false };
      },
      async getTagReference() {
        return { object: { sha: "tag-object", type: "tag" } };
      },
      async verifyAsset() {
        calls.push("verify-asset");
      },
    });

    // WHEN: CD resumes metadata creation for the same release.
    const tagName = await createOrVerifyGitHubRelease(
      {
        assetPath: "package.tgz",
        notesPath: "release-notes.md",
        packageVersion: "1.0.0",
        prerelease: false,
        releaseSha: "release",
      },
      github,
    );

    // THEN: Existing metadata is accepted without creating or moving anything.
    assert.equal(tagName, "v1.0.0");
    assert.deepEqual(calls, ["verify-asset"]);
  });

  it("completes a compatible draft before verifying its asset", async () => {
    // GIVEN: A previous attempt left a compatible draft release.
    const calls: string[] = [];
    const github = client({
      async completeDraftRelease() {
        calls.push("complete-draft");
      },
      async getAnnotatedTag() {
        return {
          object: { sha: "release", type: "commit" },
          tag: "v1.0.0-alpha.1",
        };
      },
      async getRelease() {
        return { draft: true, prerelease: true };
      },
      async getTagReference() {
        return { object: { sha: "tag-object", type: "tag" } };
      },
      async verifyAsset() {
        calls.push("verify-asset");
      },
    });

    // WHEN: CD safely resumes the release.
    await createOrVerifyGitHubRelease(
      {
        assetPath: "package.tgz",
        notesPath: "release-notes.md",
        packageVersion: "1.0.0-alpha.1",
        prerelease: true,
        releaseSha: "release",
      },
      github,
    );

    // THEN: The draft is published before its immutable asset is verified.
    assert.deepEqual(calls, ["complete-draft", "verify-asset"]);
  });
});
