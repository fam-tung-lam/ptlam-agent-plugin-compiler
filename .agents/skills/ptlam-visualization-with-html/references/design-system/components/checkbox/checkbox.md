# Checkbox

Use a native checkbox for independent on/off choices or multi-selection. Put
related checkboxes in a named fieldset.

Support unchecked, checked, and indeterminate states when the data model needs
all three. Set `HTMLInputElement.indeterminate` from JavaScript because it is a
presentation state, not an HTML attribute. Show invalid selection with visible
error text and `aria-describedby`; color alone is insufficient.

```html
<label><input type="checkbox" name="show-state" /> Show state panel</label>
```

```css
input[type="checkbox"] {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  accent-color: var(--color-primary);
}
```

Source snapshot: Material 3 checkbox overview, captured with Firecrawl on
2026-08-07.
