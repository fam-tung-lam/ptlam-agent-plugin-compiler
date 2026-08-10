<script setup lang="ts">
import DefaultTheme from "vitepress/theme";

import CapabilityGrid from "./components/CapabilityGrid.vue";
import CompilerFlow from "./components/CompilerFlow.vue";
import DocContext from "./components/DocContext.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <CompilerFlow />
    </template>

    <template #home-features-before>
      <CapabilityGrid />
    </template>

    <template #doc-before>
      <DocContext />
    </template>
  </Layout>
</template>
