<script setup lang="ts">
/**
 * The before/after argument from guide/introduction.md, shown rather than
 * restated. Both code panels quote that page verbatim; the only edit is a
 * narrower reflow of the prose excerpt so the four highlighted facts stay in
 * view on a phone instead of sitting past the horizontal scroll.
 */
</script>

<template>
  <section class="apc-section apc-section--soft" aria-labelledby="apc-contrast-title">
    <div class="apc-section__inner">
      <header class="apc-section__head">
        <span class="apc-eyebrow">The problem, shown</span>
        <h2 id="apc-contrast-title" class="apc-section__title">
          A dependency nothing checks, or a dependency that is data
        </h2>
        <p class="apc-section__lede">
          An agent skill is a directory with a Markdown file in it. That is the
          whole format: no place to record what a skill depends on, nothing that
          resolves a reference, and no build step that fails when one goes stale.
        </p>
      </header>

      <div class="apc-contrast">
        <article class="apc-contrast__panel">
          <header class="apc-contrast__head">
            <span class="apc-chip apc-chip--warn">
              <i class="apc-chip__dot"></i>nothing checks it
            </span>
            <h3 class="apc-contrast__title">The dependency as prose</h3>
            <p class="apc-contrast__path">
              <code>plugin/skills/skill-a/SKILL.md</code>
            </p>
          </header>

<pre class="apc-code"><span class="apc-code__dim"># Skill A</span>

Summarize the release.

Run <span class="apc-fact apc-fact--loose">`skill-b`</span> first to collect the commit facts,
<span class="apc-fact apc-fact--loose">because the summary must not invent them.</span>
<span class="apc-fact apc-fact--loose">Pass the table it returns into step 2 unchanged.</span>
Its input format is described in
<span class="apc-fact apc-fact--loose">[skill-b](../skill-b/SKILL.md)</span>.

1. Read the milestone.
2. Group the commit facts by area.</pre>

          <p class="apc-contrast__caption">
            Four facts are hard-coded in that paragraph: the other skill&#39;s
            name, why it is required, how to call it, and where it lives. Nothing
            checks any of them, and the same paragraph is copied into every skill
            with the same dependency. Rename <code>skill-b</code> and the plugin
            still ships, pointing an agent at a skill that no longer exists.
          </p>
        </article>

        <article class="apc-contrast__panel">
          <header class="apc-contrast__head">
            <span class="apc-chip apc-chip--ok">
              <i class="apc-chip__dot"></i>validated every compile
            </span>
            <h3 class="apc-contrast__title">The dependency as data</h3>
            <p class="apc-contrast__path"><code>plugin/plugin.yml</code></p>
          </header>

<pre class="apc-code">- id: skill-a
  description: Summarize the release.
  category_id: example
  visibility: public
  status: active
  required_skills:
    - <span class="apc-fact apc-fact--declared">skill_id: skill-b</span>
      <span class="apc-fact apc-fact--declared">reason: The summary must not invent commit facts.</span>
      <span class="apc-fact apc-fact--declared">instructions: Run skill-b first and pass its table into step 2 unchanged.</span></pre>

          <p class="apc-contrast__caption">
            Three fields carry the dependency. The compiler writes the link, the
            frontmatter, and the required-skills section into the generated
            skill, and nests the required skill inside it.
          </p>

          <div class="apc-contrast__aside">
            <p class="apc-contrast__path">
              <code>plugin/skills/skill-a/SKILL.md</code>
            </p>

<pre class="apc-code"><span class="apc-code__dim"># Skill A</span>

Summarize the release.

1. Read the milestone.
2. Group the commit facts by area.</pre>

            <p class="apc-contrast__caption">
              The authored file no longer mentions <code>skill-b</code> at all.
            </p>
          </div>
        </article>
      </div>

      <p class="apc-contrast__payoff">
        Rename <code>skill-b</code> and every dependent skill is rewritten on the
        next compile. Remove it and validation fails with the exact manifest
        location instead of publishing a dangling reference.
      </p>
    </div>
  </section>
</template>
