<script setup lang="ts">
type ExitCode = {
  readonly code: string;
  readonly meaning: string;
};

const exitCodes: readonly ExitCode[] = [
  { code: "0", meaning: "The request completed successfully" },
  {
    code: "1",
    meaning: "Compilation, validation, or generated-state verification failed",
  },
  { code: "2", meaning: "CLI syntax or option usage was invalid" },
];
</script>

<template>
  <section class="apc-section apc-section--soft" aria-labelledby="apc-verify-title">
    <div class="apc-section__inner">
      <header class="apc-section__head">
        <span class="apc-eyebrow">Verifiable in CI</span>
        <h2 id="apc-verify-title" class="apc-section__title">
          Stale generated output becomes a failing build
        </h2>
        <p class="apc-section__lede">
          The same authored source always compiles to the same bytes, and the
          compiler declares exactly which paths it owns. So it can compare the
          committed output with what the source implies.
        </p>
      </header>

      <div class="apc-verify">
        <div class="apc-verify__terminal">
          <p class="apc-verify__bar">
            <span class="apc-eyebrow">plugin-compiler check</span>
            <span class="apc-chip apc-chip--warn">
              <i class="apc-chip__dot"></i>exit 1
            </span>
          </p>
<pre class="apc-code"><span class="apc-code__dim">$</span> npm exec -- plugin-compiler check
Output check found 1 drift entry:
- <span class="apc-fact apc-fact--loose">skills/prepare-change-plan/SKILL.md: content-differs</span></pre>
          <p class="apc-verify__caption">
            <code>check</code> writes nothing, names every path that drifted, and
            exits non-zero. No extra scripting is needed to fail a job.
          </p>
        </div>

        <div class="apc-verify__codes">
          <p class="apc-eyebrow">Exit codes</p>
          <dl class="apc-exits">
            <template v-for="exit in exitCodes" :key="exit.code">
              <dt><code>{{ exit.code }}</code></dt>
              <dd>{{ exit.meaning }}</dd>
            </template>
          </dl>
          <p class="apc-section__footnote">
            Wire it into a workflow with
            <a href="/guide/continuous-integration">Continuous integration</a>.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
