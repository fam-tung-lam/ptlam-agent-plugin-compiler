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
