# Snackbar

Use a snackbar for a brief non-blocking process update with at most one action.
Do not use it for information required to understand the lesson. Place it near
the bottom without covering controls. A transient status may dismiss itself; a
message that requires an action remains until the user acts or dismisses it.

```html
<div class="snackbar" role="status">
  Diagram exported
  <button class="button button--text" type="button">Open</button>
</div>
```

```css
.snackbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--shape-small);
  background: var(--color-surface-inverse);
  color: var(--color-on-surface-inverse);
}
```

Source snapshot: Material 3 snackbar overview, captured with Firecrawl on
2026-08-07. Material does not supply a current web component; this file defines
the native HTML adaptation.
