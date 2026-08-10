import { DESIGN_SYSTEM_FOUNDATION_CSS } from "./design-system-foundation.ts";

const DEFAULT_TITLE = "How the system works";
const TITLE_PLACEHOLDER = "{{DOCUMENT_TITLE}}";

const HTML_SCAFFOLD = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${TITLE_PLACEHOLDER}</title>
  <style>${DESIGN_SYSTEM_FOUNDATION_CSS}  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to the field guide</a>
  <header class="hero">
    <p class="eyebrow">Interactive field guide</p>
    <h1>${TITLE_PLACEHOLDER}</h1>
    <p class="lede">Name the learner's goal and the smallest complete system in one sentence.</p>
  </header>
  <nav class="field-nav" aria-label="Field guide sections">
    <a href="#overview"><span aria-hidden="true">01</span> Overview</a>
    <a href="#mechanism"><span aria-hidden="true">02</span> Mechanism</a>
  </nav>
  <main id="main">
    <section id="overview" aria-labelledby="overview-title">
      <header><p class="eyebrow">Step 01 · Orientation</p><h2 id="overview-title">See the whole system</h2></header>
      <div class="visual-stage"><div class="placeholder">Replace with the minimum complete ecosystem.</div></div>
    </section>
    <section id="mechanism" aria-labelledby="mechanism-title">
      <header><p class="eyebrow">Step 02 · Mechanism</p><h2 id="mechanism-title">Watch one real flow</h2></header>
      <div class="visual-stage"><div class="placeholder">Replace with an interactive diagram and observable state.</div></div>
    </section>
  </main>
  <footer>Scope, sources, and the boundary of any analogy.</footer>
</body>
</html>
`;

export interface RenderHtmlScaffoldRequest {
  readonly title?: string;
}

/** Render a portable visualization shell without performing filesystem I/O. */
export function renderHtmlScaffold(
  request: RenderHtmlScaffoldRequest = {},
): string {
  const title = request.title?.trim() || DEFAULT_TITLE;
  return HTML_SCAFFOLD.replaceAll(TITLE_PLACEHOLDER, escapeHtml(title));
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
      })[character] ?? character,
  );
}
