<template>
  <figure
    class="apc-graph"
    role="img"
    aria-labelledby="ownership-map-title ownership-map-description"
  >
    <figcaption id="ownership-map-title" class="apc-sr-only">
      Which repository paths the compiler owns
    </figcaption>
    <p id="ownership-map-description" class="apc-sr-only">
      Everything under the plugin directory is authored by you and never
      rewritten. The compiler owns the whole root skills directory as one tree,
      so any file inside it that the manifest does not imply is removed on the
      next compile. Each built-in provider owns exact manifest files: the two
      Claude manifests, the Codex manifest, the root plugin.json used by Copilot
      CLI, the Gemini extension manifest, and the Kimi manifest. Every other
      path in the repository stays outside the write plan and is left untouched.
    </p>

    <div class="apc-graph__panel" aria-hidden="true">
      <span class="apc-graph__eyebrow">Repository root</span>

      <ul class="apc-graph__tree">
        <li class="apc-graph__row apc-graph__row--d0">
          <code>plugin/</code>
          <i class="apc-tag apc-tag--authored">authored</i>
          <span>you own every file here</span>
        </li>
        <li class="apc-graph__row apc-graph__row--d1">
          <code>plugin.yml</code>
        </li>
        <li class="apc-graph__row apc-graph__row--d1">
          <code>skills/&lt;skill-id&gt;/SKILL.md</code>
        </li>

        <li class="apc-graph__row apc-graph__row--d0 apc-graph__row--lead">
          <code>skills/</code>
          <i class="apc-tag apc-tag--generated">complete tree</i>
          <span>compiler owns everything inside</span>
        </li>
        <li class="apc-graph__row apc-graph__row--d1">
          <code>README.md</code>
        </li>
        <li class="apc-graph__row apc-graph__row--d1">
          <code>&lt;public-skill&gt;/SKILL.md</code>
        </li>
        <li class="apc-graph__row apc-graph__row--d2">
          <code>skills/&lt;required-skill&gt;/SKILL.md</code>
        </li>

        <li class="apc-graph__row apc-graph__row--d0 apc-graph__row--lead">
          <code>.claude-plugin/plugin.json</code>
          <i class="apc-tag apc-tag--generated">exact file</i>
        </li>
        <li class="apc-graph__row apc-graph__row--d0">
          <code>.claude-plugin/marketplace.json</code>
          <i class="apc-tag apc-tag--generated">exact file</i>
        </li>
        <li class="apc-graph__row apc-graph__row--d0">
          <code>.codex-plugin/plugin.json</code>
          <i class="apc-tag apc-tag--generated">exact file</i>
        </li>
        <li class="apc-graph__row apc-graph__row--d0">
          <code>plugin.json</code>
          <i class="apc-tag apc-tag--generated">exact file</i>
        </li>
        <li class="apc-graph__row apc-graph__row--d0">
          <code>gemini-extension.json</code>
          <i class="apc-tag apc-tag--generated">exact file</i>
        </li>
        <li class="apc-graph__row apc-graph__row--d0">
          <code>kimi.plugin.json</code>
          <i class="apc-tag apc-tag--generated">exact file</i>
        </li>

        <li class="apc-graph__row apc-graph__row--d0 apc-graph__row--lead">
          <code>everything else</code>
          <i class="apc-tag">untouched</i>
          <span>outside the write plan</span>
        </li>
      </ul>
    </div>
  </figure>
</template>
