# Segmented buttons

Material 3 Expressive supersedes segmented buttons with connected button
groups. For new artifacts, use the connected selection contract in
`button-groups.md`. Retain this pattern only when revising an artifact whose
existing segmented control must remain compatible.

Limit the legacy control to two through five related view, sort, or selection
options. Use `aria-pressed` for independent multi-select segments and a native
radio group for exactly one selected value. For more options or richer labels,
use chips or ordinary controls.

```html
<div class="segments" role="group" aria-label="Diagram level">
  <button class="button" type="button" aria-pressed="true">Context</button>
  <button class="button" type="button" aria-pressed="false">Containers</button>
</div>
```

```css
.segments {
  display: inline-flex;
}
.segments .button {
  border-color: var(--color-outline);
  border-radius: 0;
}
.segments .button:first-child {
  border-radius: var(--shape-full) 0 0 var(--shape-full);
}
.segments .button:last-child {
  border-radius: 0 var(--shape-full) var(--shape-full) 0;
}
```

The Material baseline is 40 pixels high and may show a check icon in the
selected segment; this local adaptation preserves a 44-pixel minimum target.

Source snapshot: Material 3 segmented-button overview, captured with Firecrawl
on 2026-08-07. Its current guidance marks the component as not recommended for
M3 Expressive and points to connected button groups.
