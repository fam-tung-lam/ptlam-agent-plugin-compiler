# Section layout

Use a consistent section anatomy: numbered eyebrow, direct heading, one framing
paragraph, primary visual, then at most one concise callout.

```html
<section class="guide-section" id="flow" aria-labelledby="flow-title">
  <header class="section-head">
    <p class="eyebrow">Step 02 · Runtime flow</p>
    <h2 id="flow-title">Run one turn yourself</h2>
    <p>Advance the flow and watch the system state change beside it.</p>
  </header>
  <div class="visual-stage">...</div>
  <aside class="callout">One interpretation or caveat.</aside>
</section>
```

```css
.guide-section {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}
.section-head {
  display: grid;
  gap: var(--space-2);
}
.section-head > p {
  color: var(--color-on-surface-variant);
  margin: 0;
}
.visual-stage {
  min-width: 0;
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-large);
  background: var(--color-surface);
  box-shadow: var(--elevation-2);
}
.visual-stage > * {
  min-width: 0;
}
.stage-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
}
.stage-grid > * {
  padding: clamp(1rem, 3vw, 2rem);
}
.stage-grid > :last-child {
  border-left: 1px solid var(--color-outline);
}
@media (max-width: 760px) {
  .stage-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .stage-grid > :last-child {
    border-left: 0;
    border-top: 1px solid var(--color-outline);
  }
}
```

Do not repeat a text-only section after an interactive visual has already
explained the same mechanism. Use the freed space for a deeper distinct view
only when it answers a new question.
