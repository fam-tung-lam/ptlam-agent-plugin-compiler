<script setup lang="ts">
type Command = {
  readonly name: string;
  readonly writes: string | undefined;
  readonly purpose: string;
};

/** `writes` is undefined for the two commands that never touch output. */
const commands: readonly Command[] = [
  {
    name: "init",
    writes: "missing source paths",
    purpose: "Create a safe starter",
  },
  {
    name: "validate",
    writes: undefined,
    purpose: "Validate manifest, skills, hooks, and graph",
  },
  {
    name: "compile",
    writes: "managed output",
    purpose: "Compile and verify managed output",
  },
  {
    name: "check",
    writes: undefined,
    purpose: "Report generated drift",
  },
];
</script>

<template>
  <section class="apc-section" aria-labelledby="apc-commands-title">
    <div class="apc-section__inner">
      <header class="apc-section__head">
        <span class="apc-eyebrow">Command surface</span>
        <h2 id="apc-commands-title" class="apc-section__title">
          Four commands, and only two of them write
        </h2>
        <p class="apc-section__lede">
          The package installs one executable, <code>plugin-compiler</code>. Run
          it through <code>npm exec --</code> in a repository that has the
          package installed.
        </p>
      </header>

      <ul class="apc-commands">
        <li v-for="command in commands" :key="command.name" class="apc-command">
          <p class="apc-command__head">
            <code class="apc-command__name">{{ command.name }}</code>
            <span
              v-if="command.writes !== undefined"
              class="apc-chip apc-chip--accent"
            >
              writes {{ command.writes }}
            </span>
            <span v-else class="apc-chip">reads only</span>
          </p>
          <p class="apc-command__purpose">{{ command.purpose }}</p>
        </li>
      </ul>

      <p class="apc-section__footnote">
        Every command takes <code>--root</code>, and
        <code>validate</code>, <code>compile</code>, and <code>check</code> take
        one provider selection &mdash; see the
        <a href="/reference/cli">CLI reference</a>.
      </p>
    </div>
  </section>
</template>
