import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import MermaidDiagram from "./components/MermaidDiagram.vue";
import ThemeLayout from "./Layout.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: ThemeLayout,
  enhanceApp({ app }) {
    app.component("MermaidDiagram", MermaidDiagram);
  },
} satisfies Theme;
