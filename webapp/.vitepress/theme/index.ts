import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import ThemeLayout from "./Layout.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: ThemeLayout,
} satisfies Theme;
