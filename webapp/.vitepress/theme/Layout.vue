<script setup lang="ts">
import DefaultTheme from "vitepress/theme";

import CapabilityGrid from "./components/CapabilityGrid.vue";
import CompilerFlow from "./components/CompilerFlow.vue";
import DocContext from "./components/DocContext.vue";
import HomeCommands from "./components/HomeCommands.vue";
import HomeContrast from "./components/HomeContrast.vue";
import HomeHosts from "./components/HomeHosts.vue";
import HomeInstall from "./components/HomeInstall.vue";
import HomeNext from "./components/HomeNext.vue";
import HomeVerify from "./components/HomeVerify.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-actions-after>
      <HomeInstall />
    </template>

    <template #home-hero-image>
      <CompilerFlow />
    </template>

    <template #home-features-after>
      <HomeContrast />
      <CapabilityGrid />
      <HomeHosts />
      <HomeCommands />
      <HomeVerify />
      <HomeNext />
    </template>

    <template #doc-before>
      <DocContext />
    </template>
  </Layout>
</template>
