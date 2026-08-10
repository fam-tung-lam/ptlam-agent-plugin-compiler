# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added `plugin-compiler init [--root <path>]` to create missing authored paths
  without changing existing content. A new manifest is a schema-valid commented
  template with matching standalone, dependency, and dependent example skill
  sources.
- Added structured root help for the CLI command overview and focused `-h` or
  `--help` output for `init`, `validate`, `check`, and `generate`, including
  each command's usage and options.
- Added `--no-providers` for an explicit shared-skills-only CLI override.
- Added opt-in GitHub Copilot CLI (`plugin.json`), Gemini CLI
  (`gemini-extension.json`), and Kimi Code CLI (`kimi.plugin.json`) provider
  adapters with pinned conformance contracts.

### Changed

- **Breaking:** Replaced repeated `--provider` flags with one comma-separated
  provider list. Migrate `--provider claude --provider codex` to
  `--provider claude,codex`.
- **Breaking:** Manifest schema v1 now requires a top-level `providers` list and
  no longer accepts the Claude-specific `marketplace` block. Use `providers: []`
  for shared skills only; Claude marketplace metadata is derived from common
  plugin metadata.
- **Breaking:** `CompilerOptionsInput.providers` is now optional. Omitting it or
  both CLI provider options uses `plugin/plugin.yml`; an explicit list replaces
  the manifest selection, and `[]` or `--no-providers` replaces it with none.
- Validation, check, and compile results now report immutable effective
  providers and a `manifest` or `override` selection source.
- Check and compile now reconcile every registered provider-owned exact file,
  reporting or removing stale manifests for unselected registered providers
  while preserving unrelated paths.

## [0.1.0-alpha.3] - 2026-08-10

### Changed

- **Breaking:** Replaced the closed `Provider` enum (`Provider.Claude` and
  `Provider.Codex`) with branded `ProviderId` values and the `CLAUDE` and
  `CODEX` constants. The global `availableProviders` and `resolveProviders`
  lookup became an immutable per-instance `ProviderAdapterRegistry`, which is
  also the extension seam for custom adapters.
- **Breaking:** Renamed parsed `Plugin` and `Skill` values to `PluginManifest`
  and `SkillManifest`, and renamed `ValidatedPlugin` and `ValidatedSkill` to the
  domain names `Plugin` and `Skill`. Their input types, constructors, and result
  types follow the same naming change; skill and category references now use
  branded `SkillId` and `CategoryId` values instead of plain strings.
- **Breaking:** Replaced stage-based generated names with domain names:
  `OutputFragment` with `PlanFragment`, `OutputPlan` with `WritePlan`,
  `OutputState` with `GeneratedSnapshot`, `OutputDifference` with `DriftEntry`,
  `OutputDifferenceReason` with `DriftReason`, `PlannedArtifact` with
  `Artifact`, `OutputEntryKind` with `ArtifactKind`, `OutputOwnership` with
  `Ownership`, and `OutputOwnershipKind` with `OwnershipKind`. `ProjectSnapshot`
  became `PluginSnapshot`, and the pure `OutputStateEntry` aliases were removed.
- **Breaking:** Renamed `CheckResult.differences` and
  `CompileResult.differences` to `drift`, and renamed `renderSkillManifest()` to
  `renderSkillDocument()`.
- Made the `<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->` placement marker optional.
  An explicit marker still selects the insertion point; without one, generated
  required-skill guidance appears after the top-level title and introductory
  paragraphs, before the next top-level block.

## [0.1.0-alpha.2] - 2026-08-09

### Changed

- **Breaking:** Replaced the package-root `PluginCompiler` Node.js API with
  `AgentPluginCompiler`, renamed `generate()` to `compile()` and
  `GenerateResult` to `CompileResult`, and replaced string-based `providerIds`
  with the exported `Provider` enum passed through `providers`. The CLI command
  remains `plugin-compiler generate`.
- **Breaking:** For alpha consumers, generated required skills now live under
  `skills/<root-skill>/skills/<required-skill>/` instead of
  `skills/<root-skill>/references/required-skills/<required-skill>/`. The
  compiler now reserves the top-level `skills/` directory inside each authored
  skill.

## [0.1.0-alpha.1] - 2026-08-09

### Added

- Published the first standalone alpha of
  `@fam-tung-lam/ptlam-agent-plugin-compiler` for Node.js `>=22.6.0`.
- Added the package-root `PluginCompiler` ESM API and the local
  `plugin-compiler` CLI with `validate`, `check`, and `generate` operations.
- Added deterministic validation and compilation of manifest-v1 agent-plugin
  repositories into shared skills plus Claude and Codex provider artifacts.
- Added manifest, skill-source, required-skill graph, Markdown-link,
  output-path, and symlink-safety validation.
- Added drift detection, recoverable managed-tree replacement, atomic standalone
  file writes, and post-write verification for generated output.

[Unreleased]:
  https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/compare/v0.1.0-alpha.3...HEAD
[0.1.0-alpha.3]:
  https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]:
  https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]:
  https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/releases/tag/v0.1.0-alpha.1
