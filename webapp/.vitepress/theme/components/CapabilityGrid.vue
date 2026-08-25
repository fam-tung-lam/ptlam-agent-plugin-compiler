<script setup lang="ts">
type BodySegment = {
  /** Rendered as inline code when true, as prose otherwise. */
  readonly code?: boolean;
  readonly text: string;
};

type PipelineStep = {
  readonly index: string;
  readonly stage: string;
  readonly title: string;
  readonly body: readonly BodySegment[];
};

/*
 * The body is segmented data rather than template prose so that a step's text
 * cannot drift from its title. An earlier version looped over this array and
 * then re-branched on `index` inside the loop, so renumbering a step, or
 * adding one, silently rendered one step's prose under another's heading.
 */
const steps: readonly PipelineStep[] = [
  {
    index: "01",
    stage: "model",
    title: "Declare the graph and lifecycle",
    body: [
      {
        text: "Give dependencies, visibility, status, migration guidance, and manual-only invocation one source of truth in ",
      },
      { code: true, text: "plugin/plugin.yml" },
      { text: "." },
    ],
  },
  {
    index: "02",
    stage: "validate",
    title: "Catch stale contracts before output",
    body: [
      {
        text: "Validate schema, source layout, Markdown links, lifecycle rules, and recursive dependencies before any generated path changes.",
      },
    ],
  },
  {
    index: "03",
    stage: "package",
    title: "Ship complete installable skills",
    body: [
      {
        text: "Compile each public root with generated frontmatter, dependency instructions, supporting files, and every required skill nested recursively.",
      },
    ],
  },
  {
    index: "04",
    stage: "catalog",
    title: "Review the published graph",
    body: [
      {
        text: "Generate an installable-skill table and Mermaid dependency graph, grouped by category and labelled with lifecycle status and visibility.",
      },
    ],
  },
  {
    index: "05",
    stage: "translate",
    title: "Target five hosts from one source",
    body: [
      {
        text: "Emit exact manifests and translate portable hooks only where Claude, Codex, Copilot, Gemini, or Kimi exposes equivalent native events.",
      },
    ],
  },
  {
    index: "06",
    stage: "verify",
    title: "Make generated state a build gate",
    body: [
      {
        text: "Write bounded output with atomic file and tree operations, verify it from disk, and use read-only ",
      },
      { code: true, text: "check" },
      { text: " to fail CI on deterministic drift." },
    ],
  },
];
</script>

<template>
  <section class="apc-section" aria-labelledby="apc-pipeline-title">
    <div class="apc-section__inner">
      <header class="apc-section__head">
        <span class="apc-eyebrow">What the compiler gives you</span>
        <h2 id="apc-pipeline-title" class="apc-section__title">
          From a skill graph to a release-ready plugin.
        </h2>
        <p class="apc-section__lede">
          Every compile walks these stages in order, and stops at the first one
          that cannot prove its result.
        </p>
      </header>

      <ol class="apc-pipeline">
        <li v-for="step in steps" :key="step.index" class="apc-pipeline__step">
          <p class="apc-pipeline__marker">
            <span class="apc-pipeline__index">{{ step.index }}</span>
            <span class="apc-pipeline__stage">{{ step.stage }}</span>
          </p>
          <h3 class="apc-pipeline__title">{{ step.title }}</h3>

          <p class="apc-pipeline__body">
            <template v-for="(segment, index) in step.body" :key="index"
              ><code v-if="segment.code">{{ segment.text }}</code
              ><template v-else>{{ segment.text }}</template></template
            >
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
