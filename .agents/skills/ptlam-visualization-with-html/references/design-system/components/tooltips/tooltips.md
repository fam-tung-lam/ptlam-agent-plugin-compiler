# Tooltips

Use a tooltip for a brief supplemental label, never for essential instructions.
Show it on keyboard focus as well as pointer hover. A plain tooltip labels or
briefly describes one element. Do not use a rich tooltip with links or actions
in this focused artifact; place that explanation in visible content instead.

```html
<button aria-describedby="fit-tip" aria-label="Fit diagram">⌗</button
><span id="fit-tip" role="tooltip">Fit diagram</span>
```

```css
[role="tooltip"] {
  max-inline-size: 20rem;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--shape-extra-small);
  background: var(--color-surface-inverse);
  color: var(--color-on-surface-inverse);
}
```

Source snapshot: Material 3 tooltip overview, captured with Firecrawl on
2026-08-07. Material does not supply a current web component; this file defines
the native HTML adaptation.
