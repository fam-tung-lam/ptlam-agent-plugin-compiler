# Text fields

Use a visible label, optional supporting text, and an error message tied with
`aria-describedby`. Use native input types and autocomplete attributes.

Use a filled field when a short form or dialog needs stronger emphasis and an
outlined field when a long form benefits from a quieter surface. Keep blank,
filled, focused, disabled, and error states distinguishable. Error text must be
brief, specific, and actionable; preserve the user's entered value.

```html
<label class="text-field" for="concept">Concept</label
><input id="concept" type="text" aria-describedby="concept-help" /><small
  id="concept-help"
  >Use one concise term.</small
>
```

```css
.text-field + input {
  min-height: 3.5rem;
  inline-size: 100%;
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-small);
  background: var(--color-surface-container);
  color: var(--color-on-surface);
}
```

Source snapshot: Material 3 text-field overview, captured with Firecrawl on
2026-08-07.
