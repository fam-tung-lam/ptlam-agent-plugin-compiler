/** Canonical tokens and document-shell CSS embedded by the HTML scaffolder. */
export const DESIGN_SYSTEM_FOUNDATION_CSS = `
    :root {
      color-scheme: dark;
      --color-canvas:#090e15;
      --color-surface:#0f1622;
      --color-surface-dim:#090e15;
      --color-surface-bright:#253142;
      --color-surface-container-low:#0c131d;
      --color-surface-container:#151f2d;
      --color-surface-container-high:#1b2838;
      --color-surface-container-highest:#253142;
      --color-surface-inverse:#e7edf5;
      --color-on-surface-inverse:#17202c;
      --color-outline:#2a3a4f;
      --color-outline-variant:#3d4d63;
      --color-outline-strong:#63748c;
      --color-on-surface:#e7edf5;
      --color-on-surface-variant:#9caabe;
      --color-primary:#e8b84c;
      --color-primary-container:#372d19;
      --color-on-primary:#17130a;
      --color-on-primary-container:#ffe2a2;
      --color-secondary:#65c7d9;
      --color-secondary-container:#15343a;
      --color-on-secondary:#071416;
      --color-on-secondary-container:#b9f4ff;
      --color-tertiary:#a997e8;
      --color-tertiary-container:#2b2544;
      --color-on-tertiary:#140f27;
      --color-on-tertiary-container:#e7ddff;
      --color-success:#69c69a;
      --color-warning:#e6874f;
      --color-error:#ef6b69;
      --color-error-container:#4b1f20;
      --color-on-error:#1f0707;
      --color-on-error-container:#ffdad7;
      --color-focus:#65c7d9;
      --color-scrim:rgba(0,0,0,.56);
      --typeface-display:ui-serif,Georgia,serif;
      --typeface-body:ui-sans-serif,system-ui,sans-serif;
      --typeface-label:ui-monospace,SFMono-Regular,Consolas,monospace;
      --type-display-large:clamp(2.25rem,7vw,5.25rem);
      --type-display-medium:clamp(1.8rem,4vw,3.25rem);
      --type-headline-large:clamp(1.65rem,3vw,2.5rem);
      --type-headline-medium:clamp(1.4rem,2.5vw,2rem);
      --type-title-large:clamp(1.3rem,2vw,1.6rem);
      --type-title-medium:clamp(1.15rem,2vw,1.45rem);
      --type-body-large:clamp(.98rem,.94rem + .2vw,1.08rem);
      --type-body-medium:.94rem;
      --type-label-large:.875rem;
      --type-label-small:.72rem;
      --type-weight-regular:400;
      --type-weight-medium:550;
      --type-weight-bold:700;
      --type-width-standard:100%;
      --content-max:76rem;
      --space-0:0;
      --space-1:.375rem;
      --space-2:.625rem;
      --space-3:1rem;
      --space-4:1.5rem;
      --space-5:2.25rem;
      --space-6:3rem;
      --space-7:4rem;
      --shape-none:0;
      --shape-extra-small:.25rem;
      --shape-small:.5rem;
      --shape-medium:.75rem;
      --shape-large:1rem;
      --shape-extra-large:1.75rem;
      --shape-full:999rem;
      --shape-component-rest:1.5rem .75rem 1.5rem .75rem;
      --shape-component-active:.75rem 1.5rem .75rem 1.5rem;
      --elevation-0:none;
      --elevation-focus:0 0 0 .2rem rgba(101,199,217,.28);
      --elevation-1:0 .5rem 1.5rem rgba(0,0,0,.16);
      --elevation-2:0 1.25rem 4rem rgba(0,0,0,.2);
      --elevation-3:0 1.75rem 5rem rgba(0,0,0,.24);
      --motion-duration-short:120ms;
      --motion-duration-medium:320ms;
      --motion-duration-long:520ms;
      --motion-easing-effects:cubic-bezier(.2,0,0,1);
      --motion-easing-spatial:cubic-bezier(.2,0,0,1.2);
      --motion-easing-decelerate:cubic-bezier(0,0,0,1);
      --motion-easing-accelerate:cubic-bezier(.3,0,1,1);
      --state-hover-opacity:.08;
      --state-focus-opacity:.1;
      --state-pressed-opacity:.1;
      --state-dragged-opacity:.16;
      --state-disabled-opacity:.38;
    }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0;background:var(--color-canvas);color:var(--color-on-surface);font:var(--type-weight-regular) var(--type-body-large)/1.65 var(--typeface-body); }
    img,svg { display:block;max-width:100%; }
    svg { width:100%;height:auto; }
    :focus-visible { outline:2px solid var(--color-focus);outline-offset:3px;box-shadow:var(--elevation-focus); }
    .skip-link { position:fixed;left:1rem;top:-5rem;z-index:10;padding:.7rem 1rem;background:var(--color-primary);color:var(--color-on-primary); }
    .skip-link:focus { top:1rem; }
    .hero,.field-nav,main,footer { width:min(calc(100% - 2rem),var(--content-max));margin-inline:auto; }
    .hero { padding-block:clamp(4rem,10vw,8rem) 3rem; }
    h1,h2 { margin:0;font-family:var(--typeface-display);line-height:1.08;text-wrap:balance; }
    h1 { font-size:var(--type-display-large); }
    h2 { font-size:var(--type-display-medium); }
    p { max-width:68ch; }
    .eyebrow { color:var(--color-primary);font:var(--type-weight-bold) var(--type-label-small)/1.4 var(--typeface-label);letter-spacing:.15em;text-transform:uppercase; }
    .lede { color:var(--color-on-surface-variant);font-size:clamp(1.05rem,2vw,1.3rem); }
    .field-nav { display:flex;flex-wrap:wrap;gap:.5rem;padding:.75rem;border:1px solid var(--color-outline);border-radius:var(--shape-medium);background:var(--color-surface); }
    .field-nav a { flex:1 1 auto;min-width:0;padding:.6rem .75rem;color:var(--color-on-surface-variant);text-align:center;text-decoration:none;overflow-wrap:anywhere; }
    main { display:grid;gap:6rem;padding-block:4rem 8rem; }
    section { display:grid;gap:1.5rem;min-width:0;scroll-margin-top:1rem; }
    .visual-stage { min-width:0;border:1px solid var(--color-outline);border-radius:1rem;background:var(--color-surface);padding:clamp(1rem,3vw,2rem); }
    .placeholder { min-height:18rem;display:grid;place-items:center;border:1px dashed var(--color-outline);border-radius:var(--shape-medium);color:var(--color-on-surface-variant);text-align:center;padding:2rem;overflow-wrap:anywhere; }
    footer { border-top:1px solid var(--color-outline);padding-block:2rem 4rem;color:var(--color-on-surface-variant); }
    @media (prefers-reduced-motion:reduce) {
      html { scroll-behavior:auto; }
      *,*::before,*::after { animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important; }
    }
`;
