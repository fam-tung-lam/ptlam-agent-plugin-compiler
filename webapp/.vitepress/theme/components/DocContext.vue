<script setup lang="ts">
import { useData } from "vitepress";

const { page } = useData();
</script>

<template>
  <div class="apc-doc-context">
    <span class="apc-doc-context__nodes" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
    <span>
      {{
        page.relativePath.startsWith("guide/")
          ? "GUIDE · AUTHORING WORKFLOW"
          : "REFERENCE · PUBLIC CONTRACT"
      }}
    </span>
    <span class="apc-doc-context__line" aria-hidden="true" />
  </div>
</template>
