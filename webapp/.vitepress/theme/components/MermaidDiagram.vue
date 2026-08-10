<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useData } from "vitepress";

const props = defineProps<{
  definition: string;
}>();

const { isDark } = useData();
const container = ref<HTMLElement | null>(null);
let renderSequence = 0;

async function renderDiagram(): Promise<void> {
  if (!container.value) return;

  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({
    securityLevel: "strict",
    startOnLoad: false,
    theme: isDark.value ? "dark" : "base",
    themeVariables: isDark.value
      ? undefined
      : {
          primaryColor: "#eeeafd",
          primaryTextColor: "#19162b",
          primaryBorderColor: "#5b46c8",
          lineColor: "#0b7a73",
          secondaryColor: "#e3f5f2",
          tertiaryColor: "#f8f7fc",
        },
  });

  renderSequence += 1;
  const { svg, bindFunctions } = await mermaid.render(
    `apc-mermaid-${renderSequence}`,
    decodeURIComponent(props.definition),
  );
  container.value.innerHTML = svg;
  bindFunctions?.(container.value);
}

onMounted(renderDiagram);
watch(isDark, async () => {
  await nextTick();
  await renderDiagram();
});
</script>

<template>
  <div
    ref="container"
    class="mermaid"
    role="img"
    aria-label="Authoring workflow from initialization to publication"
  ></div>
</template>
