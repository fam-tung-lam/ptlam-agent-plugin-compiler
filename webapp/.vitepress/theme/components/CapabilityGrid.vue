<script setup lang="ts">
type PipelineStep = {
  readonly index: string;
  readonly stage: string;
  readonly title: string;
};

/**
 * Prose stays in the template so the code fragments inside it keep their
 * `<code>` markup; only the fixed labels are data.
 */
const steps: readonly PipelineStep[] = [
  { index: "01", stage: "source", title: "Author the complete plugin" },
  { index: "02", stage: "validate", title: "Prove the skill graph" },
  { index: "03", stage: "compile", title: "Build self-contained skills" },
  { index: "04", stage: "providers", title: "Emit exact host contracts" },
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
          Every run walks the same four stages in the same order, and stops at
          the first one that cannot prove its result.
        </p>
      </header>

      <ol class="apc-pipeline">
        <li v-for="step in steps" :key="step.index" class="apc-pipeline__step">
          <p class="apc-pipeline__marker">
            <span class="apc-pipeline__index">{{ step.index }}</span>
            <span class="apc-pipeline__stage">{{ step.stage }}</span>
          </p>
          <h3 class="apc-pipeline__title">{{ step.title }}</h3>

          <p v-if="step.index === '01'" class="apc-pipeline__body">
            Keep metadata and dependencies in <code>plugin/plugin.yml</code>,
            with every authored skill under <code>plugin/skills/**</code>.
          </p>
          <p v-else-if="step.index === '02'" class="apc-pipeline__body">
            Validate schema, Markdown links, lifecycle rules, and recursive skill
            dependencies before any generated path changes.
          </p>
          <p v-else-if="step.index === '03'" class="apc-pipeline__body">
            Compile each public root with the required skills it needs, then
            reconcile the compiler-owned <code>skills/**</code> tree atomically.
          </p>
          <p v-else class="apc-pipeline__body">
            Project the same validated model into each selected provider&#39;s
            exact manifest format.
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
