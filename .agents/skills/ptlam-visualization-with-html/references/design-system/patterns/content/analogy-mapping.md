# Analogy mapping

Map an everyday system to the literal system in-place. Prefer paired labels on
corresponding shapes or a compact mapping strip; avoid a dense table before the
learner has seen the topology.

```html
<div class="mapping-strip" aria-label="Analogy mapping">
  <div><span>Everyday</span><strong>Service log</strong></div>
  <span aria-hidden="true">↔</span>
  <div><span>Literal</span><strong>messages[]</strong></div>
</div>
```

```css
.mapping-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
  padding: 0.75rem;
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-small);
  background: var(--color-surface-container);
}
.mapping-strip div {
  min-width: 0;
}
.mapping-strip span {
  color: var(--color-on-surface-variant);
  font-size: 0.72rem;
}
.mapping-strip strong {
  display: block;
  overflow-wrap: anywhere;
}
```

Mapping gate:

- Preserve actor role, boundary, ownership, direction, cardinality, and
  lifecycle where those matter to the lesson.
- Use one analogy ecosystem across the artifact.
- Keep literal labels visible beside the analogy, not in a glossary far away.
- Stop the analogy at the first important mismatch and name that boundary in one
  sentence.
- If the analogy cannot preserve the relationship topology, do not use it.
