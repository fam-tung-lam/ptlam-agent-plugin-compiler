<template>
  <figure
    class="apc-matrix"
    role="img"
    aria-labelledby="publication-matrix-title publication-matrix-description"
  >
    <figcaption id="publication-matrix-title" class="apc-sr-only">
      What visibility and lifecycle status compile to
    </figcaption>
    <p id="publication-matrix-description" class="apc-sr-only">
      Status decides whether a skill is compiled at all, and visibility decides
      whether it is installable on its own. Draft and archived skills are never
      compiled, whatever their visibility. An active or deprecated internal
      skill is compiled only inside the published skills that require it. An
      active or deprecated public skill is compiled as an installable root skill
      and is also nested inside every published skill that requires it.
    </p>

    <div class="apc-matrix__grid" aria-hidden="true">
      <span class="apc-matrix__corner">status \ visibility</span>
      <span class="apc-matrix__column">internal</span>
      <span class="apc-matrix__column">public</span>

      <span class="apc-matrix__row">draft</span>
      <div
        class="apc-matrix__cell apc-matrix__cell--absent"
        data-visibility="internal"
      >
        <strong>Not compiled</strong>
        <span>No active or deprecated skill may require a draft skill.</span>
      </div>
      <div
        class="apc-matrix__cell apc-matrix__cell--absent"
        data-visibility="public"
      >
        <strong>Not compiled</strong>
        <span>Still being written; never reaches the catalog.</span>
      </div>

      <span class="apc-matrix__row">active</span>
      <div
        class="apc-matrix__cell apc-matrix__cell--nested"
        data-visibility="internal"
      >
        <strong>Nested only</strong>
        <span>Compiled inside every published skill that requires it.</span>
      </div>
      <div
        class="apc-matrix__cell apc-matrix__cell--root"
        data-visibility="public"
      >
        <strong>Installable root</strong>
        <span>Also nested inside every published skill that requires it.</span>
      </div>

      <span class="apc-matrix__row">deprecated</span>
      <div
        class="apc-matrix__cell apc-matrix__cell--nested"
        data-visibility="internal"
      >
        <strong>Nested only</strong>
        <span>Same as active, and requiring it raises a warning.</span>
      </div>
      <div
        class="apc-matrix__cell apc-matrix__cell--root"
        data-visibility="public"
      >
        <strong>Installable root</strong>
        <span>Listed in the catalog with its migration instructions.</span>
      </div>

      <span class="apc-matrix__row">archived</span>
      <div
        class="apc-matrix__cell apc-matrix__cell--absent"
        data-visibility="internal"
      >
        <strong>Not compiled</strong>
        <span>Only another archived skill may require it.</span>
      </div>
      <div
        class="apc-matrix__cell apc-matrix__cell--absent"
        data-visibility="public"
      >
        <strong>Not compiled</strong>
        <span>Retired; the manifest keeps the record.</span>
      </div>
    </div>
  </figure>
</template>
