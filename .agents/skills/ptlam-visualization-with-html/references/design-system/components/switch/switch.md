# Switch

Use a switch for an immediately applied on/off setting. Use a checkbox when the
choice is submitted with a form or represents selection. The visible label must
make both the setting and its current on/off meaning clear. An optional handle
icon may reinforce state but cannot replace the checked state or label.

```html
<label class="switch"
  ><input type="checkbox" role="switch" /> Animate active path</label
>
```

```css
.switch input {
  inline-size: 3.25rem;
  min-height: 44px;
  accent-color: var(--color-primary);
}
```

Source snapshot: Material 3 switch overview, captured with Firecrawl on
2026-08-07.
