<template>
  <figure
    class="apc-compiler-flow"
    role="img"
    aria-labelledby="compiler-flow-title compiler-flow-description"
  >
    <figcaption id="compiler-flow-title" class="apc-sr-only">
      Agent Plugin Compiler build flow
    </figcaption>
    <p id="compiler-flow-description" class="apc-sr-only">
      The authored plugin manifest, skill sources, and resources are validated
      as one dependency graph and compiled through one deterministic write plan
      into self-contained skills and exact provider manifests.
    </p>

    <div class="apc-compiler-flow__diagram" aria-hidden="true">
      <div class="apc-flow-source apc-flow-node">
        <span class="apc-flow-node__eyebrow">AUTHORED TREE</span>
        <strong>plugin/</strong>
        <span>plugin.yml</span>
        <span>skills/**</span>
        <span>resources</span>
      </div>

      <svg class="apc-flow-arrow apc-flow-arrow--input" viewBox="0 0 56 20">
        <path class="apc-flow-arrow__line" d="M0 10h56" />
        <path class="apc-flow-arrow__tip" d="m50 6 6 4-6 4" />
      </svg>

      <div class="apc-flow-compiler apc-flow-node">
        <img src="/logo.svg" alt="" />
        <strong>Compiler</strong>
        <span>validate · plan</span>
      </div>

      <svg
        class="apc-flow-arrow apc-flow-arrow--output"
        viewBox="0 0 70 118"
        preserveAspectRatio="none"
      >
        <path class="apc-flow-arrow__line" d="M0 59h24M24 22v74M24 22h46M24 96h46" />
        <path class="apc-flow-arrow__tip" d="m64 18 6 4-6 4M64 92l6 4-6 4" />
      </svg>

      <div class="apc-flow-outputs">
        <div class="apc-flow-output apc-flow-output--skills">
          <span class="apc-flow-node__eyebrow">SELF-CONTAINED</span>
          <strong>skills/**</strong>
          <span>public roots + dependencies</span>
        </div>
        <div class="apc-flow-output apc-flow-output--hosts">
          <span class="apc-flow-node__eyebrow">EXACT HOST FILES</span>
          <div class="apc-flow-provider-list">
            <span>Claude</span><span>Codex</span><span>Copilot</span>
            <span>Gemini</span><span>Kimi</span>
          </div>
        </div>
      </div>
    </div>
  </figure>
</template>
