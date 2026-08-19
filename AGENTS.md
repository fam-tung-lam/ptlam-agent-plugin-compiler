# AGENTS.md

<!-- PTLAM-SETUP-SKILL:START -->

## AGENTS.override.md has precedence

Read [AGENTS.override.md](AGENTS.override.md). It has precedence over this file.

<!-- PTLAM-SETUP-SKILL:END -->

Guidance for coding agents working in this repository.

`@fam-tung-lam/ptlam-agent-plugin-compiler` is a deterministic compiler: it
reads an authored plugin source tree (`plugin/plugin.yml`, `plugin/skills/**`,
optional `plugin/hooks/**`) in a _consumer's_ repository and writes shared
`skills/**`, `hooks/handlers/**`, and one manifest per host (Claude, Codex,
Copilot, Gemini, Kimi). This repository ships that compiler; it does not compile
itself. The only plugin source tree here is `examples/simple-agent-plugin/`.

## Sources of truth

Read these before changing anything non-trivial; do not restate them here.

- `docs/ARCHITECTURE.md` — module graph, allowed imports, domain models,
  operation flows, filesystem ownership, the portable hook seam.
- `docs/DEVELOPMENT.md` — project map, commands, test layers.
- `docs/RELEASE.md` — the release flow. Never bump `version` in `package.json`
  as part of a normal change; releases are a separate maintainer task.
- `README.md` — the supported public API, CLI, and project scope.

## Commands

```bash
npm run code:typecheck   # tsc --noEmit over src, tests, scripts, .github/scripts, webapp
npm run code:check       # module boundaries + biome (lint & format check)
npm run code:format      # biome check --write
npm run markdown:check   # prettier --check + markdownlint-cli2
npm run build            # clean, tsc build, finalize (shebang + schema copy), verify
npm test                 # build, then all Vitest tests
npm run test:coverage    # same, with V8 coverage thresholds enforced
npm run test:package     # smoke-test a packed .tgz in isolation
npm run webapp:dev       # VitePress docs site (webapp/)
```

CI (`.github/workflows/ci.yml`) runs, in order: package-metadata validation,
`npm ci`, release-version validation, `code:typecheck`, `code:check`,
`markdown:check`, `webapp:build`, `test:coverage`, then packs and exercises the
tarball. Run at least the first five locally before proposing a change.
