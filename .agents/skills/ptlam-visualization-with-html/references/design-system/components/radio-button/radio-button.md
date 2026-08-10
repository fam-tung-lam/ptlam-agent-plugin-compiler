# Radio button

Use native radio buttons when exactly one option must be selected from a named
set. Keep all options visible when comparison matters. Use short scannable
labels and make the selected value more prominent through the native checked
state plus text or container treatment when needed.

```html
<fieldset>
  <legend>Diagram depth</legend>
  <label><input type="radio" name="depth" checked /> Context</label>
</fieldset>
```

```css
input[type="radio"] {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  accent-color: var(--color-primary);
}
```

Source snapshot: Material 3 radio-button overview, captured with Firecrawl on
2026-08-07.
