# Control-plane pattern

The control plane coordinates one timeline. It sits below the diagram and state
panel so it controls both. “Control plane” is the correct component name;
visible copy may simply say “Controls”.

Compose its actions from the
[button family](../../components/buttons/buttons.md). The following
`.button-row` layout belongs to the control plane, not to any button variant.

```html
<div class="control-plane" data-control-plane>
  <div class="step-readout">
    <span class="eyebrow">Current frame</span>
    <output data-step-count>1 / 6</output>
  </div>
  <p class="step-caption" data-step-caption aria-live="polite">
    The request enters the system.
  </p>
  <div class="button-row" aria-label="Timeline controls">...</div>
</div>
```

```css
.control-plane {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: 1rem;
  border-top: 1px solid var(--color-outline);
  background: var(--color-surface-container-low);
}
.step-readout {
  display: grid;
  gap: 0.2rem;
}
.step-readout output {
  font-family: ui-monospace, monospace;
}
.step-caption {
  margin: 0;
  max-width: none;
  color: var(--color-on-surface-variant);
  overflow-wrap: anywhere;
}
.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-width: 0;
}
@media (max-width: 760px) {
  .control-plane {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }
}
```

State machine rules:

```js
function setStep(nextIndex) {
  index = Math.max(0, Math.min(steps.length - 1, nextIndex));
  render(index); // update nodes, edges, state, caption, counter, disabled buttons
}

nextButton.addEventListener("click", () => setStep(index + 1));
backButton.addEventListener("click", () => setStep(index - 1));
resetButton.addEventListener("click", () => {
  stop();
  setStep(0);
});
playButton.addEventListener("click", () => (running ? stop() : play()));
```

Use one interval per control plane. Stop it on Reset, at the final step, and
when the document becomes hidden. Never start it automatically. Make step
definitions the single source of truth for visual and text state.
