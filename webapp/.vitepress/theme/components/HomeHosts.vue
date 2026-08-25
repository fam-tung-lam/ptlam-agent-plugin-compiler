<script setup lang="ts">
type Host = {
  readonly id: string;
  readonly name: string;
  readonly manifests: readonly string[];
};

const hosts: readonly Host[] = [
  {
    id: "claude",
    name: "Claude plugin",
    manifests: [
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json",
    ],
  },
  {
    id: "codex",
    name: "Codex plugin",
    manifests: [".codex-plugin/plugin.json"],
  },
  { id: "copilot", name: "GitHub Copilot CLI", manifests: ["plugin.json"] },
  {
    id: "gemini",
    name: "Gemini CLI extension",
    manifests: ["gemini-extension.json"],
  },
  { id: "kimi", name: "Kimi Code CLI plugin", manifests: ["kimi.plugin.json"] },
];
</script>

<template>
  <section class="apc-section" aria-labelledby="apc-hosts-title">
    <div class="apc-section__inner">
      <header class="apc-section__head">
        <span class="apc-eyebrow">Supported hosts</span>
        <h2 id="apc-hosts-title" class="apc-section__title">
          Five adapters, one validated model
        </h2>
        <p class="apc-section__lede">
          Select any combination in <code>plugin/plugin.yml</code>, or override
          the selection for a single run. Each adapter declares the exact
          manifest files it owns, and receives portable hooks only where the
          host exposes an equivalent native event.
        </p>
      </header>

      <ul class="apc-hosts">
        <li v-for="host in hosts" :key="host.id" class="apc-host">
          <p class="apc-host__head">
            <span class="apc-host__name">{{ host.name }}</span>
            <code class="apc-host__id">{{ host.id }}</code>
          </p>
          <ul class="apc-host__manifests">
            <li v-for="manifest in host.manifests" :key="manifest">
              <code>{{ manifest }}</code>
            </li>
          </ul>
        </li>
      </ul>

      <p class="apc-section__footnote">
        The shared <code>skills/**</code> tree is generated either way, so a
        plugin that targets no host manifest still gets self-contained skills.
        Node.js callers can register an adapter for a host the compiler does not
        ship &mdash; see <a href="/reference/providers">Providers</a>.
      </p>
    </div>
  </section>
</template>
