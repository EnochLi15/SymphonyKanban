<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="app-main">
      <div class="app-page">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from "./AppSidebar.vue";
</script>
