<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

type InstallChannel = {
  readonly id: string;
  readonly label: string;
  readonly command: string;
  readonly note: string;
};

type CopyResult = "idle" | "copied" | "failed";

const RESET_DELAY_MS = 2400;

const channels: readonly InstallChannel[] = [
  {
    id: "npm",
    label: "npm",
    command:
      "npm install --save-dev --save-exact @fam-tung-lam/ptlam-agent-plugin-compiler",
    note: "One exact version in the lockfile, so CI compiles with the compiler you did.",
  },
  {
    id: "homebrew",
    label: "Homebrew",
    command: "brew install fam-tung-lam/tap/ptlam-agent-plugin-compiler",
    note: "A global plugin-compiler command, with the Node.js runtime it needs.",
  },
];

const fallbackChannel = channels[0] as InstallChannel;

const selectedId = ref(fallbackChannel.id);
const copyResult = ref<CopyResult>("idle");

let resetTimer: ReturnType<typeof setTimeout> | undefined;

const selected = computed(
  () => channels.find((channel) => channel.id === selectedId.value) ?? fallbackChannel,
);

/** One flex item per argument, so the command only ever wraps at a space. */
const commandWords = computed(() => selected.value.command.split(" "));

const copyLabel = computed(() => {
  if (copyResult.value === "copied") {
    return "Copied";
  }
  return copyResult.value === "failed" ? "Copy failed" : "Copy";
});

const statusMessage = computed(() => {
  if (copyResult.value === "copied") {
    return `Copied to clipboard: ${selected.value.command}`;
  }
  if (copyResult.value === "failed") {
    return "Copy failed. Select the command and copy it manually.";
  }
  return "";
});

function clearResetTimer(): void {
  if (resetTimer !== undefined) {
    clearTimeout(resetTimer);
    resetTimer = undefined;
  }
}

/** Never leave the button in a terminal state: every result decays to idle. */
function scheduleReset(): void {
  clearResetTimer();
  resetTimer = setTimeout(() => {
    copyResult.value = "idle";
    resetTimer = undefined;
  }, RESET_DELAY_MS);
}

/**
 * Selection-based fallback for the clipboard API. `execCommand` is deprecated
 * but remains the only copy path on an insecure origin, which is where a
 * self-hosted preview of these docs will often run.
 */
function copyThroughSelection(text: string): boolean {
  const carrier = document.createElement("textarea");
  carrier.value = text;
  carrier.setAttribute("readonly", "");
  carrier.style.position = "fixed";
  carrier.style.top = "0";
  carrier.style.opacity = "0";
  document.body.append(carrier);
  carrier.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    carrier.remove();
  }
}

async function writeToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard !== undefined) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Denied permission or an insecure origin: fall through to the fallback.
    }
  }
  return copyThroughSelection(text);
}

async function copyCommand(): Promise<void> {
  const copied = await writeToClipboard(selected.value.command);
  copyResult.value = copied ? "copied" : "failed";
  scheduleReset();
}

function selectChannel(id: string): void {
  selectedId.value = id;
  clearResetTimer();
  copyResult.value = "idle";
}

onBeforeUnmount(clearResetTimer);
</script>

<template>
  <div class="apc-install">
    <div class="apc-install__channels" role="group" aria-label="Install method">
      <button
        v-for="channel in channels"
        :key="channel.id"
        type="button"
        class="apc-install__channel"
        :class="{ 'apc-install__channel--active': channel.id === selectedId }"
        :aria-pressed="channel.id === selectedId"
        @click="selectChannel(channel.id)"
      >
        {{ channel.label }}
      </button>
    </div>

    <div class="apc-install__command">
      <span class="apc-install__prompt" aria-hidden="true">$</span>
      <code class="apc-install__text"
        ><template v-for="(word, index) in commandWords" :key="index"
          >{{ index === 0 ? "" : " "
          }}<span class="apc-install__word">{{ word }}</span></template
        ></code
      >
      <button
        type="button"
        class="apc-install__copy"
        :data-state="copyResult"
        @click="copyCommand"
      >
        <svg
          v-if="copyResult === 'copied'"
          class="apc-install__icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m3 8.5 3.5 3.5L13 4.5" />
        </svg>
        <svg
          v-else
          class="apc-install__icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="5.5" y="5.5" width="9" height="9" rx="2" />
          <path d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3" />
        </svg>
        <span>{{ copyLabel }}</span>
        <span class="apc-sr-only"> the {{ selected.label }} install command</span>
      </button>
    </div>

    <p class="apc-install__note">{{ selected.note }}</p>
    <span class="apc-sr-only" role="status" aria-live="polite">{{ statusMessage }}</span>
  </div>
</template>
