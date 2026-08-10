# Motion tokens

The scaffold owns the exact baseline values. Motion identifies the active
relationship or transition; pair it with color, weight, shape, or a visible
label. Use effects easing for visual properties and spatial easing for position,
size, and shape continuity.

These effect and spatial curves are portable CSS approximations of the M3
Expressive motion system, not physical simulations. Never auto-play. Under
reduced motion, render the same end state immediately or advance discretely.

Choose the semantic family before choosing timing:

- spatial motion changes position, rotation, size, or corner shape and may
  overshoot before settling;
- effect motion changes color or opacity and must not overshoot; and
- fast timing suits small controls, default timing suits partial-page changes,
  and slow timing is reserved for whole-page transitions.

CSS easing approximates these spring roles; do not claim physical parity with a
platform spring API.

Source snapshot: Material 3 motion-system guidance, captured with Firecrawl on
2026-08-07.
