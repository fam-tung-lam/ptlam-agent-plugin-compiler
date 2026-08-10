<template>
  <figure
    class="apc-compiler-flow"
    role="img"
    aria-labelledby="compiler-flow-title compiler-flow-description"
  >
    <figcaption id="compiler-flow-title" class="apc-sr-only">
      Agent Plugin Compiler build pipeline
    </figcaption>
    <p id="compiler-flow-description" class="apc-sr-only">
      The authored plugin manifest and skill sources are validated and compiled
      through one deterministic write plan into self-contained skills and exact
      provider manifest files.
    </p>

    <div class="apc-compiler-flow__bar" aria-hidden="true">
      <span>COMPILATION PIPELINE</span>
      <span class="apc-compiler-flow__status"><i></i>DETERMINISTIC</span>
    </div>

    <div class="apc-compiler-flow__diagram" aria-hidden="true">
      <div class="apc-flow-node apc-flow-source">
        <span class="apc-flow-node__eyebrow">AUTHORED PLUGIN</span>
        <strong>plugin/</strong>
        <div class="apc-flow-tree__entry">
          <code>plugin.yml</code>
          <span>metadata, providers, and skill graph</span>
        </div>
        <div class="apc-flow-tree__entry">
          <code>skills/**</code>
          <span>authored instructions and supporting files</span>
        </div>
      </div>

      <svg class="apc-flow-arrow apc-flow-arrow--input" viewBox="0 0 320 54">
        <defs>
          <marker id="apc-input-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 8 4 0 8Z" />
          </marker>
        </defs>
        <path d="M160 0v49" marker-end="url(#apc-input-tip)" />
        <text x="172" y="29">validate source</text>
      </svg>

      <div class="apc-flow-node apc-flow-compiler">
        <img src="/logo.svg" alt="" />
        <div>
          <strong>Compiler</strong>
          <span>validate graph · build write plan</span>
        </div>
      </div>

      <svg class="apc-flow-arrow apc-flow-arrow--outputs" viewBox="0 0 360 82">
        <defs>
          <marker id="apc-output-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 8 4 0 8Z" />
          </marker>
        </defs>
        <path d="M180 0v77" marker-end="url(#apc-output-tip)" />
        <text x="192" y="43">compile output</text>
      </svg>

      <div class="apc-flow-node apc-flow-output">
        <span class="apc-flow-node__eyebrow">GENERATED PLUGIN</span>
        <strong>compiler-owned output</strong>
        <div class="apc-flow-tree__entry">
          <code>skills/**</code>
          <span>self-contained public skills</span>
        </div>
        <div class="apc-flow-tree__entry">
          <code>host files</code>
          <span>exact manifests for selected providers</span>
        </div>
      </div>
    </div>
  </figure>
</template>
