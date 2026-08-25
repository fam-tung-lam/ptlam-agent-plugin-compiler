import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const productionUrl = "https://agent-plugin-compiler.phamtunglam.com";
const repositoryUrl =
  "https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler";

/*
 * The docs root inside the repository. The edit link and the not-found
 * override below both hang off it, so it is named once.
 */
const docsDirectory = "webapp";

/*
 * The default theme's VPContent renders its own NotFound component whenever a
 * route fails to resolve, and reaches it by a direct import rather than
 * through the theme object. `themeConfig.notFound` only retitles that
 * component, and `Theme.NotFound` is the router's fallback, which VPContent
 * never renders. Aliasing the module is VitePress's documented way to replace
 * an internal component, and it is the only one that leaves Layout.vue alone.
 */
const notFoundComponent = fileURLToPath(
  new URL("./theme/components/NotFound.vue", import.meta.url),
);

const docsSidebar = [
  {
    text: "Guide",
    items: [
      { text: "Introduction", link: "/guide/introduction" },
      { text: "Installation", link: "/guide/installation" },
      { text: "Quick Start", link: "/guide/quick-start" },
      { text: "Skill Graph", link: "/guide/skill-graph" },
      { text: "Generated Output", link: "/guide/generated-output" },
      {
        text: "Continuous Integration",
        link: "/guide/continuous-integration",
      },
      { text: "Programmatic Usage", link: "/guide/programmatic-usage" },
    ],
  },
  {
    text: "Reference",
    items: [
      { text: "Overview", link: "/reference/" },
      { text: "Manifest", link: "/reference/manifest" },
      { text: "CLI", link: "/reference/cli" },
      { text: "Providers", link: "/reference/providers" },
    ],
  },
];

export default defineConfig({
  lang: "en-US",
  title: "Agent Plugin Compiler",
  description:
    "Validate skill graphs and compile self-contained skills, visual catalogs, portable hooks, and exact host manifests.",
  base: "/",
  cleanUrls: true,
  sitemap: {
    hostname: productionUrl,
  },
  head: [
    /*
     * Matches --apc-accent in tokens.css. The retired violet lived here.
     */
    ["meta", { name: "theme-color", content: "#1f5fe0" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    [
      "meta",
      {
        name: "keywords",
        content:
          "agent plugin compiler, agent skills, skill dependency graph, portable hooks, Claude, Codex, Copilot, Gemini, Kimi",
      },
    ],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:url", content: productionUrl }],
    ["meta", { property: "og:title", content: "Agent Plugin Compiler" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Validate skill graphs and compile self-contained skills, visual catalogs, portable hooks, and exact host manifests.",
      },
    ],
    ["meta", { property: "og:image", content: `${productionUrl}/og.png` }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "Agent Plugin Compiler" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Validate skill graphs and compile self-contained skills, visual catalogs, portable hooks, and exact host manifests.",
      },
    ],
    ["meta", { name: "twitter:image", content: `${productionUrl}/og.png` }],
  ],
  /*
   * Shiki's `github-light` / `github-dark` fail WCAG AA against the code-block
   * grounds this theme sets. Measured over the YAML, JSON, bash, markdown, and
   * text samples these docs actually contain: light orange #e36209 reached
   * 3.17:1 on #f2f4f7 (and only 3.49:1 on white, so a lighter ground is not a
   * fix), and dark grey #6a737d reached 3.65:1 on #151922.
   *
   * These two are the least aggressive themes in the same family that clear
   * 4.5:1 on the existing grounds, so no background token has to change:
   * 4.57:1 light, 5.72:1 dark, with all eight token hues kept distinct.
   */
  markdown: {
    theme: {
      light: "github-light-high-contrast",
      dark: "github-dark-default",
    },
  },
  lastUpdated: true,
  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/NotFound\.vue$/,
          replacement: notFoundComponent,
        },
      ],
    },
  },
  themeConfig: {
    logo: {
      light: "/logo.svg",
      dark: "/logo.svg",
      alt: "Agent Plugin Compiler",
    },
    nav: [
      {
        text: "Guide",
        link: "/guide/introduction",
        activeMatch: "^/guide/",
      },
      { text: "Reference", link: "/reference/", activeMatch: "^/reference/" },
    ],
    sidebar: {
      "/guide/": docsSidebar,
      "/reference/": docsSidebar,
    },
    /*
     * detailedView shows the matching excerpt under each hit. Headings repeat
     * across these pages — "Providers" is a page, a manifest field, and a CLI
     * option — so a list of bare heading titles cannot tell the reader which
     * hit is the one they want.
     */
    search: {
      provider: "local",
      options: {
        detailedView: true,
      },
    },
    socialLinks: [
      {
        icon: "github",
        link: repositoryUrl,
        ariaLabel: "Agent Plugin Compiler on GitHub",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © Pham Tung Lam",
    },
    outline: {
      level: "deep",
      label: "On this page",
    },
    docFooter: {
      prev: "Previous",
      next: "Next",
    },
    editLink: {
      pattern: `${repositoryUrl}/edit/main/${docsDirectory}/:path`,
      text: "Edit this page on GitHub",
    },
    /*
     * Rendered from the last commit that touched the page's own Markdown file.
     * forceLocale pins the format to the site language so every reader is
     * shown the same string, rather than one that shifts with their locale.
     */
    lastUpdated: {
      text: "Last updated",
      formatOptions: {
        dateStyle: "medium",
        forceLocale: true,
      },
    },
  },
});
