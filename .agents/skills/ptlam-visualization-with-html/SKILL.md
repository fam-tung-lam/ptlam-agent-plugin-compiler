---
name: ptlam-visualization-with-html
description:
  Create or revise portable, polished, interactive HTML explainers and learning
  artifacts with native HTML, CSS, JavaScript, SVG, and one Material 3
  Expressive design system. Use when a user asks to visualize architecture,
  workflows, state changes, sequences, entity relationships, semantic zoom, or
  step-by-step behavior in an HTML file; when a learner should manipulate or
  observe a diagram rather than read long prose; or when a top-to-bottom visual
  field guide or simulator is requested. Apply the analogy dependency first only
  when the user explicitly asks to create an analogy. Use a general application
  or site workflow for ordinary pages, dashboards, and app-shell UI.
---

# PTLam Visualization with HTML

Create or revise one self-contained HTML explainer. Use native HTML, CSS,
JavaScript, and inline SVG; the delivered file runs without a framework, build
step, CDN, web server, sibling file, or external runtime asset.

## Required skills

### `ptlam-explaining-with-analogy`

**Reason:** Owns analogy selection and explanation semantics before HTML rendering.

**Instructions:** Apply ptlam-explaining-with-analogy only when the user explicitly asks
to create an analogy and has not already supplied or chosen one.
Let it own the literal model, candidates, user choice, stable mapping,
story, and caveats. Resume this visualization skill after the choice
and let it own only the portable HTML rendering and visual interaction.

Read [ptlam-explaining-with-analogy](skills/ptlam-explaining-with-analogy/SKILL.md).

## 1. Resolve the learning outcome and artifact

Identify the learner's question, background, confusing mechanism, requested
depth, language, output path, and whether the task creates or revises an
artifact. Inspect an existing artifact before changing it. Model the smallest
complete literal system that answers the question: actors, boundaries,
relationships, order, state, transitions, ownership, cardinality, and failure
behavior that materially affect the lesson.

Complete this step when the destination and authority are clear and the literal
model accounts for every fact the artifact must teach without speculative
detail.

## 2. Resolve the analogy branch

Use an analogy only when the user explicitly requests one or supplies an
already chosen analogy model. When the user requests a new analogy, apply the
embedded `ptlam-explaining-with-analogy` skill first; let it own literal-to-
everyday mapping, candidate selection, the user's choice, story, and caveats.
Resume this workflow after the choice. This skill owns only the HTML rendering
of that result.

For a chosen analogy, read [analogy mapping](references/design-system/patterns/content/analogy-mapping.md).
When two synchronized maps teach the mechanism, also read the
[analogy-twin pattern](references/design-system/patterns/analogy-twin/analogy-twin.md).
When lifetime or change cadence is the lesson, read
[layered lifetimes](references/design-system/patterns/content/layered-lifetimes.md).

Complete this step when the branch is literal-only or has one user-approved,
structurally faithful analogy with an explicit boundary.

## 3. Select the visual and interaction contracts

Read the [design-system baseline](references/design-system/design-system.md),
[accessibility](references/design-system/foundations/accessibility.md),
[interaction](references/design-system/foundations/interaction.md),
[layout](references/design-system/foundations/layout.md),
[usability](references/design-system/foundations/usability.md), and
[document shell](references/design-system/patterns/layouts/document-shell.md)
for every artifact. They own the universal M3 Expressive, accessibility,
responsive, interaction, and page-flow contract.

Select the minimum visual grammar that exposes the important relationship:

- Read [flowchart](references/design-system/components/diagrams/flowchart.md)
  for order, branching, loops, or responsibility.
- Read [state diagram](references/design-system/components/diagrams/state-diagram.md)
  when allowed transitions matter more than work order.
- Read [sequence diagram](references/design-system/components/diagrams/sequence-diagram.md)
  for participants, messages, and timing.
- Read [entity-relationship diagram](references/design-system/components/diagrams/erd.md)
  for durable structure, keys, ownership, and cardinality.
- Read [C4 semantic zoom](references/design-system/components/diagrams/c4-diagram.md)
  for meaningful abstraction levels; each level is a distinct map.
- Read [state panel](references/design-system/patterns/state-panel/state-panel.md)
  when the learner must observe values changing.
- Read [control plane](references/design-system/patterns/control-plane/control-plane.md)
  when replay or stepwise observation is part of understanding.
- Read [flowchart with state](references/design-system/patterns/interactive-flows/flowchart-with-state.md)
  for synchronized flow and observable state without playback.
- Read [flowchart with state and controls](references/design-system/patterns/interactive-flows/flowchart-with-state-and-control-plane.md)
  for the default replayable learning flow.
- Read [section layout](references/design-system/patterns/layouts/section-layout.md),
  [field-guide navigation](references/design-system/patterns/navigation/field-guide-navigation.md),
  or [callout](references/design-system/patterns/content/callout.md) only when
  that page structure is present.

For a simulator or richer control surface, choose only the component families
the learner will use. Each linked file owns that family's native HTML anatomy,
states, accessibility, and M3 Expressive application:

- Actions: [buttons and variants](references/design-system/components/buttons/buttons.md),
  [button groups](references/design-system/components/buttons/button-groups/button-groups.md),
  [segmented buttons](references/design-system/components/buttons/segmented-buttons/segmented-buttons.md),
  and [icon buttons](references/design-system/components/buttons/icon-buttons/icon-buttons.md).
- Inputs and selection: [checkbox](references/design-system/components/checkbox/checkbox.md),
  [chips](references/design-system/components/chips/chips.md),
  [radio button](references/design-system/components/radio-button/radio-button.md),
  [sliders](references/design-system/components/sliders/sliders.md),
  [switch](references/design-system/components/switch/switch.md),
  and [text fields](references/design-system/components/text-fields/text-fields.md).
- Content and feedback: [badges](references/design-system/components/badges/badges.md),
  [cards](references/design-system/components/cards/cards.md),
  [divider](references/design-system/components/divider/divider.md),
  [lists](references/design-system/components/lists/lists.md),
  [loading indicator](references/design-system/components/loading-indicator/loading-indicator.md),
  [progress indicators](references/design-system/components/progress-indicators/progress-indicators.md),
  [snackbar](references/design-system/components/snackbar/snackbar.md), and
  [tooltips](references/design-system/components/tooltips/tooltips.md).

This catalog intentionally excludes app-shell navigation, pickers, floating
actions, menus, dialogs, and sheets. They belong to general application design,
not the focused learning artifact this skill produces.

Read [icons](references/design-system/styles/icons/icons.md) when icons appear.
Read the affected semantic token contract when customizing
[color](references/design-system/tokens/color.md),
[typography](references/design-system/tokens/typography.md),
[spacing](references/design-system/tokens/spacing.md),
[shape](references/design-system/tokens/shape.md),
[elevation](references/design-system/tokens/elevation.md),
[motion](references/design-system/tokens/motion.md), or
[state](references/design-system/tokens/state.md). Read
[building for all](references/design-system/foundations/building-for-all.md),
[content design](references/design-system/foundations/content-design.md),
[customization](references/design-system/foundations/customization.md),
[design tokens](references/design-system/foundations/design-tokens.md),
[designing](references/design-system/foundations/designing.md),
[writing](references/design-system/foundations/writing.md), or
[platform adaptation](references/design-system/foundations/platform-adaptation.md)
only when that concern materially changes the artifact.

Complete this step when every selected file has a concrete consumer, every
important relationship has one visual grammar, and no unselected contract is
needed to implement the planned artifact.

## 4. Scaffold and compose the document

For a new artifact, resolve `<skill-directory>` to the directory containing this
`SKILL.md`, use Node.js 22.6 or newer, and run from any working directory:

```bash
node --experimental-strip-types \
  "<skill-directory>/scripts/scaffolding/scaffold-html.ts" \
  output.html --title "How the system works"
```

The scaffold is the canonical source for baseline tokens, global CSS, and shell
markup. Replace its instructional placeholders; do not deliver the untouched
scaffold. For an existing artifact, preserve correct content and interaction
state while bringing the file into the same contract.

Compose a top-to-bottom learning sequence. Put the overview before the detailed
mechanism and progressively deeper views. Keep the primary view on the left,
observable state on the right, and shared controls below; stack them in that
order on narrow screens. Keep the main sequence visible instead of hiding it
behind tabs.

Complete this step when the static HTML alone teaches the complete sequence,
all selected components have their required DOM anatomy, and every placeholder
has been replaced with subject-specific content.

## 5. Implement synchronized behavior

When time or state is part of the lesson, provide Back, Next, Play/Pause, and
Reset. Keep active nodes, active edges, observable state, caption, counter, and
paired analogy/literal views driven by one step model. Never auto-play. Preserve
the current step across viewport changes, stop playback when the document is
hidden, and make the final step replayable.

Use classic or module scripts according to the artifact's scoping needs. Keep
module scripts inline and self-contained; do not import runtime dependencies.
Write a useful default state into HTML and provide a complete ordered fallback
for every step so JavaScript enhances rather than owns the explanation.

Complete this step when every control produces one deterministic transition,
Back restores the exact earlier state, Reset restores step 1, Play reaches the
end and can replay, and scripts-disabled content still explains every step.

## 6. Validate and inspect in a browser

Run the bundled static validator from any working directory:

```bash
node --experimental-strip-types \
  "<skill-directory>/scripts/validation/validate-html.ts" <artifact.html>
```

Fix every error. Then inspect the real document at narrow and wide widths,
keyboard-only, reduced motion, scripts disabled, 320 px viewport width, and 200%
text zoom. Static validation cannot detect rendered overflow; reflow every
offending grid, flex item, label, SVG, code block, or badge instead of hiding
document overflow. Check every interactive step and semantic zoom level.

Complete this step when static validation passes and browser inspection proves
that content, focus, controls, diagrams, and state remain visible and usable in
every required mode.

## 7. Deliver the artifact

Return the single `.html` file at the resolved destination. Report the selected
visual grammar, whether the analogy branch ran, the validator command, browser
conditions inspected, and any requested behavior that could not be verified.

Complete the task when the user can open the file directly, the explanation is
complete without external runtime resources, and the report distinguishes
static checks from browser-observed behavior.

## Non-negotiable output contract

- Produce one portable `.html` file with embedded CSS and JavaScript.
- Include a visible-on-focus skip link, descriptive `title`, `lang`, viewport
  metadata, one `main`, and one clear `h1`.
- Use native controls, visible focus, accessible names, and `aria-live` for
  changing captions or state.
- Scale SVGs through `viewBox`; give each one a concise accessible name.
- Show direction with arrowheads and labels. Encode active state with color plus
  outline, weight, shape, or text.
- Honor `prefers-reduced-motion`; motion never carries the only meaning.
- Use concise literal labels and place qualifications beside the visual they
  constrain.
- Add quizzes, checks, or scoring only when the user requests them.
