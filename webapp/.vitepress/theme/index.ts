import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import CompilerFlowPrototype from "./components/CompilerFlowPrototype.vue";
import ThemeLayout from "./Layout.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: ThemeLayout,
  enhanceApp({ app }) {
    app.component("CompilerFlowPrototype", CompilerFlowPrototype);
  },
} satisfies Theme;
