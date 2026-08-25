<script setup lang="ts">
type NextStep = {
  readonly link: string;
  readonly title: string;
  readonly summary: string;
};

const steps: readonly NextStep[] = [
  {
    link: "/guide/quick-start",
    title: "Quick Start",
    summary:
      "Go from a repository with no plugin to compiled, verified output. Every file and command on one page.",
  },
  {
    link: "/guide/skill-graph",
    title: "Skill graph",
    summary:
      "Required skills, visibility, and lifecycle status, and the rules validation enforces between them.",
  },
  {
    link: "/reference/manifest",
    title: "Manifest reference",
    summary:
      "The closed contract for plugin.yml: schema versions 1 and 2, every property, every constraint.",
  },
  {
    link: "/guide/programmatic-usage",
    title: "Programmatic usage",
    summary:
      "Drive AgentPluginCompiler from Node.js, and register an adapter for a host the compiler does not ship.",
  },
];
</script>

<template>
  <section class="apc-section" aria-labelledby="apc-next-title">
    <div class="apc-section__inner">
      <header class="apc-section__head">
        <span class="apc-eyebrow">Where to go next</span>
        <h2 id="apc-next-title" class="apc-section__title">Start compiling</h2>
      </header>

      <ul class="apc-next">
        <li v-for="step in steps" :key="step.link">
          <a class="apc-next__card" :href="step.link">
            <span class="apc-next__title">
              {{ step.title }}
              <svg
                class="apc-next__arrow"
                viewBox="0 0 16 16"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M3 8h9" />
                <path d="m8 4 4 4-4 4" />
              </svg>
            </span>
            <span class="apc-next__summary">{{ step.summary }}</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
