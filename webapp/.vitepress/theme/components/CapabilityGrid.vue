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
 * cannot drift from its title. The previous version looped over this array and
 * then re-branched on `index` inside the loop, so renumbering a step, or
 * adding a fifth, silently rendered one step's prose under another's heading.
 */
const steps: readonly PipelineStep[] = [
  {
    index: "01",
    stage: "source",
    title: "Author the complete plugin",
    body: [
      { text: "Keep metadata and dependencies in " },
      { code: true, text: "plugin/plugin.yml" },
      { text: ", with every authored skill under " },
      { code: true, text: "plugin/skills/**" },
      { text: "." },
    ],
  },
  {
    index: "02",
    stage: "validate",
    title: "Prove the skill graph",
    body: [
      {
        text: "Validate schema, Markdown links, lifecycle rules, and recursive skill dependencies before any generated path changes.",
      },
    ],
  },
  {
    index: "03",
    stage: "compile",
    title: "Build self-contained skills",
    body: [
      {
        text: "Compile each public root with the required skills it needs, then reconcile the compiler-owned ",
      },
      { code: true, text: "skills/**" },
      { text: " tree atomically." },
    ],
  },
  {
    index: "04",
    stage: "providers",
    title: "Emit exact host contracts",
    body: [
      {
        text: "Project the same validated model into each selected provider’s exact manifest format.",
      },
    ],
  },
];
</script>

<template>
  <section class="apc-section" aria-labelledby="apc-pipeline-title">
    <div class="apc-section__inner">
      <header class="apc-section__head">
        <span class="apc-eyebrow">Compiler pipeline</span>
        <h2 id="apc-pipeline-title" class="apc-section__title">
          One authored tree. Verified output.
        </h2>
        <p class="apc-section__lede">
          Every compile walks the same four stages in the same order, and stops
          at the first one that cannot prove its result.
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
