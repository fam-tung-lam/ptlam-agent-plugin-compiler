# Button groups

Group related actions when proximity and coordinated shape help people compare
or invoke them. Use a standard group for independent actions and a connected
group for a compact selected value. Implement independent selection with
`aria-pressed` buttons and required single selection with native radios.

```html
<div class="button-group" role="group" aria-label="Diagram actions">
  <button class="button button--tonal" type="button">Fit</button>
  <button class="button button--tonal" type="button">Center</button>
</div>
```

```css
.button-group {
  display: inline-flex;
  gap: 0.25rem;
}
.button-group .button:active {
  border-radius: var(--shape-component-active);
}
```

Button groups react through coordinated expressive shape changes. Keep labels
and target positions stable. The family supports XS through XL sizes, round or
square resting shapes, and optional single-select, multi-select, or
selection-required behavior; only add selection when the data model needs it.

Source snapshot: Material 3 button-group overview, captured with Firecrawl on
2026-08-07.
