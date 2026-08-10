# Shape tokens

The scaffold owns the exact baseline values. Use small shapes for compact
labels, medium shapes for controls, large shapes for panels and diagram stages,
and full shapes for circular controls and pills.

Use shape to clarify containment and component family. Do not vary radius only
for decoration. Contrasting or morphing shapes may communicate selection,
expansion, or progress when a non-motion cue remains visible.

The expressive baseline uses the expanded shape library and shape morphing. Keep
rest and active shapes semantically related and preserve the active end shape
under reduced motion.

The available semantic scale runs from no rounding through extra-small, small,
medium, large, extra-large, increased, and fully rounded roles. Use directional
top, start, or end roles only when the containment relationship requires them.
For HTML, implement a morph as an ordinary CSS transition between semantic end
shapes; Material's platform shape-morph API is not available on the web.

Source snapshot: Material 3 corner-radius scale and shape-morph guidance,
captured with Firecrawl on 2026-08-07.
