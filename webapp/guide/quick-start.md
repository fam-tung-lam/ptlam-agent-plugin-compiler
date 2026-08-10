# Quick Start

Once your repository contains an authored `plugin/**` source, decide which
skills users can install and where each skill is in its lifecycle. Then one
command validates the graph, writes deterministic output, and verifies the
result. See [Installation](/guide/installation) and the
[Authored Plugin Source](/reference/authored-source) if the source is not ready.

## Configure publication

Every skill in `plugin/plugin.yml` needs both `visibility` and `status`.
Together they control which skills become installable roots and which exist only
inside the skills that require them.

### Choose skill visibility

| Value      | Behavior                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `public`   | Eligible for publication as a root and still nested inside every published skill that requires it. |
| `internal` | Never published as a root; compiled only inside reachable published skills that depend on it.      |

Use `internal` for reusable procedures that should not appear as standalone
install choices. An active internal skill that cannot be reached from any
published root produces a warning because it contributes to no output.

```yaml
skills:
  - id: inspect-repository
    description: Collect verified repository facts.
    category_id: engineering
    visibility: internal
    status: active
    required_skills: []

  - id: prepare-change-plan
    description: Prepare a plan from verified facts.
    category_id: engineering
    visibility: public
    status: active
    required_skills:
      - skill_id: inspect-repository
        reason: The plan must reflect verified facts.
        instructions: Inspect the repository before preparing the plan.
```

### Choose lifecycle status

| Status       | Root publication and dependency rules                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `draft`      | Not published as a root. Active or deprecated skills cannot depend on it.                                   |
| `active`     | Published as a root when public; the normal state for supported skills.                                     |
| `deprecated` | Published as a root when public, requires deprecation guidance, and warns when another skill depends on it. |
| `archived`   | Not published as a root, requires archive metadata, and cannot be required by a non-archived skill.         |

Only public `active` and `deprecated` skills become root entries in `skills/**`.
Required skills are still nested according to the validated dependency graph.

#### Deprecate a skill

A deprecated skill must explain the migration. A replacement is optional, but
when present it must identify an active public skill.

```yaml
status: deprecated
deprecation:
  reason: A narrower workflow replaces this skill.
  instructions: Use prepare-focused-change instead.
  replacement_skill_id: prepare-focused-change
```

#### Archive a skill

An archived skill must record why it is no longer published. A replacement is
optional and follows the same active-public rule.

```yaml
status: archived
archive:
  reason: The workflow is no longer supported.
  replacement_skill_id: prepare-focused-change
```

Validation rejects incompatible lifecycle relationships before any output is
written. The [Manifest reference](/reference/manifest) documents every field.

## Compile and verify

Run this command from the plugin repository root:

```bash
npm exec -- plugin-compiler compile
```

The compiler validates the complete authored source, reconciles the root
`skills/` tree and the exact host manifest paths selected by
`plugin/plugin.yml`, then verifies the new state. These files are build results:
update `plugin/**` and compile again instead of editing them by hand.

### Inspect the self-contained skills

For example, a public skill with one internal dependency compiles to this shared
tree:

```text
skills/
├── README.md
├── prepare-change-plan/
│   ├── SKILL.md
│   └── skills/
│       └── inspect-repository/
│           └── SKILL.md
└── write-commit-message/
    └── SKILL.md
```

`prepare-change-plan` can be installed by itself because its internal
`inspect-repository` dependency is nested inside it. If a required skill is
public, it is nested where needed and also emitted as its own root skill.
`skills/README.md` catalogs the published roots.

### Inspect the selected host manifests

The same validated plugin model produces the built-in host files:

| Provider | Managed manifest paths                                          |
| -------- | --------------------------------------------------------------- |
| Claude   | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| Codex    | `.codex-plugin/plugin.json`                                     |
| Copilot  | `plugin.json`                                                   |
| Gemini   | `gemini-extension.json`                                         |
| Kimi     | `kimi.plugin.json`                                              |

Without an override, `compile` uses the manifest's `providers` list. Replace it
for one run with a comma-separated selection:

```bash
npm exec -- plugin-compiler compile --provider claude,codex
```

Compile shared skills without host manifests with `--no-providers`. The two
provider options are mutually exclusive. Changing the selection removes stale
built-in manifest files from their declared exact paths while leaving unrelated
repository files outside the write plan.

Next: compare [provider contracts](/reference/providers), inspect the complete
[Manifest reference](/reference/manifest), or use the compiler
[programmatically](/guide/programmatic-usage).
