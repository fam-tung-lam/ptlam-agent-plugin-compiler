<script setup lang="ts">
import { withBase } from "vitepress";

/*
 * The default 404 offers one link, to the home page, which is the least useful
 * destination for someone who arrived from a stale deep link into the docs.
 * These four are the entry points a reader is actually looking for.
 *
 * The page deliberately does not echo the URL that failed. A static host
 * serves this same document for every unknown path, so the only path the page
 * can name on a direct hit is its own.
 */
const routes = [
  {
    link: "/guide/introduction",
    text: "Introduction",
    hint: "What the compiler builds, and why the build step exists",
  },
  {
    link: "/guide/quick-start",
    text: "Quick Start",
    hint: "From an empty repository to compiled, verified output",
  },
  {
    link: "/reference/",
    text: "Reference",
    hint: "The manifest schema, the CLI, and the provider contracts",
  },
  {
    link: "/",
    text: "Home",
    hint: "Back to the front page",
  },
];
</script>

<template>
  <div class="apc-not-found">
    <p class="apc-not-found__code">HTTP 404 · NO SUCH PAGE</p>

    <h1 class="apc-not-found__title">Nothing compiles from that path.</h1>

    <p class="apc-not-found__lead">
      That page is not part of this build. It may have been renamed, or the
      link that sent you here may be older than the docs it points at.
    </p>

    <nav class="apc-not-found__routes" aria-label="Suggested pages">
      <a
        v-for="route in routes"
        :key="route.link"
        class="apc-not-found__route"
        :href="withBase(route.link)"
      >
        <span class="apc-not-found__route-text">{{ route.text }}</span>
        <span class="apc-not-found__route-hint">{{ route.hint }}</span>
      </a>
    </nav>

    <p class="apc-not-found__hint">
      If you know what you are after, press <kbd>/</kbd> to search the docs.
    </p>
  </div>
</template>
