# Layered lifetimes and cadences

Use this paired visual when concepts differ mainly by how long they live or how
often they change. The canonical three-layer vocabulary is stable, context, and
volatile; rename only when the domain uses more accurate terms.

```html
<div class="lifetime-twin" aria-label="Hotel and agent memory layers">
  <section aria-labelledby="hotel-layers">
    <h3 id="hotel-layers">Everyday · hotel desk</h3>
    <div class="lifetime-layer lifetime-layer--stable">
      <span>Stable · weeks</span
      ><strong>Hotel policies and service directory</strong>
    </div>
    <div class="lifetime-layer lifetime-layer--context">
      <span>Context · days</span
      ><strong>Current guest and reservation notes</strong>
    </div>
    <div class="lifetime-layer lifetime-layer--volatile">
      <span>Volatile · one shift</span
      ><strong>Open requests and current handoff state</strong>
    </div>
  </section>
  <section aria-labelledby="agent-layers">
    <h3 id="agent-layers">Literal · software agent</h3>
    <div class="lifetime-layer lifetime-layer--stable">
      <span>Stable · weeks</span
      ><strong>Identity, rules, and tool guidance</strong>
    </div>
    <div class="lifetime-layer lifetime-layer--context">
      <span>Context · days</span><strong>Project and discovered context</strong>
    </div>
    <div class="lifetime-layer lifetime-layer--volatile">
      <span>Volatile · one session</span
      ><strong>Current messages and live state</strong>
    </div>
  </section>
</div>
```

```css
.lifetime-twin {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  min-width: 0;
}
.lifetime-twin section {
  display: grid;
  align-content: start;
  gap: 0.6rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-medium);
  background: var(--color-surface);
}
.lifetime-layer {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--color-outline);
  border-left-width: 4px;
  border-radius: var(--shape-small);
  background: var(--color-surface-container);
}
.lifetime-layer span {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--color-on-surface-variant);
  font:
    700 0.7rem/1.4 ui-monospace,
    monospace;
  text-transform: uppercase;
}
.lifetime-layer strong {
  display: block;
  overflow-wrap: anywhere;
}
.lifetime-layer--stable {
  border-left-color: var(--color-success);
}
.lifetime-layer--context {
  border-left-color: var(--color-secondary);
}
.lifetime-layer--volatile {
  border-left-color: var(--color-warning);
}
@media (max-width: 760px) {
  .lifetime-twin {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Keep the same vertical order and cadence labels in both panels so the mapping is
visually obvious. State what causes each layer to rebuild or expire. Avoid
saying that the everyday object and literal memory use the same storage
mechanism; the mapping is lifetime and role, not implementation.
