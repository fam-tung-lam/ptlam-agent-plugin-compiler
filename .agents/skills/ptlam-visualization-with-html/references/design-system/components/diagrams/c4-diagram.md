# C4 semantic-zoom diagram

Use separate connected maps for abstraction levels. Zooming changes the question
and the visible boundaries; it is not a CSS scale transform.

- **L1 Context:** person, system of interest, external systems.
- **L2 Containers:** deployable/runnable parts and data stores inside the
  system.
- **L3 Components:** major responsibilities inside one selected container.
- Add deeper levels only when required to answer the learner's goal.

```html
<div class="c4" data-c4>
  <div class="c4-toolbar" aria-label="Architecture level">
    <button type="button" data-c4-go="context" aria-pressed="true">
      L1 · Context
    </button>
    <button type="button" data-c4-go="containers" aria-pressed="false">
      L2 · Containers
    </button>
    <button type="button" data-c4-go="components" aria-pressed="false">
      L3 · Components
    </button>
    <button type="button" data-c4-back disabled>Zoom out</button>
  </div>
  <p class="c4-breadcrumb" data-c4-breadcrumb aria-live="polite">
    World / System
  </p>
  <div class="c4-map is-visible" data-c4-level="context">...</div>
  <div class="c4-map" data-c4-level="containers">...</div>
  <div class="c4-map" data-c4-level="components">...</div>
</div>
```

Each map is a complete diagram with its own nodes and relationships. Make a
zoomable node a button or put a transparent focusable button over the full node;
label it “Zoom into …”. Preserve the selected subject in the breadcrumb. Leave
every map visible in source order for the no-JavaScript fallback; let the
controller hide inactive levels during initialization.

```js
const order = ["context", "containers", "components"];
function showLevel(level) {
  maps.forEach((map) => {
    const visible = map.dataset.c4Level === level;
    map.hidden = !visible;
    map.classList.toggle("is-visible", visible);
  });
  buttons.forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.c4Go === level)),
  );
  back.disabled = order.indexOf(level) === 0;
  breadcrumb.textContent = paths[level];
}
```

Use consistent visual identity for the focused system across levels. Keep
external systems outside the boundary; keep containers inside the system
boundary; keep components inside their container boundary. Do not show every
possible node—show the minimum complete ecosystem for the current learning goal.
