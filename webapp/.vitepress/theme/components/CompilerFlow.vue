<script setup lang="ts">
/**
 * Hero visual: what the compiler reads and what it writes.
 *
 * Deliberately narrower than a full pipeline diagram. The hero column is about
 * 480px wide at its widest, and the four-stage pipeline could only fit there by
 * shrinking labels below the 11px floor. This shows the two ends — authored
 * input, generated output — at readable size, and the pipeline itself is shown
 * at full width further down the page.
 */
</script>

<template>
  <figure
    class="apc-hero-flow"
    role="img"
    aria-labelledby="apc-hero-flow-title"
    aria-describedby="apc-hero-flow-description"
  >
    <figcaption id="apc-hero-flow-title" class="apc-sr-only">
      What one compile reads and what it writes
    </figcaption>
    <p id="apc-hero-flow-description" class="apc-sr-only">
      The compiler reads two authored paths: plugin/plugin.yml, holding
      metadata, provider selection, and the skill graph, and plugin/skills, one
      Markdown file per skill. Running plugin-compiler compile validates that
      source and writes two generated paths: a skills tree of self-contained
      public skills, and one exact manifest file for each selected host.
    </p>

    <div class="apc-hero-flow__card" aria-hidden="true">
      <div class="apc-hero-flow__bar">
        <code class="apc-hero-flow__command">plugin-compiler compile</code>
        <span class="apc-chip apc-chip--ok">
          <i class="apc-chip__dot"></i>deterministic
        </span>
      </div>

      <div class="apc-hero-flow__stage">
        <span class="apc-eyebrow">You author</span>
        <ul class="apc-hero-flow__files">
          <li>
            <code>plugin/plugin.yml</code>
            <span>metadata, providers, skill graph</span>
          </li>
          <li>
            <code>plugin/skills/**</code>
            <span>one Markdown file per skill</span>
          </li>
        </ul>
      </div>

      <div class="apc-hero-flow__link">
        <svg class="apc-hero-flow__arrow" viewBox="0 0 12 32" focusable="false">
          <path d="M6 1v29" />
          <path d="m1.5 24.5 4.5 5.5 4.5-5.5" />
        </svg>
        <span>validate, then write</span>
      </div>

      <div class="apc-hero-flow__stage apc-hero-flow__stage--generated">
        <span class="apc-eyebrow">The compiler owns</span>
        <ul class="apc-hero-flow__files">
          <li>
            <code>skills/**</code>
            <span>self-contained public skills</span>
          </li>
          <li>
            <code>host manifests</code>
            <span>one exact file per selected host</span>
          </li>
        </ul>
      </div>
    </div>
  </figure>
</template>
