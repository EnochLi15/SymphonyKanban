<template>
  <div class="opencode-panel-wrap" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="panel">
      <div class="panel-title-row">
        <div class="panel-title">Opencode 会话</div>
        <button
          v-if="sessionUrl"
          class="fullscreen-toggle"
          type="button"
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? "退出全屏" : "全屏" }}
        </button>
      </div>
      <div class="panel-body">
        <div v-if="sessionUrl" class="iframe-wrap">
          <iframe
            class="session-iframe"
            :src="sessionUrl"
            title="opencode-session"
            loading="lazy"
          />
        </div>
        <div v-else class="panel-empty">暂无会话</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";

defineProps<{ sessionUrl: string }>();

const isFullscreen = ref(false);

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

watch(isFullscreen, (next) => {
  document.body.style.overflow = next ? "hidden" : "";
});

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<style scoped>
.opencode-panel-wrap.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: #0b0b0b;
  padding: 24px;
  box-sizing: border-box;
}

.panel {
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  padding: 16px;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.panel-body {
  display: flex;
  flex-direction: column;
}

.iframe-wrap {
  border-radius: 8px;
  border: 1px solid var(--kanban-border);
  overflow: hidden;
  background: var(--kanban-muted);
}

.session-iframe {
  width: 100%;
  height: 800px;
  border: none;
}

.panel-empty {
  font-size: 13px;
  color: var(--kanban-text-secondary);
}

.fullscreen-toggle {
  border: 1px solid var(--kanban-border);
  background: var(--kanban-surface);
  color: var(--kanban-text-primary);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
}

.opencode-panel-wrap.is-fullscreen .session-iframe {
  height: calc(100vh - 120px);
}
</style>
