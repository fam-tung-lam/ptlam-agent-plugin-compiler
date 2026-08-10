# State tokens

The scaffold owns the exact baseline values for hover, focus, pressed, dragged,
and disabled layers. Apply the same state roles consistently to every selected
component.

Use state layers together with a visible shape, outline, label, or position
change. Never communicate selection or focus through opacity alone.

Keep enabled, disabled, hovered, focused, pressed, dragged, and selected states
distinct. States can combine—for example, selected plus hovered—so one state
must not erase another. Provide two visual indicators for any state whose loss
would change meaning.

Source snapshot: Material 3 state-overview and state-layer guidance, captured
with Firecrawl on 2026-08-07.
