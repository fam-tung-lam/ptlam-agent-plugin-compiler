<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const variants = [
  ["A", "Build pipeline"],
  ["B", "Ownership lanes"],
  ["C", "Dependency graph"],
  ["D", "Desired vs observed"],
] as const;

const current = ref("A");

function selectVariant(next: string) {
  if (!variants.some(([key]) => key === next)) return;
  current.value = next;
  const url = new URL(window.location.href);
  url.searchParams.set("variant", next);
  window.history.replaceState({}, "", url);
}

function cycle(direction: number) {
  const index = variants.findIndex(([key]) => key === current.value);
  const next = (index + direction + variants.length) % variants.length;
  selectVariant(variants[next][0]);
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.matches("input, textarea, [contenteditable='true']")) return;
  if (event.key === "ArrowLeft") cycle(-1);
  if (event.key === "ArrowRight") cycle(1);
}

onMounted(() => {
  const requested = new URL(window.location.href).searchParams.get("variant");
  if (requested) selectVariant(requested.toUpperCase());
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <section class="apc-prototype" aria-labelledby="prototype-title">
    <header class="apc-prototype__header">
      <span class="apc-kicker">THROWAWAY DESIGN REVIEW</span>
      <h1 id="prototype-title">Compiler-flow options</h1>
      <p>
        Four architecture-accurate ways to introduce the same product. Use the
        switcher or the left and right arrow keys; the selected URL is shareable.
      </p>
    </header>

    <div class="apc-prototype__stage">
      <article v-if="current === 'A'" class="apc-prototype-option">
        <header>
          <span>A · RECOMMENDED</span>
          <h2>Build pipeline</h2>
          <p>Lead with the smallest complete story: authored tree → compiler → owned outputs.</p>
        </header>
        <div class="apc-proto-flow apc-proto-flow--pipeline">
          <div class="apc-proto-node apc-proto-node--source">
            <small>AUTHORED</small><strong>plugin/</strong>
            <code>plugin.yml</code><code>skills/**</code><code>resources</code>
          </div>
          <div class="apc-proto-connector"><i></i><b>validate</b></div>
          <div class="apc-proto-node apc-proto-node--compiler">
            <img src="/logo.svg" alt="" /><strong>Compiler</strong>
            <span>graph → write plan</span>
          </div>
          <div class="apc-proto-split"><i></i><i></i><i></i></div>
          <div class="apc-proto-output-stack">
            <div class="apc-proto-node apc-proto-node--output">
              <small>SELF-CONTAINED</small><strong>skills/**</strong>
              <span>public roots + required skills</span>
            </div>
            <div class="apc-proto-node apc-proto-node--output">
              <small>EXACT FILES</small><strong>Host manifests</strong>
              <span>Claude · Codex · Copilot · Gemini · Kimi</span>
            </div>
          </div>
        </div>
      </article>

      <article v-else-if="current === 'B'" class="apc-prototype-option">
        <header>
          <span>B · OWNERSHIP FIRST</span>
          <h2>Authored and generated lanes</h2>
          <p>Make the maintenance rule unmistakable: authors edit the top lane; the compiler owns the bottom lane.</p>
        </header>
        <div class="apc-proto-lanes">
          <div class="apc-proto-lane-label"><small>YOU OWN</small><strong>Authored</strong></div>
          <div class="apc-proto-lane">
            <div class="apc-proto-node apc-proto-node--source"><strong>plugin.yml</strong><span>model + providers + graph</span></div>
            <div class="apc-proto-node apc-proto-node--source"><strong>plugin/skills/**</strong><span>instructions + resources</span></div>
          </div>
          <div class="apc-proto-lane-center"><img src="/logo.svg" alt="" /><span>validate · plan · compile</span></div>
          <div class="apc-proto-lane-label"><small>COMPILER OWNS</small><strong>Generated</strong></div>
          <div class="apc-proto-lane">
            <div class="apc-proto-node apc-proto-node--output"><strong>skills/**</strong><span>self-contained public skills</span></div>
            <div class="apc-proto-node apc-proto-node--output"><strong>Provider files</strong><span>selected host contracts</span></div>
          </div>
        </div>
      </article>

      <article v-else-if="current === 'C'" class="apc-prototype-option">
        <header>
          <span>C · GRAPH FIRST</span>
          <h2>Dependencies become portable skills</h2>
          <p>Explain the compiler’s differentiator before the broader provider story.</p>
        </header>
        <div class="apc-proto-graph">
          <div class="apc-proto-graph-source">
            <small>plugin.yml declares the edges</small>
            <div class="apc-proto-skill apc-proto-skill--root">prepare-change-plan <b>public</b></div>
            <div class="apc-proto-graph-edge">requires ↓</div>
            <div class="apc-proto-skill">inspect-repository <b>internal</b></div>
          </div>
          <div class="apc-proto-graph-compiler"><img src="/logo.svg" alt="" /><strong>validate graph</strong><span>compile recursively</span></div>
          <div class="apc-proto-graph-result">
            <small>skills/prepare-change-plan/</small>
            <div class="apc-proto-skill apc-proto-skill--root">SKILL.md</div>
            <div class="apc-proto-skill apc-proto-skill--nested">skills/inspect-repository/SKILL.md</div>
            <span>+ selected provider manifests</span>
          </div>
        </div>
      </article>

      <article v-else class="apc-prototype-option">
        <header>
          <span>D · RELIABILITY FIRST</span>
          <h2>One plan, written and checked</h2>
          <p>Frame the product as deterministic build tooling for teams that care about drift and ownership.</p>
        </header>
        <div class="apc-proto-plan">
          <div class="apc-proto-plan-inputs">
            <div class="apc-proto-node apc-proto-node--source"><strong>Validated Plugin</strong><span>immutable domain model</span></div>
            <div class="apc-proto-node apc-proto-node--source"><strong>Provider adapters</strong><span>selected host projections</span></div>
          </div>
          <div class="apc-proto-plan-core"><small>DESIRED STATE</small><strong>WritePlan</strong><span>ordered artifacts<br />declared ownership<br />collision checked</span></div>
          <div class="apc-proto-plan-actions">
            <div><b>compile</b><span>apply atomically</span></div>
            <div><b>check</b><span>compare without writing</span></div>
          </div>
          <div class="apc-proto-node apc-proto-node--output"><small>OBSERVED STATE</small><strong>Generated snapshot</strong><span>skills tree + exact files → deterministic drift</span></div>
        </div>
      </article>
    </div>

    <nav class="apc-prototype-switcher" aria-label="Diagram variants">
      <button type="button" aria-label="Previous variant" @click="cycle(-1)">←</button>
      <div>
        <small>PROTOTYPE</small>
        <strong>{{ current }} · {{ variants.find(([key]) => key === current)?.[1] }}</strong>
      </div>
      <button type="button" aria-label="Next variant" @click="cycle(1)">→</button>
    </nav>
  </section>
</template>
