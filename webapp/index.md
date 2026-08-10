---
layout: home
title: Agent Plugin Compiler

hero:
  name: Agent Plugin Compiler
  text: Author once. Validate the graph. Generate every host manifest.
  tagline: >-
    Build self-contained agent skill plugins from one explicit authored source,
    with deterministic output for Claude, Codex, Copilot, Gemini, and Kimi.
  image:
    src: /logo.svg
    alt: Agent Plugin Compiler mark
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Explore the reference
      link: /reference/

features:
  - title: Dependency-aware skills
    details: >-
      Declare why one skill requires another. The compiler validates the graph
      and builds self-contained public skills.
  - title: One authored source
    details: >-
      Keep plugin metadata, lifecycle state, visibility, categories, and
      provider selection in plugin/plugin.yml.
  - title: Deterministic output
    details: >-
      Generate the shared skills tree and selected provider manifests, then use
      check to detect drift without writing.
  - title: Five built-in providers
    details: >-
      Produce contracts for Claude, Codex, GitHub Copilot CLI, Gemini CLI, and
      Kimi Code CLI from the same validated model.
---

## A build step for agent skills

Agent skills often start as Markdown files, but a publishable plugin also needs
dependency instructions, catalog metadata, lifecycle rules, and host-specific
manifests. Maintaining those copies by hand makes incomplete installations and
silent drift easy.

Agent Plugin Compiler moves that coordination into a repeatable build:

```text
plugin/plugin.yml + plugin/skills/**
                  │
                  ▼
        validate → generate → check
                  │
                  ▼
      skills/** + provider manifests
```

The current public contract is `0.1.0-alpha.4`.

```bash
npm install --save-dev --save-exact \
  @fam-tung-lam/ptlam-agent-plugin-compiler@next

npm exec -- plugin-compiler init
npm exec -- plugin-compiler validate
npm exec -- plugin-compiler generate
npm exec -- plugin-compiler check
```

[Understand the workflow →](/guide/introduction)
