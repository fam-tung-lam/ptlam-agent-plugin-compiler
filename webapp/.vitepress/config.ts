import { defineConfig } from "vitepress";

const productionUrl = "https://agent-plugin-compiler.phamtunglam.com";
const repositoryUrl =
  "https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler";

const docsSidebar = [
  {
    text: "Guide",
    items: [
      { text: "Introduction", link: "/guide/introduction" },
      { text: "Installation", link: "/guide/installation" },
      { text: "Quick Start", link: "/guide/quick-start" },
      { text: "Advanced Usage", link: "/guide/advanced-usage" },
      { text: "Programmatic Usage", link: "/guide/programmatic-usage" },
    ],
  },
  {
    text: "Reference",
    items: [
      { text: "Overview", link: "/reference/" },
      { text: "Authored Plugin Source", link: "/reference/authored-source" },
      { text: "CLI", link: "/reference/cli" },
      { text: "Manifest", link: "/reference/manifest" },
      { text: "Providers", link: "/reference/providers" },
    ],
  },
];

export default defineConfig({
  lang: "en-US",
  title: "Agent Plugin Compiler",
  description:
    "Compile one authored agent plugin into deterministic provider-specific output.",
  base: "/",
  cleanUrls: true,
  sitemap: {
    hostname: productionUrl,
  },
  head: [
    ["meta", { name: "theme-color", content: "#6750a4" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    [
      "meta",
      {
        name: "keywords",
        content: "agent plugin compiler, Claude, Codex, Copilot, Gemini, Kimi",
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
          "Compile one authored agent plugin into deterministic provider-specific output.",
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
          "Compile one authored agent plugin into deterministic provider-specific output.",
      },
    ],
    ["meta", { name: "twitter:image", content: `${productionUrl}/og.png` }],
  ],
  themeConfig: {
    logo: {
      light: "/logo.svg",
      dark: "/logo.svg",
      alt: "Agent Plugin Compiler",
    },
    nav: [{ text: "Docs", link: "/guide/introduction" }],
    sidebar: {
      "/guide/": docsSidebar,
      "/reference/": docsSidebar,
    },
    search: {
      provider: "local",
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
  },
});
