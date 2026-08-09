# Release

This runbook publishes `@fam-tung-lam/ptlam-agent-plugin-compiler` through npm
trusted publishing. npm versions are immutable; never reuse one.

## Release flow

```mermaid
flowchart LR
  Version[Merge an unused version] --> Dispatch[Run Release from main]
  Dispatch --> Approval[Approve the npm-release environment]
  Approval --> Verify[Build and test one tarball]
  Verify --> Publish[Publish that tarball through OIDC]
```

The release workflow builds, tests, packs, and publishes in one job. It does not
move artifacts between workflows or create custom evidence files.

## One-time configuration

| Gate                  | Required state                                         |
| --------------------- | ------------------------------------------------------ |
| GitHub environment    | `npm-release` requires maintainer approval             |
| Deployment branch     | `npm-release` allows only `main`                       |
| npm trusted publisher | Bind this repository, `release.yml`, and `npm-release` |
| npm action            | Allow direct `npm publish`                             |
| npm access            | Disallow long-lived write tokens after OIDC is working |

The workflow needs `id-token: write`; it does not need an npm token.

## Version and channel

| Version         | npm tag  |
| --------------- | -------- |
| `1.2.3`         | `latest` |
| `1.2.3-alpha.1` | `next`   |

## Publish a version

1. Choose a version that does not exist on npm.
2. Update `package.json` and `package-lock.json` in a pull request.
3. Merge only after `CI Required` succeeds.
4. Open the `Release` workflow, select `main`, and run it.
5. Review and approve the `npm-release` environment.

```bash
version="1.2.3"

npm view "@fam-tung-lam/ptlam-agent-plugin-compiler@${version}" version

npm version "${version}" --no-git-tag-version
npm run code:typecheck
npm run code:check
npm test
npm run markdown:check
```

The npm lookup should report that the version is missing. The workflow accepts
only a dispatch from `main`, then:

1. builds and runs the normal tests;
2. creates one `.tgz` with `npm pack`;
3. installs and exercises that exact tarball in a clean temporary consumer; and
4. passes that same file to `npm publish` with an explicit `latest` or `next`
   tag.

A successful `npm publish` completes the release. npm trusted publishing adds
provenance automatically for this public package.

## Failures

- If validation fails before publication, fix `main`, wait for CI, and dispatch
  the workflow again.
- If authentication fails, fix the trusted-publisher or environment binding; do
  not add a long-lived write token.
- If publication times out or the job is interrupted, check
  `npm view "@fam-tung-lam/ptlam-agent-plugin-compiler@<version>"` before
  retrying.
- If a version is already public, never publish different bytes under it.
- If a released package is defective, publish a corrected version. Do not
  overwrite the existing version.
