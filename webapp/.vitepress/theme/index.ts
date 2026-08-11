import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import OwnershipMap from "./components/OwnershipMap.vue";
import PublicationMatrix from "./components/PublicationMatrix.vue";
import SkillGraphTransform from "./components/SkillGraphTransform.vue";
import ThemeLayout from "./Layout.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: ThemeLayout,
  enhanceApp({ app }) {
    app.component("OwnershipMap", OwnershipMap);
    app.component("PublicationMatrix", PublicationMatrix);
    app.component("SkillGraphTransform", SkillGraphTransform);
  },
} satisfies Theme;
