# Synchronized analogy-twin pattern

Use two maps with one topology: everyday system on the left, literal system on
the right. Corresponding nodes and edges share semantic IDs so one controller
highlights both.

```html
<div class="visual-stage analogy-twin" data-analogy-twin="concierge-agent">
  <div class="twin-grid">
    <figure>
      <figcaption class="eyebrow">Everyday · concierge desk</figcaption>
      <svg viewBox="0 0 520 600" role="img" aria-labelledby="everyday-title">
        <title id="everyday-title">Hotel concierge request flow</title>
        <g class="flow-node" data-node="history">...</g>
        <g class="flow-edge" data-edge="history-decide">...</g>
      </svg>
    </figure>
    <figure>
      <figcaption class="eyebrow">Literal · software agent</figcaption>
      <svg viewBox="0 0 520 600" role="img" aria-labelledby="literal-title">
        <title id="literal-title">Software agent request flow</title>
        <g class="flow-node" data-node="history">...</g>
        <g class="flow-edge" data-edge="history-decide">...</g>
      </svg>
    </figure>
  </div>
  <div class="twin-state">
    <div>
      <span>Everyday state</span
      ><strong data-state="everyday">service log ready</strong>
    </div>
    <div>
      <span>Literal state</span
      ><strong data-state="literal">messages[] ready</strong>
    </div>
    <div>
      <span>Shared outcome</span
      ><strong data-state="outcome">request open</strong>
    </div>
  </div>
  <!-- Insert the complete shared control plane when the twin is interactive. -->
</div>
```

```css
.twin-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem;
}
.twin-grid figure {
  min-width: 0;
  margin: 0;
  padding: 1rem;
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-medium);
  background: var(--color-surface-container);
}
.twin-state {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  padding: 0 1rem 1rem;
}
.twin-state div {
  min-width: 0;
  padding: 0.7rem;
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-small);
}
.twin-state span {
  display: block;
  color: var(--color-on-surface-variant);
  font-size: 0.72rem;
}
.twin-state strong {
  overflow-wrap: anywhere;
}
@media (max-width: 760px) {
  .twin-grid,
  .twin-state {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Use one `steps` array. Query all matching elements, not only the first, so both
maps update:

```js
root
  .querySelectorAll(`[data-node="${step.node}"]`)
  .forEach((node) => node.classList.add("is-active"));
root
  .querySelectorAll(`[data-edge="${step.edge}"]`)
  .forEach((edge) => edge.classList.add("is-active"));
```

Requirements:

- Keep actor count, branch count, direction, and loop behavior aligned.
- Use a visible mapping label or paired state for every concept important to the
  lesson.
- Explain the literal system first in captions when terminology accuracy
  matters; use the everyday label to make the relationship intuitive.
- Add one adjacent caveat naming the first important mismatch.
- Never invent a second analogy inside the twin.
- Treat this markup as a composable partial. For an interactive twin, replace
  `data-analogy-twin` with `data-stepper` only after adding the complete shared
  control plane, caption, counter, and no-JavaScript summary from
  [flowchart-with-state-and-control-plane.md](../interactive-flows/flowchart-with-state-and-control-plane.md).
